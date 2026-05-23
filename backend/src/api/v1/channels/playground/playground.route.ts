import { Router } from 'express';
import { PlaygroundController } from '../../../../controllers/channels/playground/playground.controller';
import { authMiddleware } from '../../../../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// All playground routes require authentication
router.use(authMiddleware);

// Base: /api/v1/chatbots/:chatbotId/conversations
router.post('/', PlaygroundController.createConversation);
router.get('/', PlaygroundController.listConversations);

router.get('/:conversationId', PlaygroundController.getConversation);
router.post('/:conversationId/messages', PlaygroundController.sendMessage);
router.post('/:conversationId/close', PlaygroundController.closeConversation);

export default router;
