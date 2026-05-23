import { Router } from 'express';
import { ChatbotController } from '../../controllers/chatbot.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

// mergeParams allows us to access :workspaceId defined in the parent router
const router = Router({ mergeParams: true });

// Apply auth middleware to all chatbot routes
router.use(authMiddleware);

router.post('/', ChatbotController.createChatbot);
router.get('/', ChatbotController.getChatbots);
router.get('/:id', ChatbotController.getChatbotById);
router.put('/:id', ChatbotController.updateChatbot);
router.delete('/:id', ChatbotController.deleteChatbot);
router.put('/:id/sources', ChatbotController.updateChatbotSources);
router.get('/:id/last-trained', ChatbotController.getLastTrainedTime);

// Widget Management Routes
import { WidgetController } from '../../controllers/channels/widget/widget.controller';
router.get('/:chatbotId/widget', WidgetController.getWidgetSettings);
router.put('/:chatbotId/widget', WidgetController.updateWidgetSettings);

// Telegram Management Routes
import telegramRoutes from './channels/telegram/telegram.route';
router.use('/:chatbotId/integrations/telegram', telegramRoutes);

export default router;
