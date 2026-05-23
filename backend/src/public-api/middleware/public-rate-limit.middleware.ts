import rateLimit from 'express-rate-limit';
import { Response } from 'express';
import { PublicApiRequest } from './public-auth.middleware';

export const publicRateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each workspace API key to 500 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => req.apiWorkspaceId || req.ip,
    handler: (req: any, res: Response) => {
        res.status(429).json({
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests from this API key. Rate limit is 500 requests per 15 minutes. Please try again later.'
            }
        });
    }
});
