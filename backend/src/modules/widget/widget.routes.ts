import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { getWidgetConfig, updateWidgetConfig, activateWidget, getEmbedCode } from "./widget.controller";

export const widgetRouter = Router({ mergeParams: true });

// Mounted at: /api/workspaces/:workspaceId/chatbots/:chatbotId/widget
widgetRouter.use(requireAuth);
widgetRouter.use(requireWorkspaceRole(["OWNER", "ADMIN", "VIEWER"]));

// Only OWNER and ADMIN can modify
const requireAdmin = requireWorkspaceRole(["OWNER", "ADMIN"]);

widgetRouter.get("/", getWidgetConfig);
widgetRouter.patch("/", requireAdmin, updateWidgetConfig);
widgetRouter.patch("/activate", requireAdmin, activateWidget);
widgetRouter.get("/embed-code", getEmbedCode);
