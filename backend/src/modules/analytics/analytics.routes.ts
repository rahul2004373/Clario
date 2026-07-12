import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { WorkspaceMemberRole } from "@prisma/client";
import { getMetrics } from "./analytics.controller";

export const analyticsRouter = Router({ mergeParams: true });

analyticsRouter.use(requireAuth);

analyticsRouter.get(
  "/",
  requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]),
  getMetrics
);
