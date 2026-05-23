import { prisma } from '../db';
import { WorkspaceService } from './workspace.service';

export class ChatbotService {
    static async createChatbot(workspaceId: string, name: string, systemPrompt: string | undefined, userId: string) {
        // Verify user owns the workspace
        await WorkspaceService.getWorkspaceById(workspaceId, userId);

        return prisma.chatbot.create({
            data: {
                name,
                workspaceId,
                systemPrompt,
                sourceIds: [],
            },
        });
    }

    static async getChatbotsByWorkspace(workspaceId: string, userId: string) {
        // Verify user owns the workspace
        await WorkspaceService.getWorkspaceById(workspaceId, userId);

        return prisma.chatbot.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getChatbotById(workspaceId: string, chatbotId: string, userId: string) {
        // Verify user owns the workspace
        await WorkspaceService.getWorkspaceById(workspaceId, userId);

        const chatbot = await prisma.chatbot.findFirst({
            where: { 
                id: chatbotId,
                workspaceId, // Ensure it belongs to the given workspace
            },
        });

        if (!chatbot) throw new Error('Chatbot not found');

        return chatbot;
    }

    static async updateChatbot(workspaceId: string, chatbotId: string, data: { name?: string; systemPrompt?: string }, userId: string) {
        // Verify ownership and existence
        await this.getChatbotById(workspaceId, chatbotId, userId);

        return prisma.chatbot.update({
            where: { id: chatbotId },
            data,
        });
    }

    static async updateChatbotSources(workspaceId: string, chatbotId: string, sourceIds: string[], userId: string) {
        // Verify ownership and existence
        await this.getChatbotById(workspaceId, chatbotId, userId);

        // Sync ChatbotSource relations
        await prisma.chatbotSource.deleteMany({
            where: { chatbotId }
        });

        if (sourceIds.length > 0) {
            await prisma.chatbotSource.createMany({
                data: sourceIds.map(sourceId => ({
                    chatbotId,
                    sourceId
                }))
            });
        }

        return prisma.chatbot.update({
            where: { id: chatbotId },
            data: { sourceIds },
        });
    }

    static async getLastTrainedTime(workspaceId: string, chatbotId: string, userId: string) {
        // Verify ownership and existence
        await this.getChatbotById(workspaceId, chatbotId, userId);

        // Fetch the chatbot's sources that are READY
        const chatbotSources = await prisma.chatbotSource.findMany({
            where: { 
                chatbotId,
                source: {
                    status: 'READY'
                }
            },
            include: {
                source: true
            }
        });

        if (chatbotSources.length === 0) {
            return { lastTrainedAt: null };
        }

        // Find the latest syncedAt date
        let latestSyncedAt: Date | null = null;
        for (const cs of chatbotSources) {
            const syncedAt = cs.source.syncedAt;
            if (syncedAt) {
                if (!latestSyncedAt || syncedAt > latestSyncedAt) {
                    latestSyncedAt = syncedAt;
                }
            } else {
                // Fallback to source.updatedAt if syncedAt is not populated
                const updatedAt = cs.source.updatedAt;
                if (!latestSyncedAt || updatedAt > latestSyncedAt) {
                    latestSyncedAt = updatedAt;
                }
            }
        }

        return { lastTrainedAt: latestSyncedAt };
    }

    static async deleteChatbot(workspaceId: string, chatbotId: string, userId: string) {
        // Verify ownership and existence
        await this.getChatbotById(workspaceId, chatbotId, userId);

        return prisma.chatbot.delete({
            where: { id: chatbotId },
        });
    }
}
