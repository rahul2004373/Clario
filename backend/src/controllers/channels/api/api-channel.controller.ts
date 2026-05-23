import { Request, Response } from 'express';
import { prisma } from '../../../db';
import { RagService } from '../../../services/chat-core/rag.service';

export class ApiChannelController {
    static async chat(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const { message, stream, conversationId, visitorId, mode = 'general' } = req.body;
            const workspaceId = (req as any).apiWorkspaceId;

            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // 1. Verify chatbot belongs to the workspace authenticated by the API Key
            const chatbot = await prisma.chatbot.findUnique({
                where: { id: chatbotId }
            });

            if (!chatbot || chatbot.workspaceId !== workspaceId) {
                return res.status(403).json({ error: 'Access denied: Chatbot not found in this workspace' });
            }

            // 2. Manage Conversation
            let convId = conversationId;
            if (!convId) {
                // Spawn a new conversation for the programmatic API
                const conv = await prisma.conversation.create({
                    data: {
                        chatbotId,
                        channel: 'api',
                        visitorId, // Optionally tie to a known visitor
                        title: message.substring(0, 30)
                    }
                });
                convId = conv.id;
            } else {
                // Validate existing conversation
                const existingConv = await prisma.conversation.findUnique({
                    where: { id: convId }
                });
                if (!existingConv || existingConv.chatbotId !== chatbotId) {
                    return res.status(404).json({ error: 'Conversation not found or invalid' });
                }
                if (existingConv.status !== 'active') {
                    return res.status(400).json({ error: 'Conversation is closed' });
                }
            }

            // 3. Load Recent History
            const rawHistory = await prisma.message.findMany({
                where: { conversationId: convId },
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            const history = rawHistory.reverse().map(h => ({
                role: h.role,
                content: h.content
            }));

            // 4. Save User Message
            await prisma.message.create({
                data: {
                    conversationId: convId,
                    role: 'user',
                    content: message
                }
            });

            // 5. Query RAG
            const ragResponse = await RagService.runQuery({
                chatbotId,
                query: message,
                history,
                mode,
                stream: !!stream
            });

            // 6. Handle Stream
            if (stream && ragResponse.stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                let fullText = '';
                try {
                    for await (const chunk of ragResponse.stream) {
                        const chunkText = chunk.text();
                        fullText += chunkText;
                        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                    }
                    
                    // Save assistant message
                    await prisma.message.create({
                        data: {
                            conversationId: convId,
                            role: 'assistant',
                            content: fullText,
                            citations: ragResponse.citations || []
                        }
                    });

                    res.write(`data: ${JSON.stringify({ done: true, conversationId: convId, citations: ragResponse.citations })}\n\n`);
                    res.end();
                } catch (streamErr: any) {
                    console.error('[ApiChannel] Stream error:', streamErr);
                    res.write(`event: error\ndata: ${JSON.stringify({ error: streamErr.message })}\n\n`);
                    res.end();
                }
            } else {
                // 7. Handle Standard JSON Response
                await prisma.message.create({
                    data: {
                        conversationId: convId,
                        role: 'assistant',
                        content: ragResponse.text!,
                        citations: ragResponse.citations || []
                    }
                });

                res.json({
                    conversationId: convId,
                    response: ragResponse.text,
                    citations: ragResponse.citations
                });
            }

        } catch (err: any) {
            console.error('[ApiChannel] Chat error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                res.end();
            }
        }
    }
}
