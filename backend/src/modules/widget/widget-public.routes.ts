import { Router } from "express";
import { getPublicWidgetConfig } from "./widget.controller";

export const widgetPublicRouter = Router();

// Mounted at /api/public/widget-config
widgetPublicRouter.get("/:embedPublicKey", getPublicWidgetConfig);

