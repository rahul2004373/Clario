import { Request, Response } from 'express';
import { WidgetService } from '../../../services/chat-core/widget.service';
import { ConversationService } from '../../../services/chat-core/conversation.service';
import { RagService } from '../../../services/chat-core/rag.service';
import { prisma } from '../../../db';

export class WidgetController {
    // ─── Management API (Dashboard Auth Required) ────────────────────────────
    static async getWidgetSettings(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const userId = (req as any).user.id;

            const settings = await WidgetService.getOrCreateWidgetSetting(chatbotId, workspaceId, userId);
            res.json(settings);
        } catch (err: any) {
            res.status(err.message.includes('unauthorized') ? 403 : 500).json({ error: err.message });
        }
    }

    static async updateWidgetSettings(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const chatbotId = req.params.chatbotId as string;
            const userId = (req as any).user.id;
            const { allowedDomains, welcomeMessage, themeConfig, isActive } = req.body;

            const settings = await WidgetService.updateWidgetSetting(chatbotId, workspaceId, userId, {
                allowedDomains, welcomeMessage, themeConfig, isActive
            });
            res.json(settings);
        } catch (err: any) {
            res.status(err.message.includes('unauthorized') ? 403 : 500).json({ error: err.message });
        }
    }

    // ─── Public Widget API (CORS / Origin Validated) ─────────────────────────

    static async initializeSession(req: Request, res: Response) {
        try {
            const widgetToken = req.params.widgetToken as string;
            const origin = req.headers.origin || req.headers.referer;
            const { visitorId, user } = req.body || {};

            // 1. Validate domain security
            const widgetSetting = await WidgetService.validateWidgetOrigin(widgetToken, origin);

            // 2. Identify or create visitor
            const visitor = await WidgetService.getOrCreateVisitor(widgetToken, visitorId, user);

            // 3. Manage session (Active / Inactive / Closed logic)
            const conversation = await WidgetService.manageConversationSession(visitor.id, widgetSetting.chatbotId);

            res.json({
                visitorId: visitor.id,
                conversationId: conversation.id,
                status: conversation.status,
                chatbot: {
                    name: widgetSetting.chatbot.name,
                    welcomeMessage: widgetSetting.welcomeMessage,
                    themeConfig: widgetSetting.themeConfig
                }
            });
        } catch (err: any) {
            console.error('[Widget] Session init error:', err);
            res.status(err.message.includes('authorized') || err.message.includes('inactive') ? 403 : 500).json({ error: err.message });
        }
    }

    static async sendMessage(req: Request, res: Response) {
        try {
            const widgetToken = req.params.widgetToken as string;
            const origin = req.headers.origin || req.headers.referer;
            const { visitorId, conversationId, message, stream } = req.body || {};

            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({ error: 'Valid message string is required' });
            }

            if (!visitorId || !conversationId) {
                return res.status(400).json({ error: 'visitorId and conversationId are required' });
            }

            // 1. Validate domain security
            const widgetSetting = await WidgetService.validateWidgetOrigin(widgetToken, origin);

            // 2. Ensure visitor exists
            const visitor = await WidgetService.getOrCreateVisitor(widgetToken, visitorId);

            // 3. Evaluate session inactivity policy before processing
            let conversationCheck = await WidgetService.getWidgetConversation(conversationId, visitor.id);
            if (!conversationCheck || conversationCheck.chatbotId !== widgetSetting.chatbotId) {
                return res.status(404).json({ error: 'Conversation not found or unauthorized' });
            }

            let activeConvId = conversationCheck.id;
            const now = new Date();
            const diffMins = (now.getTime() - conversationCheck.updatedAt.getTime()) / (1000 * 60);

            if (conversationCheck.status === 'closed' || diffMins >= 60) {
                // If closed or inactive > 60 mins -> mark closed if not already, and spawn fresh session!
                if (conversationCheck.status !== 'closed') {
                    await WidgetService.closeWidgetConversation(conversationCheck.id, visitor.id, 'auto_expired_60m');
                }
                const newConv = await WidgetService.manageConversationSession(visitor.id, widgetSetting.chatbotId);
                activeConvId = newConv.id;
            } else if (conversationCheck.status === 'inactive') {
                // Inactive between 20-60 mins, but user sent message -> wake up session to active
                await prisma.conversation.update({
                    where: { id: conversationCheck.id },
                    data: { status: 'active', updatedAt: now }
                });
            }

            // Refetch active conversation to ensure clean object state
            const activeConv = await WidgetService.getWidgetConversation(activeConvId, visitor.id);
            if (!activeConv) {
                return res.status(500).json({ error: 'Failed to resolve active conversation' });
            }

            // 4. Load history (excluding current query)
            const history = await ConversationService.getRecentHistory(activeConv.id, 6);
            const historyFormatted = history.map(m => ({ role: m.role, content: m.content }));

            // 5. Save user message
            await ConversationService.saveMessage(activeConv.id, 'user', message);

            // 6. Run RAG Pipeline
            const ragResponse = await RagService.runQuery({
                chatbotId: widgetSetting.chatbotId,
                query: message,
                history: historyFormatted,
                mode: 'general',
                stream: stream === true
            });

            // 7. Stream vs Standard Response
            if (stream === true && 'stream' in ragResponse && ragResponse.stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                res.write(`event: start\ndata: ${JSON.stringify({ conversationId: activeConv.id, status: activeConv.status })}\n\n`);

                let fullContent = '';
                for await (const chunk of ragResponse.stream) {
                    const chunkText = chunk.text();
                    fullContent += chunkText;
                    res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunkText })}\n\n`);
                }

                await ConversationService.saveMessage(activeConv.id, 'assistant', fullContent, ragResponse.citations);
                
                res.write(`event: done\ndata: ${JSON.stringify({ done: true, citations: ragResponse.citations, conversationId: activeConv.id })}\n\n`);
                res.end(); // Immediate SSE connection closure after response completion
            } else if ('text' in ragResponse && ragResponse.text) {
                await ConversationService.saveMessage(activeConv.id, 'assistant', ragResponse.text, ragResponse.citations);
                
                res.json({
                    conversationId: activeConv.id,
                    status: activeConv.status,
                    response: ragResponse.text,
                    citations: ragResponse.citations
                });
            }
        } catch (err: any) {
            console.error('[Widget] Send message error:', err);
            if (!res.headersSent) {
                res.status(err.message.includes('authorized') ? 403 : 500).json({ error: err.message });
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                res.end();
            }
        }
    }

    static async identifyVisitor(req: Request, res: Response) {
        try {
            const widgetToken = req.params.widgetToken as string;
            const origin = req.headers.origin || req.headers.referer;
            const { visitorId, externalId, name, email } = req.body || {};

            if (!visitorId || !externalId) {
                return res.status(400).json({ error: 'visitorId and externalId are required' });
            }

            await WidgetService.validateWidgetOrigin(widgetToken, origin);

            const visitor = await WidgetService.identifyVisitor(widgetToken, visitorId, externalId, name, email);
            res.json({ success: true, visitorId: visitor.id, externalId: visitor.externalId });
        } catch (err: any) {
            res.status(err.message.includes('found') ? 404 : 500).json({ error: err.message });
        }
    }

    static async closeConversation(req: Request, res: Response) {
        try {
            const widgetToken = req.params.widgetToken as string;
            const conversationId = req.params.conversationId as string;
            const origin = req.headers.origin || req.headers.referer;
            const { visitorId, reason } = req.body || {};

            if (!visitorId) return res.status(400).json({ error: 'visitorId is required' });

            await WidgetService.validateWidgetOrigin(widgetToken, origin);

            await WidgetService.closeWidgetConversation(conversationId, visitorId, reason);
            res.json({ success: true, conversationId, status: 'closed' });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}
