import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for Server Components and Server Actions.
 *
 * The site has no sign-in, so there is no session to carry in cookies — a
 * plain client with the publishable key is enough. Everything it can reach is
 * governed by row-level security and the two order functions in
 * supabase/migrations.
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — add them to .env.local.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
