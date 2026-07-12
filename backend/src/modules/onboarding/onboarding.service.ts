import { prisma } from "../../lib/prisma";
import { OnboardingStep } from "@prisma/client";

export class OnboardingService {
  static async getOnboardingState(workspaceId: string, userId: string) {
    // Check permission
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    if (!member) throw new Error("Unauthorized");

    return prisma.workspaceOnboarding.findUnique({
      where: { workspaceId }
    });
  }

  static async markStepComplete(workspaceId: string, userId: string, step: OnboardingStep) {
    // Check permission
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      throw new Error("Unauthorized");
    }

    const current = await prisma.workspaceOnboarding.findUnique({
      where: { workspaceId }
    });

    if (!current) {
      throw new Error("Onboarding record not found");
    }

    const updatedSteps = current.completedSteps.includes(step)
      ? current.completedSteps
      : [...current.completedSteps, step];

    // Check if fully complete (e.g. requires these specific steps)
    const requiredSteps: OnboardingStep[] = [
      "WORKSPACE_CREATED",
      "INDUSTRY_SELECTED",
      "AGENT_CREATED"
    ];
    
    const isComplete = requiredSteps.every(s => updatedSteps.includes(s));

    return prisma.workspaceOnboarding.update({
      where: { workspaceId },
      data: {
        completedSteps: updatedSteps,
        isComplete,
        completedAt: isComplete && !current.isComplete ? new Date() : current.completedAt
      }
    });
  }
}
