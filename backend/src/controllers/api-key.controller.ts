import { Request, Response } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import { WorkspaceService } from '../services/workspace.service';

export class ApiKeyController {
    static async createKey(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const { name } = req.body;
            const userId = (req as any).user.id;

            if (!name) return res.status(400).json({ error: 'Name is required' });

            // Verify ownership
            await WorkspaceService.getWorkspaceById(workspaceId, userId);

            const key = await ApiKeyService.createKey(workspaceId, name);
            res.status(201).json(key);
        } catch (err: any) {
            res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
        }
    }

    static async listKeys(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const userId = (req as any).user.id;

            // Verify ownership
            await WorkspaceService.getWorkspaceById(workspaceId, userId);

            const keys = await ApiKeyService.listKeys(workspaceId);
            res.json(keys);
        } catch (err: any) {
            res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
        }
    }

    static async deleteKey(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const keyId = req.params.keyId as string;
            const userId = (req as any).user.id;

            // Verify ownership
            await WorkspaceService.getWorkspaceById(workspaceId, userId);

            await ApiKeyService.deleteKey(workspaceId, keyId);
            res.json({ success: true, message: 'API key deleted' });
        } catch (err: any) {
            res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
        }
    }
}
