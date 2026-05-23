import { Router } from 'express';
import { WidgetController } from '../../../../controllers/channels/widget/widget.controller';
import rateLimit from 'express-rate-limit';

const router = Router({ mergeParams: true });

// Rate Limiter for Widget Endpoints to protect against spam / abuse
const widgetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to all widget routes
router.use(widgetLimiter);

// Base: /api/v1/widget/:widgetToken

// 1. Initialize widget session
router.post('/session', WidgetController.initializeSession);

// 2. Send widget message
router.post('/messages', WidgetController.sendMessage);

// 3. Update / identify visitor
router.post('/identify', WidgetController.identifyVisitor);

// 4. Close widget session
router.post('/conversations/:conversationId/close', WidgetController.closeConversation);

export default router;
