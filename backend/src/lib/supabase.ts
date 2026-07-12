import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for backend Supabase client.");
}

// We use the service role key on the backend to bypass RLS when syncing users 
// and to securely perform auth admin operations.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});
