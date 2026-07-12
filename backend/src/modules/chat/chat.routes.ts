import { Router } from "express";
import { authenticateChat } from "../auth/auth.middleware";
import {
  createSession,
  endSession,
  getSession,
  rateMessage,
  streamMessage,
  nonStreamMessage
} from "./chat.controller";

export const chatRouter = Router();

// Apply authentication middleware to all chat endpoints
chatRouter.use(authenticateChat);

// Session endpoints
chatRouter.post("/:chatbotId/session", createSession);
chatRouter.get("/:chatbotId/session/:sessionId", getSession);
chatRouter.delete("/:chatbotId/session/:sessionId", endSession);

// Message endpoints
chatRouter.post("/:chatbotId/message", streamMessage);
chatRouter.post("/:chatbotId/message/non-stream", nonStreamMessage);
chatRouter.post("/:chatbotId/message/:messageId/rate", rateMessage);
