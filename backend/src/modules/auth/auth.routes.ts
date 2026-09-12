import { Router } from "express";
import {
  signup,
  login,
  getGoogleOAuthUrl,
  getProfile,
  updateProfile,
  syncUser
} from "./auth.controller";
import { requireAuth } from "./auth.middleware";

export const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.get("/google", getGoogleOAuthUrl);
authRouter.post("/sync", requireAuth, syncUser);
authRouter.get("/me", requireAuth, getProfile);
authRouter.patch("/profile", requireAuth, updateProfile);
