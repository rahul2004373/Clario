import { Router } from 'express';
import { ApiChannelController } from '../../../../controllers/channels/api/api-channel.controller';
import { apiKeyMiddleware } from '../../../../middleware/api-key.middleware';
import rateLimit from 'express-rate-limit';

const router = Router({ mergeParams: true });

// Programmatic API Channel Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each API key to 500 requests per 15 minutes
    message: { error: 'Too many requests from this API Key, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limit based on the authenticated workspace ID instead of IP, since servers share IPs
    keyGenerator: (req: any) => req.apiWorkspaceId
});

// Protect all programmatic channel routes with API Key Validation
router.use(apiKeyMiddleware);
router.use(apiLimiter);

// Endpoint: POST /api/v1/api/chatbots/:chatbotId/chat
router.post('/chatbots/:chatbotId/chat', ApiChannelController.chat);

export default router;
