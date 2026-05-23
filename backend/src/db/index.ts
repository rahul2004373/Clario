import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// ── Prisma Client ────────────────────────────────────────────────────────────
declare global { var __prisma: PrismaClient | undefined; }
export const prisma: PrismaClient = global.__prisma ?? new PrismaClient();
if (env.NODE_ENV !== 'production') global.__prisma = prisma;

// ── Supabase Client (Auth & Vector) ──────────────────────────────────────────
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
});

// Alias for backwards compatibility with previous ingestion code
export const vectorDB = supabase;