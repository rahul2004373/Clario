import { Router } from "express";
import { authenticateChat } from "../auth/auth.middleware";
import { createPublicSession, endPublicSession, streamPublicMessage } from "./chat-public.controller";

export const chatPublicRouter = Router();

// Ensure that x-api-key is provided and valid (authenticateChat already handles this)
chatPublicRouter.use(authenticateChat);

chatPublicRouter.post("/session", createPublicSession);
chatPublicRouter.delete("/session/:sessionId", endPublicSession);
chatPublicRouter.post("/chat", streamPublicMessage);
