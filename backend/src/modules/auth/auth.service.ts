import { prisma } from "../../lib/prisma";
import { supabaseAdmin } from "../../lib/supabase";

export class AuthService {
  static async signup(email: string, password: string, name?: string) {
    // 1. Create user in Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now, can be configured in Supabase
      user_metadata: { name }
    });

    if (error) {
      if (error.message.includes("User not allowed") || error.message.includes("Signups not allowed")) {
        throw new Error(`Supabase signup error: ${error.message} (Please ensure "Allow new users to sign up" is enabled in your Supabase Auth Providers settings).`);
      }
      throw new Error(`Supabase signup error: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Failed to create user in Supabase");
    }

    // 2. Create user in Prisma
    const dbUser = await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        name: name || "User",
      }
    });

    // To get a session directly after admin.createUser, we need to sign in.
    // Alternatively, just return the user and tell frontend to log in.
    // Let's do a sign in to return the token immediately.
    const signInResult = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (signInResult.error) {
      throw new Error(`Failed to log in after signup: ${signInResult.error.message}`);
    }

    return {
      user: dbUser,
      session: signInResult.data.session
    };
  }

  static async login(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    // Sync just in case they were created outside (e.g. Supabase dashboard)
    const user = data.user;
    const name = user.user_metadata?.name || user.user_metadata?.full_name || "User";
    
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email!,
        name: name,
      }
    });

    return {
      user: dbUser,
      session: data.session
    };
  }

  static async getGoogleOAuthUrl(redirectUrl: string) {
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true // Essential for backend usage
      }
    });

    if (error) {
      throw new Error(`OAuth link generation failed: ${error.message}`);
    }

    if (!data || !data.url) {
      throw new Error("Failed to generate OAuth URL");
    }

    return data.url;
  }

  // When frontend uses standard OAuth, it actually doesn't use the backend callback 
  // if doing PKCE correctly, but if we do it via backend we exchange the code.
  // Actually, Supabase handles the callback if we use the default flow and redirects to the frontend.
  // The frontend then parses the hash. So the backend doesn't necessarily need a /callback route
  // unless we want to handle the token exchange securely on the server.
  // For standard Supabase, returning the OAuth URL to the frontend is the most standard approach.

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) throw new Error("User not found");
    return user;
  }

  static async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    // 1. Update in Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data
    });

    // 2. Update metadata in Supabase
    if (data.name) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { name: data.name }
      });
    }

    return updatedUser;
  }
}
