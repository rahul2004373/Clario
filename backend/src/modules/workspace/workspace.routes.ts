import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { WorkspaceMemberRole } from "@prisma/client";
import {
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace
} from "./workspace.controller";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

workspaceRouter.get("/", listWorkspaces);
workspaceRouter.post("/", createWorkspace);
workspaceRouter.get("/:workspaceId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), getWorkspace);
workspaceRouter.patch("/:workspaceId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), updateWorkspace);
workspaceRouter.delete("/:workspaceId", requireWorkspaceRole([WorkspaceMemberRole.OWNER]), deleteWorkspace);
