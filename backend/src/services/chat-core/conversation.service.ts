import { prisma } from '../../db';

export class ConversationService {
    static async verifyChatbotAccess(chatbotId: string, userId: string) {
        const chatbot = await prisma.chatbot.findUnique({
            where: { id: chatbotId },
            include: { workspace: true }
        });
        if (!chatbot) throw new Error('Chatbot not found');
        if (chatbot.workspace.ownerId !== userId) throw new Error('Unauthorized access to chatbot');
        return chatbot;
    }

    static async createConversation(chatbotId: string, userId: string, title?: string, channel: string = 'playground') {
        return prisma.conversation.create({
            data: {
                chatbotId,
                userId,
                title: title || 'New Conversation',
                channel,
                status: 'active'
            }
        });
    }

    static async getConversationsByChatbot(chatbotId: string, userId: string, status?: string) {
        return prisma.conversation.findMany({
            where: {
                chatbotId,
                userId,
                ...(status && status !== 'all' ? { status } : {})
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { messages: true }
                }
            }
        });
    }

    static async getConversationById(conversationId: string, userId: string) {
        return prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: {
                chatbot: {
                    include: { workspace: true }
                },
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
    }

    static async closeConversation(conversationId: string, userId: string) {
        const conv = await prisma.conversation.findFirst({
            where: { id: conversationId, userId }
        });
        if (!conv) throw new Error('Conversation not found or unauthorized');

        return prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'closed', updatedAt: new Date() }
        });
    }

    static async saveMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, citations?: any) {
        const [message] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    conversationId,
                    role,
                    content,
                    citations
                }
            }),
            prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            })
        ]);
        return message;
    }

    static async updateTitle(conversationId: string, newTitle: string) {
        return prisma.conversation.update({
            where: { id: conversationId },
            data: { title: newTitle, updatedAt: new Date() }
        });
    }

    static async getRecentHistory(conversationId: string, limit: number = 6) {
        return prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: limit
        }).then(msgs => msgs.reverse());
    }
}
