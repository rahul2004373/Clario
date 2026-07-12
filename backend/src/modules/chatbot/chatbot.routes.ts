import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { WorkspaceMemberRole } from "@prisma/client";
import {
  listChatbots,
  createChatbot,
  getChatbot,
  updateChatbot,
  deleteChatbot,
  togglePublish,
  getEmbedCode,
  getLastTrained
} from "./chatbot.controller";

export const chatbotRouter = Router();

chatbotRouter.use(requireAuth);

chatbotRouter.get("/:workspaceId/chatbots", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), listChatbots);
chatbotRouter.post("/:workspaceId/chatbots", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), createChatbot);
chatbotRouter.get("/:workspaceId/chatbots/:chatbotId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), getChatbot);
chatbotRouter.patch("/:workspaceId/chatbots/:chatbotId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), updateChatbot);
chatbotRouter.delete("/:workspaceId/chatbots/:chatbotId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), deleteChatbot);
chatbotRouter.patch("/:workspaceId/chatbots/:chatbotId/publish", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), togglePublish);
chatbotRouter.get("/:workspaceId/chatbots/:chatbotId/embed-code", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), getEmbedCode);
chatbotRouter.get("/:workspaceId/chatbots/:chatbotId/last-trained", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), getLastTrained);
