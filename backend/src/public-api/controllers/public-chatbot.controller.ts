import { Response } from 'express';
import { prisma } from '../../db';
import { PublicApiRequest } from '../middleware/public-auth.middleware';
import { ConversationService } from '../../services/chat-core/conversation.service';
import { RagService } from '../../services/chat-core/rag.service';
import { addIngestionJob } from '../../jobs/ingestion.queue';
import { Role, SourceType } from '../../types';

export class PublicChatbotController {
    /**
     * GET /public/v1/chatbots
     * List all chatbots in the workspace
     */
    static async listChatbots(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbots = await prisma.chatbot.findMany({
                where: { workspaceId },
                select: {
                    id: true,
                    name: true,
                    systemPrompt: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            return res.status(200).json({ success: true, data: chatbots });
        } catch (error: any) {
            console.error('[PublicChatbotController] List chatbots error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * GET /public/v1/chatbots/:chatbotId
     * Get a specific chatbot details
     */
    static async getChatbot(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;

            const chatbot = await prisma.chatbot.findFirst({
                where: { id: chatbotId, workspaceId },
                include: {
                    telegramSetting: {
                        select: { botUsername: true, isActive: true }
                    },
                    widgetSetting: {
                        select: { allowedDomains: true, welcomeMessage: true, isActive: true }
                    }
                }
            });

            if (!chatbot) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Chatbot not found or unauthorized.' }
                });
            }

            return res.status(200).json({ success: true, data: chatbot });
        } catch (error: any) {
            console.error('[PublicChatbotController] Get chatbot error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * POST /public/v1/chatbots/:chatbotId/chat
     * Non-streaming programmatic chat
     */
    static async chat(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const { message, conversationId } = req.body;

            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'A non-empty string message is required.' }
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

            // Resolve conversation session
            let conversation;
            if (conversationId) {
                conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId }
                });
                if (!conversation || conversation.chatbotId !== chatbotId) {
                    return res.status(404).json({
                        error: { code: 'NOT_FOUND', message: 'Conversation session not found or does not belong to this chatbot.' }
                    });
                }
            } else {
                conversation = await prisma.conversation.create({
                    data: {
                        channel: 'api',
                        chatbotId,
                        status: 'active'
                    }
                });
            }

            // format history
            const history = await ConversationService.getRecentHistory(conversation.id, 6);
            const historyFormatted = history.map(m => ({ role: m.role as Role, content: m.content }));

            // Save user message
            await ConversationService.saveMessage(conversation.id, 'user', message);

            // Execute RAG Query
            const ragResponse = await RagService.runQuery({
                chatbotId,
                query: message,
                history: historyFormatted,
                mode: 'general',
                stream: false
            });

            if ('text' in ragResponse && ragResponse.text) {
                await ConversationService.saveMessage(conversation.id, 'assistant', ragResponse.text, ragResponse.citations);
                return res.status(200).json({
                    success: true,
                    data: {
                        conversationId: conversation.id,
                        status: conversation.status,
                        response: ragResponse.text,
                        citations: ragResponse.citations
                    }
                });
            }

            throw new Error('RAG query returned no text response.');
        } catch (error: any) {
            console.error('[PublicChatbotController] Chat error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * POST /public/v1/chatbots/:chatbotId/chat/stream
     * Streaming programmatic chat via SSE
     */
    static async chatStream(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const { message, conversationId } = req.body;

            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST', message: 'A non-empty string message is required.' }
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

            // Resolve conversation session
            let conversation;
            if (conversationId) {
                conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId }
                });
                if (!conversation || conversation.chatbotId !== chatbotId) {
                    return res.status(404).json({
                        error: { code: 'NOT_FOUND', message: 'Conversation session not found or does not belong to this chatbot.' }
                    });
                }
            } else {
                conversation = await prisma.conversation.create({
                    data: {
                        channel: 'api',
                        chatbotId,
                        status: 'active'
                    }
                });
            }

            // format history
            const history = await ConversationService.getRecentHistory(conversation.id, 6);
            const historyFormatted = history.map(m => ({ role: m.role as Role, content: m.content }));

            // Save user message
            await ConversationService.saveMessage(conversation.id, 'user', message);

