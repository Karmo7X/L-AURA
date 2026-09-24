import { redirect } from "next/navigation";
import { staffContext } from "@/lib/supabase/session";
import { supabaseEnv } from "@/lib/supabase/env";
import { AdminShell, Notice } from "./AdminShell";

/**
 * The checks every admin page makes before it shows anything: Supabase
 * configured, someone signed in, and that someone on the staff list. Returns
 * either a screen to render instead, or the staff context to work with.
 */
export async function staffGate(next: string) {
  if (!supabaseEnv()) {
    return {
      blocked: (
        <AdminShell>
          <Notice title="Supabase isn’t connected">
            <p>
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the dev
              server.
            </p>
          </Notice>
        </AdminShell>
      ),
    } as const;
  }

  const ctx = await staffContext();
  if (!ctx.user) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  const who = ctx.staff?.name || ctx.user.email;

  if (ctx.setup) {
    return {
      blocked: (
        <AdminShell who={who}>
          <Notice title="One more setup step">
            <p>{ctx.setup}</p>
          </Notice>
        </AdminShell>
      ),
    } as const;
  }

  if (!ctx.staff) {
    return {
      blocked: (
        <AdminShell who={who}>
          <Notice title="This account isn’t on the staff list">
            <p>
              You’re signed in as <strong className="text-espresso-800">{ctx.user.email}</strong>, but only cafe staff
              can change the site. Ask the owner to add you — in the Supabase SQL Editor:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-espresso-900 p-3 font-mono text-[12px] leading-5 text-latte">
              {`insert into public.staff (user_id, display_name)\nvalues ('${ctx.user.id}', 'Your name');`}
            </pre>
          </Notice>
        </AdminShell>
      ),
    } as const;
  }

  return { ctx, who, blocked: null } as const;
}
