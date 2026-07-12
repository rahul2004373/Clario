import { Router } from "express";
import { ConversationsController } from "./conversations.controller";

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.get("/", ConversationsController.list);
conversationsRouter.get("/:conversationId", ConversationsController.getDetails);
conversationsRouter.get("/:conversationId/messages", ConversationsController.getMessages);
conversationsRouter.patch("/:conversationId", ConversationsController.updateStatus);
conversationsRouter.delete("/:conversationId", ConversationsController.delete);
conversationsRouter.get("/:conversationId/export", ConversationsController.exportPDF);
