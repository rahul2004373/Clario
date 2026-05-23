import { Router } from 'express';
import { TelegramWebhookController } from '../../../../controllers/channels/telegram/telegram-webhook.controller';

const router = Router({ mergeParams: true });

// Base: /api/v1/channels/telegram/webhook/:chatbotId
router.post('/', TelegramWebhookController.handleWebhook);

export default router;
