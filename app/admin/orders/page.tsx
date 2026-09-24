import { redirect } from "next/navigation";
import { staffContext } from "@/lib/supabase/session";
import { supabaseEnv } from "@/lib/supabase/env";
import type { OrderStatus } from "@/lib/orders";
import { AdminShell, Notice } from "../AdminShell";
import { OrderQueue, type QueueOrder } from "./OrderQueue";

/** Staff work from this screen, so never show them a cached copy. */
export const dynamic = "force-dynamic";

const OPEN: OrderStatus[] = ["placed", "preparing", "ready"];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  if (!supabaseEnv()) {
    return (
      <AdminShell>
        <Notice title="Supabase isn’t connected">
          <p>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the dev server.</p>
        </Notice>
      </AdminShell>
    );
  }

  const { show } = await searchParams;
  const done = show === "done";
  const ctx = await staffContext();
  if (!ctx.user) redirect("/admin/login?next=/admin/orders");
  const who = ctx.staff?.name || ctx.user.email;

  if (ctx.setup || !ctx.staff) {
    return (
      <AdminShell who={who} section="orders">
        <Notice title={ctx.setup ? "One more setup step" : "This account isn’t on the staff list"}>
          <p>{ctx.setup ?? "Only cafe staff can see orders. Ask the owner to add you on the Products page."}</p>
        </Notice>
      </AdminShell>
    );
  }

  const query = ctx.supabase
    .from("orders")
    .select("id, order_number, customer_name, table_number, note, status, total, created_at, paid_at, payment_method, payment_requested_at, order_items (name, qty)")
    .order("created_at", { ascending: false });
  const { data, error } = done
    ? await query.in("status", ["collected", "cancelled"]).limit(40)
    : await query.in("status", OPEN).limit(60);

  const orders = (data ?? []) as unknown as QueueOrder[];

  return (
    <AdminShell who={who}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-amber-deep">Counter</p>
          <h1 className="mt-1 font-serif text-[40px] leading-none font-medium text-espresso-800">Orders</h1>
        </div>
        <p className="text-sm text-subtle">
          {done ? "Recently finished" : `${orders.length} open · refreshes every few seconds`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-amber-deep">
          Couldn’t load orders: {error.message}
          {(error.code === "42703" || error.code === "PGRST204" || error.code === "42501") &&
            " — run supabase/migrations/20260923000000_table_orders.sql in Supabase."}
        </p>
      )}

      <OrderQueue orders={orders} done={done} />
    </AdminShell>
  );
}
