import { createClient } from "@supabase/supabase-js";
import { MISSING_ENV, supabaseEnv } from "./env";

/**
 * Supabase client for public reads and the order functions.
 *
 * It carries no session — it's the website acting as an anonymous visitor —
 * so everything it can reach is governed by row-level security and the
 * functions in supabase/migrations. The staff area uses `supabaseWithSession`.
 */
export function supabaseServer() {
  const env = supabaseEnv();
  if (!env) throw new Error(MISSING_ENV);
  return createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });
}
