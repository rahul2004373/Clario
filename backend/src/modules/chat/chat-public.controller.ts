import { Request, Response } from "express";
import { createSession, endSession, streamMessage } from "./chat.controller";

/**
 * These controllers act as thin wrappers around the standard chat controllers.
 * Because the public widget does not know the chatbotId (only the embedPublicKey),
 * the `authenticateChat` middleware extracts the chatbotId and attaches it to `req.widgetChatbotId`.
 * We simply inject it into `req.params` and reuse the existing robust chat logic.
 */

export const createPublicSession = async (req: Request, res: Response) => {
  const chatbotId = (req as any).widgetChatbotId;
  if (!chatbotId) {
    return res.status(401).json({ error: "Unauthorized widget" });
  }
  
  req.params.chatbotId = chatbotId;
  return createSession(req, res);
};

export const endPublicSession = async (req: Request, res: Response) => {
  const chatbotId = (req as any).widgetChatbotId;
  if (!chatbotId) {
    return res.status(401).json({ error: "Unauthorized widget" });
  }
  
  req.params.chatbotId = chatbotId;
  return endSession(req, res);
};

export const streamPublicMessage = async (req: Request, res: Response) => {
  const chatbotId = (req as any).widgetChatbotId;
  if (!chatbotId) {
    return res.status(401).json({ error: "Unauthorized widget" });
  }
  
  req.params.chatbotId = chatbotId;
  return streamMessage(req, res);
};
