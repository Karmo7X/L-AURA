import { redirect } from "next/navigation";
import { staffContext } from "@/lib/supabase/session";
import { supabaseEnv } from "@/lib/supabase/env";
import { AdminShell, Notice } from "../AdminShell";
import { Scanner } from "./Scanner";

export const dynamic = "force-dynamic";

/** The counter's scanner: point the camera at the QR on a guest's invoice. */
export default async function ScanPage() {
  if (!supabaseEnv()) {
    return (
      <AdminShell>
        <Notice title="Supabase isn’t connected">
          <p>Add the keys to .env.local, then restart the dev server.</p>
        </Notice>
      </AdminShell>
    );
  }

  const ctx = await staffContext();
  if (!ctx.user) redirect("/admin/login?next=/admin/scan");
  const who = ctx.staff?.name || ctx.user.email;
  if (!ctx.staff) {
    return (
      <AdminShell who={who} section="orders">
        <Notice title="This account isn’t on the staff list">
          <p>Only cafe staff can take payment.</p>
        </Notice>
      </AdminShell>
    );
  }

  return (
    <AdminShell who={who} section="orders">
      <div className="mx-auto max-w-[560px]">
        <p className="label-caps text-amber-deep">Counter</p>
        <h1 className="mt-1 font-serif text-[40px] leading-none font-medium text-espresso-800">Scan to pay</h1>
        <p className="mt-2 text-[15px] text-muted">
          Point the camera at the code on the guest’s invoice or phone. You can also type the order number.
        </p>
        <Scanner />
      </div>
    </AdminShell>
  );
}
