import { prisma } from "../../lib/prisma";
import { WorkspaceMemberRole } from "@prisma/client";

export class MemberService {
  static async listMembers(workspaceId: string, userId: string) {
    // Check if user is in workspace
    const isMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    if (!isMember) throw new Error("Unauthorized");

    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
  }

  static async inviteMember(workspaceId: string, inviterId: string, email: string) {
    // 1. Check if inviter is ADMIN or OWNER
    const inviter = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } }
    });
    if (!inviter || (inviter.role !== "OWNER" && inviter.role !== "ADMIN")) {
      throw new Error("Unauthorized to invite members");
    }

    // 2. Find user by email
    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      throw new Error("User with this email not found. They must sign up first.");
    }

    // Check if already invited/member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: userToInvite.id } },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    if (existingMember) {
      return existingMember; // Graceful: already a member
    }

    // 3. Add to workspace
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role: "VIEWER" // Default role
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  }

  static async changeRole(workspaceId: string, requesterId: string, memberId: string, newRole: WorkspaceMemberRole) {
    // 1. Check if requester is ADMIN or OWNER
    const requester = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: requesterId } }
    });
    if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
      throw new Error("Unauthorized to change roles");
    }

    // Optional: Only OWNER can promote someone to OWNER
    if (newRole === "OWNER" && requester.role !== "OWNER") {
      throw new Error("Only owners can grant owner role");
    }

    // Ensure the target member exists and is in the same workspace
    const targetMember = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new Error("Member not found in this workspace");
    }

    // Graceful: if role is already the requested role, just return it
    if (targetMember.role === newRole) {
      return targetMember;
    }

    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole }
    });
  }

  static async removeMember(workspaceId: string, requesterId: string, memberId: string) {
    // Check permissions
    const requester = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: requesterId } }
    });
    
    const targetMember = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    // Graceful: if they are already removed (not found), just return without error
    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      return null;
    }

    // User can remove themselves, or ADMIN/OWNER can remove others
    if (requesterId !== targetMember.userId) {
      if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
        throw new Error("Unauthorized to remove members");
      }
    }

    return prisma.workspaceMember.delete({
      where: { id: memberId }
    });
  }
}
