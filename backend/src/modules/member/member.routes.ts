import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { WorkspaceMemberRole } from "@prisma/client";
import {
  listMembers,
  inviteMember,
  changeRole,
  removeMember
} from "./member.controller";

export const memberRouter = Router();

memberRouter.use(requireAuth);

memberRouter.get("/:workspaceId/members", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), listMembers);
memberRouter.post("/:workspaceId/members/invite", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), inviteMember);
memberRouter.patch("/:workspaceId/members/:memberId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), changeRole);
memberRouter.delete("/:workspaceId/members/:memberId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), removeMember);
