import { Response } from 'express';
import { prisma } from '../../db';
import { PublicApiRequest } from '../middleware/public-auth.middleware';
import { uploadToS3, uploadTextToS3, deleteFromS3 } from '../../services/storage.service';
import { addIngestionJob } from '../../jobs/ingestion.queue';
import { clearSourceChunks } from '../../rag/ingestion/storer';
import { SourceType } from '../../types';

const MIME_TO_TYPE: Record<string, SourceType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'text',
};

export class PublicSourceController {
    /**
     * GET /public/v1/chatbots/:chatbotId/sources
     * List all sources linked to a chatbot
     */
    static async listSources(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;

            // Verify chatbot ownership
            const chatbot = await prisma.chatbot.findFirst({
                where: { id: chatbotId, workspaceId }
            });
            if (!chatbot) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Chatbot not found or unauthorized.' }
                });
            }

            const chatbotSources = await prisma.chatbotSource.findMany({
                where: { chatbotId },
                include: {
                    source: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            status: true,
                            fileSize: true,
                            chunkCount: true,
                            errorMsg: true,
                            syncedAt: true,
                            createdAt: true
                        }
                    }
                }
            });

            const sourcesList = chatbotSources.map(cs => (cs as any).source);

            return res.status(200).json({ success: true, data: sourcesList });
        } catch (error: any) {
            console.error('[PublicSourceController] List sources error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * POST /public/v1/chatbots/:chatbotId/sources/file
     * Upload a PDF, DOCX, or TXT file source
     */
    static async uploadFileSource(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;

            if (!req.file) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'No file uploaded in the request (use the field name "file").' }
                });
            }

            // Verify chatbot ownership
            const chatbot = await prisma.chatbot.findFirst({
                where: { id: chatbotId, workspaceId }
            });
            if (!chatbot) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Chatbot not found or unauthorized.' }
                });
            }

            const fileType = MIME_TO_TYPE[req.file.mimetype];
            if (!fileType) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: `Unsupported file type: ${req.file.mimetype}. Supported types: PDF, DOCX, TXT.` }
                });
            }

            // Upload to S3
            const s3Key = await uploadToS3(req.file, workspaceId);

            // Create Source
            const source = await prisma.source.create({
                data: {
                    name: req.file.originalname,
                    type: fileType,
                    rawContentUrl: s3Key,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    status: 'PENDING',
                    workspaceId
                }
            });

            // Link to chatbot
            await prisma.chatbotSource.upsert({
                where: { chatbotId_sourceId: { chatbotId, sourceId: source.id } },
                update: {},
                create: { chatbotId, sourceId: source.id }
            });

            // Sync Chatbot sourceIds array
            await prisma.chatbot.update({
                where: { id: chatbotId },
                data: { sourceIds: { push: source.id } }
            });

            // Add ingestion job
            await addIngestionJob({
                s3Key,
                sourceId: source.id,
                workspaceId,
                fileType,
                chatbotId
            });

            return res.status(202).json({
                success: true,
                message: 'File source uploaded successfully and queued for background indexing.',
                data: {
                    sourceId: source.id,
                    name: source.name,
                    status: source.status
                }
            });
        } catch (error: any) {
            console.error('[PublicSourceController] File upload error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * POST /public/v1/chatbots/:chatbotId/sources/text
     * Upload raw text content directly
     */
    static async addTextSource(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const { name, content } = req.body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'Source "name" is a required string parameter.' }
                });
            }

            if (!content || typeof content !== 'string' || !content.trim()) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'Source "content" is a required string parameter.' }
                });
            }

            // Verify chatbot ownership
            const chatbot = await prisma.chatbot.findFirst({
                where: { id: chatbotId, workspaceId }
            });
            if (!chatbot) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Chatbot not found or unauthorized.' }
                });
            }

            // Upload raw string text to S3
            const s3Key = await uploadTextToS3(content, workspaceId);

            // Create Source
            const source = await prisma.source.create({
                data: {
                    name: name.trim(),
                    type: 'text',
                    rawContentUrl: s3Key,
                    fileSize: Buffer.byteLength(content, 'utf-8'),
                    mimeType: 'text/plain',
                    status: 'PENDING',
                    workspaceId
                }
            });

            // Link to chatbot
            await prisma.chatbotSource.upsert({
                where: { chatbotId_sourceId: { chatbotId, sourceId: source.id } },
                update: {},
                create: { chatbotId, sourceId: source.id }
            });

            // Sync Chatbot sourceIds array
            await prisma.chatbot.update({
                where: { id: chatbotId },
                data: { sourceIds: { push: source.id } }
            });

            // Add ingestion job
            await addIngestionJob({
                s3Key,
                sourceId: source.id,
                workspaceId,
                fileType: 'text',
                chatbotId
            });

            return res.status(202).json({
                success: true,
                message: 'Text source added successfully and queued for background indexing.',
                data: {
                    sourceId: source.id,
                    name: source.name,
                    status: source.status
                }
            });
        } catch (error: any) {
            console.error('[PublicSourceController] Add text source error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * POST /public/v1/chatbots/:chatbotId/sources/url
     * Add and crawl a URL source
     */
    static async addUrlSource(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const { url } = req.body;

            if (!url || typeof url !== 'string' || !url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'A valid absolute URL starting with http:// or https:// is required.' }
                });
            }

            // Verify chatbot ownership
            const chatbot = await prisma.chatbot.findFirst({
                where: { id: chatbotId, workspaceId }
            });
            if (!chatbot) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Chatbot not found or unauthorized.' }
                });
            }

            // Create Source
            const source = await prisma.source.create({
                data: {
                    name: url.trim(),
                    type: 'url',
                    rawContentUrl: url.trim(),
                    mimeType: 'text/html',
                    status: 'PENDING',
                    workspaceId
                }
            });

            // Link to chatbot
            await prisma.chatbotSource.upsert({
                where: { chatbotId_sourceId: { chatbotId, sourceId: source.id } },
                update: {},
                create: { chatbotId, sourceId: source.id }
            });

            // Sync Chatbot sourceIds array
            await prisma.chatbot.update({
                where: { id: chatbotId },
                data: { sourceIds: { push: source.id } }
            });

            // Add ingestion job
            await addIngestionJob({
                s3Key: url.trim(),
                sourceId: source.id,
                workspaceId,
                fileType: 'url',
                chatbotId
            });

            return res.status(202).json({
                success: true,
                message: 'URL source added successfully and queued for background scraping and indexing.',
                data: {
                    sourceId: source.id,
                    name: source.name,
                    status: source.status
                }
            });
        } catch (error: any) {
            console.error('[PublicSourceController] Add URL source error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * GET /public/v1/sources/:sourceId
     * Get a specific source sync/training status
     */
    static async getSourceStatus(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const sourceId = req.params.sourceId as string;

            const source = await prisma.source.findFirst({
                where: { id: sourceId, workspaceId }
            });

            if (!source) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Source not found or unauthorized.' }
                });
            }

            return res.status(200).json({ success: true, data: source });
        } catch (error: any) {
            console.error('[PublicSourceController] Get source status error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * POST /public/v1/sources/:sourceId/process
     * Manually trigger processing for a specific source
     */
    static async processSource(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const sourceId = req.params.sourceId as string;

            const source = await prisma.source.findFirst({
                where: { id: sourceId, workspaceId }
            });

            if (!source) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Source not found or unauthorized.' }
                });
            }

            // Find associated chatbot link if any
            const chatbotSource = await prisma.chatbotSource.findFirst({
                where: { sourceId }
            });

            // Update status back to pending
            await prisma.source.update({
                where: { id: sourceId },
                data: { status: 'PENDING', errorMsg: null }
            });

            // Trigger ingestion job
            await addIngestionJob({
                s3Key: source.rawContentUrl || '',
                sourceId: source.id,
                workspaceId,
                fileType: source.type as SourceType,
                chatbotId: chatbotSource?.chatbotId
            });

            return res.status(200).json({
                success: true,
                message: 'Source reprocessing triggered successfully and queued.',
                data: {
                    sourceId: source.id,
                    status: 'PENDING'
                }
            });
        } catch (error: any) {
            console.error('[PublicSourceController] Process source error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * DELETE /public/v1/sources/:sourceId
     * Delete a source from the DB, AWS S3, and Supabase Vector database
     */
    static async deleteSource(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const sourceId = req.params.sourceId as string;

            const source = await prisma.source.findFirst({
                where: { id: sourceId, workspaceId }
            });

            if (!source) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Source not found or unauthorized.' }
                });
            }

            console.log(`[PublicSourceController] Deleting source ${sourceId} (${source.name})`);

            // 1. Delete vector chunks from Vector DB
            await clearSourceChunks(sourceId).catch(err => {
                console.error(`[PublicSourceController] Failed to delete vectors for source ${sourceId}:`, err);
            });

            // 2. Delete file from AWS S3 if it's a file or text source
            if (source.type !== 'url' && source.rawContentUrl) {
                await deleteFromS3(source.rawContentUrl).catch(err => {
                    console.error(`[PublicSourceController] Failed to delete file from S3: ${source.rawContentUrl}:`, err);
                });
            }

            // 3. Delete Source record from database (Prisma Cascade handles ChatbotSource mapping)
            await prisma.source.delete({
                where: { id: sourceId }
            });

            return res.status(204).send();
        } catch (error: any) {
            console.error('[PublicSourceController] Delete source error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }
}
