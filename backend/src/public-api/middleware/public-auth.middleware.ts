import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../../services/api-key.service';

export interface PublicApiRequest extends Request {
    apiWorkspaceId?: string;
}

export async function publicAuthMiddleware(req: PublicApiRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid Authorization header. Expected Bearer <api_key>'
                }
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'API Key is missing from the Authorization Bearer header.'
                }
            });
        }

        // Validate key and resolve workspaceId
        const workspaceId = await ApiKeyService.validateKey(token);
        req.apiWorkspaceId = workspaceId;

        next();
    } catch (err: any) {
        return res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid, expired, or revoked API Key. Please generate a new key in the dashboard.'
            }
        });
    }
}
