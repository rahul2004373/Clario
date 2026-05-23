import { prisma } from '../db';

export class WorkspaceService {
    static async createWorkspace(name: string, userId: string) {
        return prisma.workspace.create({
            data: {
                name,
                ownerId: userId,
            },
        });
    }

    static async getWorkspaces(userId: string) {
        return prisma.workspace.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getWorkspaceById(workspaceId: string, userId: string) {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) throw new Error('Workspace not found');
        if (workspace.ownerId !== userId) throw new Error('Unauthorized access to workspace');

        return workspace;
    }

    static async updateWorkspace(workspaceId: string, name: string, userId: string) {
        // First verify ownership
        await this.getWorkspaceById(workspaceId, userId);

        return prisma.workspace.update({
            where: { id: workspaceId },
            data: { name },
        });
    }

    static async deleteWorkspace(workspaceId: string, userId: string) {
        // First verify ownership
        await this.getWorkspaceById(workspaceId, userId);

        return prisma.workspace.delete({
            where: { id: workspaceId },
        });
    }
}
