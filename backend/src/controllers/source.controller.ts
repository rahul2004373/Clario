import { Request, Response } from 'express';
import { prisma } from '../db';

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
}
