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

// Notice the route prefix in api.routes.ts usually is /workspaces/:workspaceId/members
// Actually, wait, let's map it so the frontend can just hit /api/workspaces/:workspaceId/members
// The apiRouter might mount this at /member or /workspaces.
// Let's assume it's mounted at apiRouter.use("/workspaces/:workspaceId/members", memberRouter) 
// OR apiRouter.use("/members", memberRouter) and the frontend passes workspaceId in the URL.
// We will assume the latter and pass workspaceId as a parameter.

// In api.routes.ts it's mounted as apiRouter.use("/member", memberRouter);
// So the path here should include the workspaceId.

memberRouter.get("/:workspaceId/members", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), listMembers);
memberRouter.post("/:workspaceId/members/invite", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), inviteMember);
memberRouter.patch("/:workspaceId/members/:memberId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), changeRole);
memberRouter.delete("/:workspaceId/members/:memberId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), removeMember);
