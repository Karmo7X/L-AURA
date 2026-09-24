import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { staffContext } from "@/lib/supabase/session";
import { supabaseEnv } from "@/lib/supabase/env";
import { getOrder } from "@/lib/supabase/orders";
import { money, ORDER_STATUS, orderDate, orderTime, UUID } from "@/lib/orders";
import { AdminShell, Notice } from "../../AdminShell";
import { SettleButtons } from "./SettleButtons";

/** Always the live order — a cashier must never see a cached total. */
export const dynamic = "force-dynamic";

/** Where the QR code on an invoice lands. */
export default async function PayPage({ params }: PageProps<"/admin/pay/[id]">) {
  const { id } = await params;

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
  if (!ctx.user) redirect(`/admin/login?next=/admin/pay/${id}`);
  const who = ctx.staff?.name || ctx.user.email;

  if (!ctx.staff) {
    return (
      <AdminShell who={who} section="orders">
        <Notice title="This account isn’t on the staff list">
          <p>Only cafe staff can take payment. Ask the owner to add you.</p>
        </Notice>
      </AdminShell>
    );
  }

  const order = UUID.test(id) ? await getOrder(id) : null;
  if (!order) {
    return (
      <AdminShell who={who} section="orders">
        <Notice title="No such order">
          <p>That code doesn’t match an order. Scan the QR on the guest’s invoice again, or find them on the Orders screen.</p>
          <p>
            <Link href="/admin/orders" className="font-semibold text-amber-deep hover:underline">
              Back to orders
            </Link>
          </p>
        </Notice>
      </AdminShell>
    );
  }

  const paid = Boolean(order.paid_at);

  return (
    <AdminShell who={who} section="orders">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-oat hover:text-espresso-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Orders
      </Link>

      <div className="mx-auto mt-4 max-w-[560px] rounded-2xl border border-espresso-800/10 bg-paper p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-caps text-amber-deep">
              {order.table_number ? `Table ${order.table_number}` : "Counter"} · {ORDER_STATUS[order.status].label}
            </p>
            <h1 className="mt-1 font-serif text-[36px] leading-none text-espresso-800">Order #{order.order_number}</h1>
            <p className="mt-2 text-[13px] text-muted">
              {orderDate(order.created_at)} at {orderTime(order.created_at)}
              {order.customer_name ? ` · ${order.customer_name}` : ""}
            </p>
          </div>
          <p className="font-serif text-[40px] leading-none text-amber-deep">{money(order.total)}</p>
        </div>

        <ul className="mt-6 divide-y divide-espresso-800/8">
          {order.items.map((item) => (
            <li key={item.item_id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
              <span className="text-espresso-800">
                <span className="font-semibold tabular-nums">{item.qty}×</span> {item.name}
              </span>
              <span className="tabular-nums">{money(item.line_total)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 border-t border-dashed border-espresso-800/20 pt-3 text-[14px] tabular-nums">
          <div className="flex justify-between py-0.5">
            <dt className="text-muted">Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between py-0.5">
            <dt className="text-muted">Sales tax</dt>
            <dd>{money(order.tax)}</dd>
          </div>
        </dl>

        {order.note && <p className="mt-4 rounded-lg bg-peach/15 px-3 py-2 text-[13px] text-amber-deep">“{order.note}”</p>}

        {paid ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#7ee08a]/15 px-4 py-4 text-[#2f6b3a]">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
            <p className="text-[15px]">
              <span className="font-semibold">Already paid</span> by {order.payment_method === "card" ? "card" : "cash"} ·{" "}
              {orderTime(order.paid_at!)}
            </p>
          </div>
        ) : (
          <SettleButtons id={order.id} total={money(order.total)} />
        )}

        <p className="mt-4 text-center text-[13px] text-subtle">
          Scanning the same code twice keeps the first payment — nobody gets charged twice.
        </p>
      </div>
    </AdminShell>
  );
}
