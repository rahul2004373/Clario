import { prisma } from "../../lib/prisma";
import crypto from "crypto";
import { ApiKeyScope } from "@prisma/client";

export class ApiKeyService {
  private static async checkPermission(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    
    if (!member) {
      throw new Error("Unauthorized: You are not a member of this workspace");
    }
    
    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      throw new Error("Unauthorized: Only owners and admins can manage API keys");
    }
    
    return member;
  }

  static async createApiKey(workspaceId: string, userId: string, name: string, scope: ApiKeyScope = "FULL") {
    await this.checkPermission(workspaceId, userId);

    // Generate raw key
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const rawKey = `clr_live_${randomBytes}`;
    
    // Hash for storage
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    
    // Prefix for UI
    const keyPrefix = `clr_live_${randomBytes.substring(0, 4)}...${randomBytes.substring(randomBytes.length - 4)}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId,
        userId,
        name,
        keyHash,
        keyPrefix,
        scope,
      },
    });

    // Return the raw key ONCE. It cannot be retrieved again.
    return {
      ...apiKey,
      rawKey,
    };
  }

  static async listApiKeys(workspaceId: string, userId: string) {
    await this.checkPermission(workspaceId, userId);

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    // keyHash is never returned to the frontend.
    return keys.map(({ keyHash, ...rest }) => rest);
  }

  static async updateApiKey(workspaceId: string, userId: string, keyId: string, name?: string, scope?: ApiKeyScope) {
    await this.checkPermission(workspaceId, userId);

    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    
    if (!key || key.workspaceId !== workspaceId) {
      throw new Error("API key not found");
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (scope) dataToUpdate.scope = scope;

    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: dataToUpdate
    });

    const { keyHash, ...rest } = updatedKey;
    return rest;
  }

  static async revokeApiKey(workspaceId: string, userId: string, keyId: string) {
    await this.checkPermission(workspaceId, userId);

    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    
    if (!key || key.workspaceId !== workspaceId) {
      // Graceful ignore
      return { success: true, message: "API key already revoked or not found" };
    }

    await prisma.apiKey.delete({
      where: { id: keyId }
    });

    return { success: true, message: "API key revoked" };
  }
}
