import { Request, Response } from 'express';
import { WorkspaceService } from '../services/workspace.service';

export class WorkspaceController {
    static async createWorkspace(req: Request, res: Response) {
        try {
            const { name } = req.body;
            if (!name) return res.status(400).json({ error: 'Workspace name is required' });

            const userId = (req as any).user.id;
            const workspace = await WorkspaceService.createWorkspace(name, userId);
            
            res.status(201).json(workspace);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getWorkspaces(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const workspaces = await WorkspaceService.getWorkspaces(userId);
            res.status(200).json(workspaces);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getWorkspaceById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id;
            const workspace = await WorkspaceService.getWorkspaceById(id, userId);
            res.status(200).json(workspace);
        } catch (err: any) {
            if (err.message === 'Workspace not found' || err.message === 'Unauthorized access to workspace') {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async updateWorkspace(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { name } = req.body;
            const userId = (req as any).user.id;

            if (!name) return res.status(400).json({ error: 'Workspace name is required' });

            const workspace = await WorkspaceService.updateWorkspace(id, name, userId);
            res.status(200).json(workspace);
        } catch (err: any) {
            if (err.message === 'Workspace not found' || err.message === 'Unauthorized access to workspace') {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async deleteWorkspace(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id;
            
            await WorkspaceService.deleteWorkspace(id, userId);
            // 204 No Content is standard REST practice for successful deletions
            res.status(204).send();
        } catch (err: any) {
            if (err.message === 'Workspace not found' || err.message === 'Unauthorized access to workspace') {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            res.status(500).json({ error: err.message });
        }
    }
}
