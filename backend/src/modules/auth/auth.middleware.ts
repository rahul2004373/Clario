import { Request, Response, NextFunction } from "express";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../lib/supabase";
import { WorkspaceMemberRole } from "@prisma/client";
import crypto from "crypto";

export interface AuthUser {
  id: string; // The Supabase UUID
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    
    // We use the Supabase admin client to verify the token. 
    // This makes a network request to Supabase but guarantees correct verification
    // regardless of HS256/RS256 algorithm changes or JWT secret encoding issues.
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !data.user) {
      console.error("[AuthMiddleware] Supabase getUser error:", error?.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role
    };

    next();
  } catch (error: any) {
    console.error("[AuthMiddleware]", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireWorkspaceRole = (allowedRoles: WorkspaceMemberRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.id;

      if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "Missing or invalid workspaceId in route parameters" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId }
        }
      });

      if (!member) {
        return res.status(403).json({ error: "Access denied. You are not a member of this workspace." });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ 
          error: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}` 
        });
      }

      // Important: Ensure downstream functions can access the validated member context if needed.
      // E.g., req.member = member;

      next();
    } catch (error: any) {
      console.error("[RequireWorkspaceRole Error]", error.message);
      return res.status(500).json({ error: "Internal server error during role validation" });
    }
  };
};

export const authenticateChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers["x-api-key"] as string;

    // 1. Try API Key (Dashboard/Workspace-level or Widget embedPublicKey)
    if (apiKeyHeader) {
      // First, check if it's a workspace API key (hashed)
      const keyHash = crypto.createHash("sha256").update(apiKeyHeader).digest("hex");
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { workspace: true }
      });

      if (apiKeyRecord && apiKeyRecord.isActive) {
        req.user = {
          id: apiKeyRecord.userId,
          role: "API_USER"
        };
        (req as any).apiKeyWorkspaceId = apiKeyRecord.workspaceId;
        return next();
      }

      // If not a workspace API key, check if it's a widget's embedPublicKey
      const widget = await prisma.chatWidget.findUnique({
        where: { embedPublicKey: apiKeyHeader }
      });

      if (widget) {
        if (!widget.isActive) {
          return res.status(403).json({ error: "Widget is inactive" });
        }
        // It's a valid widget key
        req.user = {
          id: "widget_user",
          role: "WIDGET_USER"
        };
        (req as any).embedPublicKey = apiKeyHeader;
        (req as any).widgetChatbotId = widget.chatbotId;
        return next();
      }

      return res.status(401).json({ error: "Invalid or inactive API key/Embed key" });
    }

    // 2. Try JWT (Fallback to standard auth)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && data.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        };
        return next();
      }
    }

    return res.status(401).json({ error: "Missing or invalid authentication (Bearer token or x-api-key required)" });
  } catch (error: any) {
    console.error("[AuthenticateChat]", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
