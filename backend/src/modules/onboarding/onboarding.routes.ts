import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  getOnboardingState,
  markStepComplete
} from "./onboarding.controller";

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);

onboardingRouter.get("/:workspaceId/onboarding", getOnboardingState);
onboardingRouter.patch("/:workspaceId/onboarding", markStepComplete);
