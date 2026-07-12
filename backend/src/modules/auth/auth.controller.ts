import { formatError } from "../../utils/error";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { prisma } from "../../lib/prisma";

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await AuthService.signup(email, password, name);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: formatError(error) });
  }
};

export const getGoogleOAuthUrl = async (req: Request, res: Response) => {
  try {
    const redirectUrl = (req.query.redirectUrl as string) || "http://localhost:3000/auth/callback";
    const url = await AuthService.getGoogleOAuthUrl(redirectUrl);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: formatError(error) });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await AuthService.getProfile(userId);
    res.json({ profile });
  } catch (error: any) {
    res.status(404).json({ error: formatError(error) });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, avatarUrl } = req.body;
    const profile = await AuthService.updateProfile(userId, { name, avatarUrl });
    res.json({ profile });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

// Existing syncUser, keep just in case frontend does direct OAuth
export const syncUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.id || !user.email) {
      return res.status(400).json({ error: "Invalid user data in token" });
    }

    const authHeader = req.headers.authorization;
    let name = "User";
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const payload = JSON.parse(Buffer.from(token.split(".")[1], 'base64').toString());
        if (payload.user_metadata?.full_name) {
          name = payload.user_metadata.full_name;
        } else if (payload.user_metadata?.name) {
          name = payload.user_metadata.name;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        ...(name !== "User" ? { name } : {})
      },
      create: {
        id: user.id,
        email: user.email,
        name: name,
      },
    });

    res.json({ message: "User synced successfully", user: dbUser });
  } catch (error: any) {
    console.error("[Auth Sync Error]", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
};
