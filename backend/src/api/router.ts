import { Router } from 'express';
import authRoutes from './v1/auth.route';
import uploadRoutes from './v1/upload.route';
import workspaceRoutes from './v1/workspace.route';
import chatbotRoutes from './v1/chatbot.route';
import chatRoutes from './v1/chat.route';
import playgroundRoutes from './v1/channels/playground/playground.route';
import sourceRoutes from './v1/source.route';

const router = Router();

// Version 1 Routes
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);

// Nested routes for chatbots under a specific workspace
router.use('/workspaces/:workspaceId/chatbots', chatbotRoutes);

// Nested routes for sources under a specific workspace
router.use('/workspaces/:workspaceId/sources', sourceRoutes);

// API Keys management under a specific workspace
import apiKeyRoutes from './v1/api-key.route';
router.use('/workspaces/:workspaceId/api-keys', apiKeyRoutes);

// Chatbot direct routes (Playground Channel)
router.use('/chatbots/:chatbotId/conversations', playgroundRoutes);

// Public Embedded Widget Channel
import widgetRoutes from './v1/channels/widget/widget.route';
router.use('/widget/:widgetToken', widgetRoutes);

// Programmatic API Channel (Server-to-Server / Authorized)
import apiChannelRoutes from './v1/channels/api/api-channel.route';
router.use('/api', apiChannelRoutes);

// Telegram Public Webhook
import telegramWebhookRoutes from './v1/channels/telegram/telegram-webhook.route';
router.use('/channels/telegram/webhook/:chatbotId', telegramWebhookRoutes);

// Chat / Query route (Legacy/Standard)
router.use('/chat', chatRoutes);

// Ingestion route
router.use('/ingest', uploadRoutes); // This handles /v1/ingest

export default router;
