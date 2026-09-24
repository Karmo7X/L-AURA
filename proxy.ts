import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Runs before every /admin request: refreshes the staff member's Supabase
 * session (writing new cookies when it rotates) and sends signed-out visitors
 * to the sign-in page. This is only the quick check — every page and action
 * in /admin verifies the user again, and the database enforces staff access.
 */
export async function proxy(request: NextRequest) {
  const env = supabaseEnv();
  if (!env) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;
  const onLogin = pathname === "/admin/login";

  if (!signedIn && !onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return withCookies(NextResponse.redirect(url), response);
  }
  if (signedIn && onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/products";
    url.search = "";
    return withCookies(NextResponse.redirect(url), response);
  }
  return response;
}

/** A redirect must carry any refreshed session cookies too. */
function withCookies(redirect: NextResponse, from: NextResponse) {
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    {
      source: "/admin/:path*",
      // Server Action posts (e.g. a product save with a photo) skip the proxy:
      // each action verifies the signed-in user itself, so this saves a
      // second auth round-trip and buffering the upload in the proxy.
      missing: [{ type: "header", key: "next-action" }],
    },
  ],
};
