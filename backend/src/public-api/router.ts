import { Router, Request, Response } from 'express';
import publicRoutes from './routes/public.route';
import { publicAuthMiddleware } from './middleware/public-auth.middleware';
import { publicRateLimitMiddleware } from './middleware/public-rate-limit.middleware';

const router = Router();

// Apply auth and rate-limiting to all public routes
router.use(publicAuthMiddleware);
router.use(publicRateLimitMiddleware);

// Mount version 1 endpoints
router.use('/', publicRoutes);

// Custom 404 handler for public routes
router.use((req: Request, res: Response) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `The requested public endpoint '${req.method} ${req.originalUrl}' does not exist.`
        }
    });
});

export default router;
