import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { WorkspaceMemberRole } from "@prisma/client";
import {
  listApiKeys,
  createApiKey,
  updateApiKey,
  revokeApiKey
} from "./apikey.controller";

export const apikeyRouter = Router();

apikeyRouter.use(requireAuth);

apikeyRouter.get("/:workspaceId/api-keys", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), listApiKeys);
apikeyRouter.post("/:workspaceId/api-keys", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), createApiKey);
apikeyRouter.patch("/:workspaceId/api-keys/:keyId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), updateApiKey);
apikeyRouter.delete("/:workspaceId/api-keys/:keyId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), revokeApiKey);
