import { Router } from 'express';
import { ChatController } from '../../controllers/chat.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// POST /api/v1/chat/:chatbotId
router.post('/:chatbotId', ChatController.handleQuery);

export default router;
