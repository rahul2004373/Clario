import { Router } from 'express';
import { PublicChatbotController } from '../controllers/public-chatbot.controller';
import { PublicSourceController } from '../controllers/public-source.controller';
import { uploadMiddleware } from '../../middleware/upload.middleware';

const router = Router();

// --- Chatbots Routes ---
// GET /public/v1/chatbots
router.get('/chatbots', PublicChatbotController.listChatbots);

// GET /public/v1/chatbots/:chatbotId
router.get('/chatbots/:chatbotId', PublicChatbotController.getChatbot);

// POST /public/v1/chatbots/:chatbotId/chat
router.post('/chatbots/:chatbotId/chat', PublicChatbotController.chat);

// POST /public/v1/chatbots/:chatbotId/chat/stream
router.post('/chatbots/:chatbotId/chat/stream', PublicChatbotController.chatStream);

// POST /public/v1/chatbots/:chatbotId/train
router.post('/chatbots/:chatbotId/train', PublicChatbotController.trainChatbot);

// GET /public/v1/chatbots/:chatbotId/training-status
router.get('/chatbots/:chatbotId/training-status', PublicChatbotController.getTrainingStatus);


// --- Sources Routes ---
// GET /public/v1/chatbots/:chatbotId/sources
router.get('/chatbots/:chatbotId/sources', PublicSourceController.listSources);

// POST /public/v1/chatbots/:chatbotId/sources/file
router.post('/chatbots/:chatbotId/sources/file', uploadMiddleware, PublicSourceController.uploadFileSource);

// POST /public/v1/chatbots/:chatbotId/sources/text
router.post('/chatbots/:chatbotId/sources/text', PublicSourceController.addTextSource);

// POST /public/v1/chatbots/:chatbotId/sources/url
router.post('/chatbots/:chatbotId/sources/url', PublicSourceController.addUrlSource);

// GET /public/v1/sources/:sourceId
router.get('/sources/:sourceId', PublicSourceController.getSourceStatus);

// POST /public/v1/sources/:sourceId/process
router.post('/sources/:sourceId/process', PublicSourceController.processSource);

// DELETE /public/v1/sources/:sourceId
router.delete('/sources/:sourceId', PublicSourceController.deleteSource);

export default router;
