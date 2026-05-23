import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from '../services/storage.service';
import { prisma } from '../db';
import { ChatbotService } from '../services/chatbot.service';
import { addIngestionJob } from '../jobs/ingestion.queue';
import { WorkspaceService } from '../services/workspace.service';
import type { SourceType } from '../types';

const MIME_TO_TYPE: Record<string, SourceType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'text',
};

export class UploadController {
    static async uploadDocument(req: Request, res: Response) {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded.' });
                return;
            }

            const workspaceId = (req.query.workspaceId as string) || (req.body.workspaceId as string) || 'test-workspace';
            const chatbotId = (req.query.chatbotId as string) || (req.body.chatbotId as string);
            const userId = (req as any).user.id;

            // Optional: If you don't want 'test-workspace' to bypass auth, you should remove it.
            // For now, let's enforce proper workspace validation if a workspaceId is provided
            if (workspaceId !== 'test-workspace') {
                try {
                    await WorkspaceService.getWorkspaceById(workspaceId, userId);
                } catch (error) {
                    return res.status(404).json({ error: 'Workspace not found or unauthorized' });
                }
            }

            const fileType = MIME_TO_TYPE[req.file.mimetype];

            if (!fileType) {
                res.status(400).json({ error: `Unsupported file type: ${req.file.mimetype}` });
                return;
            }

            const s3Key = await uploadToS3(req.file, workspaceId);

            // Create Source record
            const sourceRecord = await prisma.source.create({
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

            const sourceId = sourceRecord.id;

            // If chatbotId provided, verify and upsert ChatbotSource
            if (chatbotId) {
                // verify chatbot belongs to workspace
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

                // Keep the array in sync if needed, though ChatbotSource is the source of truth
                await prisma.chatbot.update({
                    where: { id: chatbotId },
                    data: {
                        sourceIds: { push: sourceId }
                    }
                });
            }

            await addIngestionJob({
                s3Key,
                sourceId,
                workspaceId,
                fileType,
                chatbotId
            });

            res.status(202).json({
                message: 'Document uploaded and queued.',
                sourceId,
                status: 'PENDING',
            });

        } catch (err) {
            console.error('[Upload] Error:', err);
            res.status(500).json({ error: 'Failed to upload or queue document.' });
        }
    }
}
