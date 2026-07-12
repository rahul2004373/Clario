import { formatError } from "../../utils/error";
import { Request, Response } from "express";
import { OnboardingService } from "./onboarding.service";
import { OnboardingStep } from "@prisma/client";

export const getOnboardingState = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const state = await OnboardingService.getOnboardingState(workspaceId as string, userId);
    res.json({ state });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};

export const markStepComplete = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const { step } = req.body;

    if (!step) {
      return res.status(400).json({ error: "Step is required" });
    }

    const state = await OnboardingService.markStepComplete(workspaceId as string, userId, step as OnboardingStep);
    res.json({ state });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};
