import { prisma } from "../../lib/prisma";
import { BusinessType } from "@prisma/client";

export class WorkspaceService {
  static async listWorkspaces(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });
  }

  static async createWorkspace(userId: string, data: { name: string; businessType?: BusinessType }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 8);

    return prisma.$transaction(async (tx: any) => {
      // Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug,
          businessType: data.businessType ?? "GENERAL",
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
          onboarding: {
            create: {
              isComplete: false,
              completedSteps: ["WORKSPACE_CREATED"],
            },
          },
        },
      });
      return workspace;
    });
  }

  static async getWorkspace(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: { userId },
        },
      },
    });
    
    if (!workspace) throw new Error("Workspace not found or unauthorized");
    return workspace;
  }

  static async updateWorkspace(workspaceId: string, userId: string, data: { name?: string; logoUrl?: string; website?: string; businessType?: BusinessType }) {
    // Check permission
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });

    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      throw new Error("Unauthorized to update workspace");
    }

    return prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });
  }

  static async deleteWorkspace(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });

    if (!member || member.role !== "OWNER") {
      throw new Error("Only the owner can delete the workspace");
    }

    return prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }
}
