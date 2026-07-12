import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { workspaceRouter } from "../modules/workspace/workspace.routes";
import { memberRouter } from "../modules/member/member.routes";
import { onboardingRouter } from "../modules/onboarding/onboarding.routes";
import { apikeyRouter } from "../modules/apikey/apikey.routes";
import { chatbotRouter } from "../modules/chatbot/chatbot.routes";
import { sourcesRouter } from "../modules/sources/sources.routes";
import { chatRouter } from "../modules/chat/chat.routes";
import { playgroundRouter } from "../modules/playground/playground.routes";
import { conversationsRouter } from "../modules/conversations/conversations.routes";
import { analyticsRouter } from "../modules/analytics/analytics.routes";
import { widgetRouter } from "../modules/widget/widget.routes";
import { widgetPublicRouter } from "../modules/widget/widget-public.routes";
import { chatPublicRouter } from "../modules/chat/chat-public.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/workspaces", workspaceRouter);
// Mount member and onboarding routes under /workspaces to match the requested API structure.
apiRouter.use("/workspaces", memberRouter);
apiRouter.use("/workspaces", onboardingRouter);
apiRouter.use("/workspaces", apikeyRouter);
apiRouter.use("/workspaces", chatbotRouter);
apiRouter.use("/workspaces/:workspaceId/chatbots/:chatbotId/sources", sourcesRouter);
apiRouter.use("/workspaces/:workspaceId/chatbots/:chatbotId/playground", playgroundRouter);
apiRouter.use("/workspaces/:workspaceId/chatbots/:chatbotId/analytics", analyticsRouter);
apiRouter.use("/workspaces/:workspaceId/conversations", conversationsRouter);
// Additionally map the chatbot-specific conversation route
import { ConversationsController } from "../modules/conversations/conversations.controller";
apiRouter.get("/workspaces/:workspaceId/chatbots/:chatbotId/conversations", ConversationsController.listByChatbot);

apiRouter.use("/workspaces/:workspaceId/chatbots/:chatbotId/widget", widgetRouter);

// Public Endpoints
apiRouter.use("/public/widget-config", widgetPublicRouter);
apiRouter.use("/public", chatPublicRouter);

apiRouter.use("/chat", chatRouter);