            // Execute Streaming RAG Query
            const ragResponse = await RagService.runQuery({
                chatbotId,
                query: message,
                history: historyFormatted,
                mode: 'general',
                stream: true
            });

            if ('stream' in ragResponse && ragResponse.stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                res.write(`event: start\ndata: ${JSON.stringify({ conversationId: conversation.id, status: conversation.status })}\n\n`);

                let fullContent = '';
                for await (const chunk of ragResponse.stream) {
                    const chunkText = chunk.text();
                    fullContent += chunkText;
                    res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunkText })}\n\n`);
                }

                await ConversationService.saveMessage(conversation.id, 'assistant', fullContent, ragResponse.citations);

                res.write(`event: done\ndata: ${JSON.stringify({ done: true, citations: ragResponse.citations, conversationId: conversation.id })}\n\n`);
                return res.end();
            }

            throw new Error('RAG query returned no stream response.');
        } catch (error: any) {
            console.error('[PublicChatbotController] Chat stream error:', error);
            if (!res.headersSent) {
                return res.status(500).json({
                    error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
                });
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
                return res.end();
            }
        }
    }

    /**
     * POST /public/v1/chatbots/:chatbotId/train
     * Trigger / rebuild processing for all pending or failed sources of a chatbot
     */
    static async trainChatbot(req: PublicApiRequest, res: Response): Promise<any> {
        try {
            const workspaceId = req.apiWorkspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const { force } = req.body || {};

            // Verify chatbot ownership
            const chatbot = await prisma.chatbot.findFirst({
                where: { id: chatbotId, workspaceId }
            });
            if (!chatbot) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Chatbot not found or unauthorized.' }
                });
            }

            // Retrieve all chatbot sources
            const chatbotSources = await prisma.chatbotSource.findMany({
                where: { chatbotId },
                include: { source: true }
            });

            let queuedCount = 0;
            for (const cs of chatbotSources) {
                const s = (cs as any).source;
                if (force === true || s.status === 'PENDING' || s.status === 'FAILED') {
                    // Update source status to pending
                    await prisma.source.update({
                        where: { id: s.id },
                        data: { status: 'PENDING', errorMsg: null }
                    });

                    // Add to ingestion background queue
                    await addIngestionJob({
                        s3Key: s.rawContentUrl || '',
                        sourceId: s.id,
                        workspaceId,
                        fileType: s.type as SourceType,
                        chatbotId
                    });
                    queuedCount++;
                }
            }

            return res.status(200).json({
                success: true,
                message: `Training triggered successfully. Queued ${queuedCount} source(s) for background processing.`,
                data: {
                    totalSources: chatbotSources.length,
                    queuedSourcesCount: queuedCount
                }
            });
        } catch (error: any) {
            console.error('[PublicChatbotController] Train chatbot error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }

    /**
     * GET /public/v1/chatbots/:chatbotId/training-status
     * Check training and synchronization status of a chatbot
     */
    static async getTrainingStatus(req: PublicApiRequest, res: Response): Promise<any> {
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

            // Retrieve sources
            const chatbotSources = await prisma.chatbotSource.findMany({
                where: { chatbotId },
                include: { source: true }
            });

            const total = chatbotSources.length;
            const ready = chatbotSources.filter(cs => (cs as any).source.status === 'READY').length;
            const processing = chatbotSources.filter(cs => (cs as any).source.status === 'PROCESSING').length;
            const pending = chatbotSources.filter(cs => (cs as any).source.status === 'PENDING').length;
            const failed = chatbotSources.filter(cs => (cs as any).source.status === 'FAILED').length;

            let overallStatus = 'READY';
            if (processing > 0) overallStatus = 'PROCESSING';
            else if (pending > 0) overallStatus = 'PENDING';
            else if (failed > 0 && ready === 0) overallStatus = 'FAILED';
            else if (failed > 0) overallStatus = 'PARTIAL_SUCCESS';
            else if (total === 0) overallStatus = 'NO_SOURCES';

            return res.status(200).json({
                success: true,
                data: {
                    status: overallStatus,
                    totalSourcesCount: total,
                    breakdown: {
                        ready,
                        processing,
                        pending,
                        failed
                    }
                }
            });
        } catch (error: any) {
            console.error('[PublicChatbotController] Get training status error:', error);
            return res.status(500).json({
                error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
            });
        }
    }
}
