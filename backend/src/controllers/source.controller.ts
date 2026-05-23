import { Request, Response } from 'express';
import { prisma, vectorDB } from '../db';
import { uploadTextToS3, deleteFromS3 } from '../services/storage.service';
import { deleteChunksBySource } from '../rag/ingestion/vectorStore';
import { addIngestionJob } from '../jobs/ingestion.queue';
import { ChatbotService } from '../services/chatbot.service';

export class SourceController {
    /**
     * GET /api/v1/workspaces/:workspaceId/sources
     * Gets all sources for a given workspace.
     * Optionally filters by type via ?type=pdf,text,url
     */
    static async getSources(req: Request, res: Response): Promise<any> {
        try {
            const workspaceId = req.params.workspaceId as string;
            const userId = (req as any).user.id;
            const { type } = req.query;

            // Verify the workspace belongs to the authenticated user
            const workspace = await prisma.workspace.findFirst({
                where: { id: workspaceId, ownerId: userId }
            });

            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found or unauthorized' });
            }

            // Build query conditions
            const whereClause: any = { workspaceId };

            if (type && typeof type === 'string') {
                // Allow filtering by multiple types e.g. ?type=pdf,text
                const typesArray = type.split(',').map(t => t.trim().toLowerCase());
                whereClause.type = { in: typesArray };
            }

            const sources = await prisma.source.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' }
            });

            return res.status(200).json(sources);
        } catch (err: any) {
            console.error('[SourceController] Error fetching sources:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * POST /api/v1/workspaces/:workspaceId/sources
     * Create copy-pasted text source or url source
     */
    static async createSource(req: Request, res: Response): Promise<any> {
        try {
            const workspaceId = req.params.workspaceId as string;
            const userId = (req as any).user.id;
            const { type, name, rawText, url, chatbotId } = req.body;

            const workspace = await prisma.workspace.findFirst({
                where: { id: workspaceId, ownerId: userId }
            });
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found or unauthorized' });
            }

            if (!type || !['text', 'url'].includes(type)) {
                return res.status(400).json({ error: 'Invalid or missing source type (must be text or url)' });
            }

            if (!name) {
                return res.status(400).json({ error: 'Source name is required' });
            }

            let rawContentUrl = '';
            let fileSize = 0;
            let mimeType = '';

            if (type === 'text') {
                if (!rawText) {
                    return res.status(400).json({ error: 'rawText content is required for text source' });
                }
                rawContentUrl = await uploadTextToS3(rawText, workspaceId);
                fileSize = Buffer.byteLength(rawText, 'utf8');
                mimeType = 'text/plain';
            } else if (type === 'url') {
                if (!url) {
                    return res.status(400).json({ error: 'url is required for url source' });
                }
                try {
                    new URL(url);
                } catch {
                    return res.status(400).json({ error: 'Invalid URL provided' });
                }
                rawContentUrl = url;
                mimeType = 'text/html';
            }

            const sourceRecord = await prisma.source.create({
                data: {
                    name,
                    type,
                    rawContentUrl,
                    fileSize: fileSize || null,
                    mimeType,
                    status: 'PENDING',
                    workspaceId
                }
            });

            const sourceId = sourceRecord.id;

            if (chatbotId) {
                await ChatbotService.getChatbotById(workspaceId, chatbotId, userId);
                
                await prisma.chatbotSource.upsert({
                    where: {
                        chatbotId_sourceId: {
                            chatbotId,
                            sourceId
                        }
                    },
                    update: {},
                    create: {
                        chatbotId,
                        sourceId
                    }
                });

                await prisma.chatbot.update({
                    where: { id: chatbotId },
                    data: {
                        sourceIds: { push: sourceId }
                    }
                });
            }

            await addIngestionJob({
                s3Key: rawContentUrl,
                sourceId,
                workspaceId,
                fileType: type as any,
                chatbotId
            });

            return res.status(202).json({
                message: 'Source created and queued for ingestion',
                sourceId,
                status: 'PENDING'
            });

        } catch (err: any) {
            console.error('[SourceController] Error creating source:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * GET /api/v1/workspaces/:workspaceId/sources/:sourceId/preview
     * Consolidates parsed chunk contents for preview
     */
    static async getSourcePreview(req: Request, res: Response): Promise<any> {
        try {
            const workspaceId = req.params.workspaceId as string;
            const sourceId = req.params.sourceId as string;
            const userId = (req as any).user.id;

            const workspace = await prisma.workspace.findFirst({
                where: { id: workspaceId, ownerId: userId }
            });
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found or unauthorized' });
            }

            const source = await prisma.source.findFirst({
                where: { id: sourceId, workspaceId }
            });
            if (!source) {
                return res.status(404).json({ error: 'Source not found' });
            }

            const { data, error } = await vectorDB
                .from('chunks')
                .select('content')
                .eq('source_id', sourceId)
                .order('chunk_index', { ascending: true });

            if (error) throw error;

            const text = (data || []).map((c: any) => c.content).join('\n\n');
            return res.status(200).json({ text });

        } catch (err: any) {
            console.error('[SourceController] Error getting source preview:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * DELETE /api/v1/workspaces/:workspaceId/sources/:sourceId
     * Deletes source files, entries, and vector database chunks
     */
    static async deleteSource(req: Request, res: Response): Promise<any> {
        try {
            const workspaceId = req.params.workspaceId as string;
            const sourceId = req.params.sourceId as string;
            const userId = (req as any).user.id;

            const workspace = await prisma.workspace.findFirst({
                where: { id: workspaceId, ownerId: userId }
            });
            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found or unauthorized' });
            }

            const source = await prisma.source.findFirst({
                where: { id: sourceId, workspaceId }
            });
            if (!source) {
                return res.status(404).json({ error: 'Source not found' });
            }

            if (source.rawContentUrl && source.type !== 'url') {
                try {
                    await deleteFromS3(source.rawContentUrl);
                } catch (s3Err) {
                    console.warn(`[SourceController] Failed to delete S3 key ${source.rawContentUrl}:`, s3Err);
                }
            }

            try {
                await deleteChunksBySource(sourceId);
            } catch (vErr) {
                console.warn(`[SourceController] Failed to delete chunks for source ${sourceId}:`, vErr);
            }

            await prisma.source.delete({
                where: { id: sourceId }
            });

            return res.status(204).send();

        } catch (err: any) {
            console.error('[SourceController] Error deleting source:', err);
            return res.status(500).json({ error: err.message });
        }
    }
}
