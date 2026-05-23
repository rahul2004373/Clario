import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service';

export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'API key is missing from Bearer token' });
        }

        // Validate token and attach workspaceId
        const workspaceId = await ApiKeyService.validateKey(token);
        (req as any).apiWorkspaceId = workspaceId;

        next();
    } catch (err: any) {
        return res.status(401).json({ error: 'Invalid or revoked API key' });
    }
}
