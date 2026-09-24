import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { MISSING_ENV, supabaseEnv } from "./env";

/**
 * Supabase client that acts as the signed-in staff member, reading their
 * session from cookies. Create one per request — never share it.
 *
 * Server Components can't write cookies, so a refresh there is dropped; the
 * proxy (proxy.ts) refreshes the session on every /admin request instead.
 */
export async function supabaseWithSession() {
  const env = supabaseEnv();
  if (!env) throw new Error(MISSING_ENV);
  const store = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // called from a Server Component — the proxy keeps the session fresh
        }
      },
    },
  });
}

/**
 * The signed-in user and whether they're cafe staff. `staff` is null for a
 * signed-in account that isn't on the staff list; `setup` explains a
 * database that hasn't had the products migration yet.
 */
export async function staffContext() {
  const supabase = await supabaseWithSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, staff: null, setup: null } as const;

  const { data, error } = await supabase.from("staff").select("display_name").eq("user_id", user.id).maybeSingle();
  if (error) {
    const missing = error.code === "PGRST205" || error.code === "42P01";
    if (!missing) console.error("staff lookup failed", error);
    return {
      supabase,
      user,
      staff: null,
      setup: missing ? "Run supabase/migrations/20260921000000_products.sql in the Supabase SQL Editor." : error.message,
    } as const;
  }
  return { supabase, user, staff: data ? { name: data.display_name as string | null } : null, setup: null } as const;
}
