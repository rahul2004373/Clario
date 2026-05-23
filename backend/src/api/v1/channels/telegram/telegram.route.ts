import { Router } from 'express';
import { TelegramController } from '../../../../controllers/channels/telegram/telegram.controller';

const router = Router({ mergeParams: true });

// Note: This router is intended to be mounted under:
// /api/v1/workspaces/:workspaceId/chatbots/:chatbotId/integrations/telegram
// And protected by authMiddleware at the parent level.

router.post('/', TelegramController.connect);
router.get('/', TelegramController.getStatus);
router.delete('/', TelegramController.disconnect);
router.patch('/toggle', TelegramController.toggle);

export default router;
