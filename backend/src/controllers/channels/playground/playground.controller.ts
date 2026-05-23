import { Request, Response } from 'express';
import { ConversationService } from '../../../services/chat-core/conversation.service';
import { RagService, ChatMode } from '../../../services/chat-core/rag.service';

export class PlaygroundController {
    static async createConversation(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const { title } = req.body || {};
            const userId = (req as any).user.id;

            // Verify chatbot exists and user owns the workspace
            await ConversationService.verifyChatbotAccess(chatbotId, userId);

            const conversation = await ConversationService.createConversation(
                chatbotId,
                userId,
                title || 'New Conversation',
                'playground'
            );

            res.status(201).json(conversation);
        } catch (err: any) {
            console.error('[Playground] Create error:', err);
            res.status(err.message.includes('Unauthorized') ? 403 : 500).json({ error: err.message });
        }
    }

    static async sendMessage(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const conversationId = req.params.conversationId as string;
            const { message, stream, mode } = req.body || {};
            const userId = (req as any).user.id;

            // Input validation
            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({ error: 'Valid message string is required' });
            }

            // 1. Verify chatbot & workspace ownership safely
            await ConversationService.verifyChatbotAccess(chatbotId, userId);

            // 2. Verify conversation ownership and state
            const conversation = await ConversationService.getConversationById(conversationId, userId);
            if (!conversation || conversation.chatbotId !== chatbotId) {
                return res.status(404).json({ error: 'Conversation not found or unauthorized' });
            }

            if (conversation.status === 'closed') {
                return res.status(400).json({ error: 'Cannot send messages to a closed conversation' });
            }

            // 3. Load recent history BEFORE saving current user message (prevents duplicating prompt input)
            const history = await ConversationService.getRecentHistory(conversationId, 6);
            const historyFormatted = history.map(m => ({ role: m.role, content: m.content }));

            // 4. Save user message
            await ConversationService.saveMessage(conversationId, 'user', message);

            // 5. Smart Title Strategy: If title is still default, update it using first message
            if (conversation.title === 'New Conversation' || !conversation.title) {
                const smartTitle = message.trim().slice(0, 32) + (message.length > 32 ? '...' : '');
                await ConversationService.updateTitle(conversationId, smartTitle);
            }

            // 6. Run RAG Pipeline
            const ragResponse = await RagService.runQuery({
                chatbotId,
                query: message,
                history: historyFormatted,
                mode: (mode as ChatMode) || 'general',
                stream: stream === true
            });

            // 7. Handle Stream vs Standard Response
            if (stream === true && 'stream' in ragResponse && ragResponse.stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                // Standardized SSE format
                res.write(`event: start\ndata: ${JSON.stringify({ conversationId, mode: mode || 'general' })}\n\n`);

                let fullContent = '';
                // ragResponse.stream is directly the AsyncGenerator now
                for await (const chunk of ragResponse.stream) {
                    const chunkText = chunk.text();
                    fullContent += chunkText;
                    res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunkText })}\n\n`);
                }

                // Save assistant message at the end
                await ConversationService.saveMessage(conversationId, 'assistant', fullContent, ragResponse.citations);
                
                res.write(`event: done\ndata: ${JSON.stringify({ done: true, citations: ragResponse.citations, conversationId })}\n\n`);
                res.end();
            } else if ('text' in ragResponse && ragResponse.text) {
                // Save assistant message
                await ConversationService.saveMessage(conversationId, 'assistant', ragResponse.text, ragResponse.citations);
                
                res.json({
                    conversationId,
                    response: ragResponse.text,
                    citations: ragResponse.citations
                });
            }
        } catch (err: any) {
            console.error('[Playground] Message error:', err);
            if (!res.headersSent) {
                res.status(err.message.includes('Unauthorized') ? 403 : 500).json({ error: err.message });
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                res.end();
            }
        }
    }

    static async listConversations(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const status = req.query.status as string | undefined;
            const userId = (req as any).user.id;

            await ConversationService.verifyChatbotAccess(chatbotId, userId);

            const conversations = await ConversationService.getConversationsByChatbot(
                chatbotId,
                userId,
                status
            );

            res.json(conversations);
        } catch (err: any) {
            res.status(err.message.includes('Unauthorized') ? 403 : 500).json({ error: err.message });
        }
    }

    static async getConversation(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const conversationId = req.params.conversationId as string;
            const userId = (req as any).user.id;

            await ConversationService.verifyChatbotAccess(chatbotId, userId);

            const conversation = await ConversationService.getConversationById(conversationId, userId);
            if (!conversation || conversation.chatbotId !== chatbotId) {
                return res.status(404).json({ error: 'Conversation not found or unauthorized' });
            }

            res.json(conversation);
        } catch (err: any) {
            res.status(err.message.includes('Unauthorized') ? 403 : 500).json({ error: err.message });
        }
    }

    static async closeConversation(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const conversationId = req.params.conversationId as string;
            const userId = (req as any).user.id;

            await ConversationService.verifyChatbotAccess(chatbotId, userId);

            await ConversationService.closeConversation(conversationId, userId);
            res.json({ success: true, conversationId });
        } catch (err: any) {
            res.status(err.message.includes('Unauthorized') ? 403 : 500).json({ error: err.message });
        }
    }
}
