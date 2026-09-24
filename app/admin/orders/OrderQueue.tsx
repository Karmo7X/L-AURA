"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Coffee, CreditCard, FileText, LoaderCircle, RotateCw, ScanLine, Wallet, X } from "lucide-react";
import { setOrderStatus } from "../actions";
import { money, ORDER_STATUS, orderTime, type OrderStatus } from "@/lib/orders";
import { cn, EASE_SOFT } from "@/lib/cn";
import { quietButton } from "../styles";

export interface QueueOrder {
  id: string;
  order_number: number;
  customer_name: string | null;
  table_number: string | null;
  note: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  paid_at: string | null;
  payment_method: "cash" | "card" | null;
  /** the guest asked to settle before it was finished */
  payment_requested_at: string | null;
  order_items: { name: string; qty: number }[];
}

/** How long an order has been waiting, in plain words. */
function waitingFor(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min ago`;
}

/**
 * What the next tap does. A ready order isn't finished here — it's finished
 * on the payment screen, which records cash or card (the same screen the QR
 * code on the guest's invoice opens).
 */
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  placed: { to: "preparing", label: "Start making" },
  preparing: { to: "ready", label: "Ready" },
};

export function OrderQueue({ orders, done }: { orders: QueueOrder[]; done: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // so a fresh order can't sit unseen on the counter screen
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
        setRefreshedAt(Date.now());
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [done, router]);

  const move = (id: string, to: OrderStatus) => {
    setBusy(id);
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(id, to);
      setBusy(null);
      if (!result.ok) setError(result.message ?? "That didn’t work — try again.");
      else router.refresh();
    });
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className={cn(quietButton, !done && "border-espresso-800 bg-espresso-800 text-linen")}
        >
          Open orders
        </Link>
        <Link
          href="/admin/orders?show=done"
          className={cn(quietButton, done && "border-espresso-800 bg-espresso-800 text-linen")}
        >
          Finished
        </Link>
        <Link href="/admin/scan" className={quietButton}>
          <ScanLine className="h-4 w-4" aria-hidden />
          Scan to pay
        </Link>
        <button
          type="button"
          onClick={() => startTransition(() => router.refresh())}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-oat hover:text-espresso-800"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RotateCw className="h-4 w-4" aria-hidden />
          )}
          Refresh
        </button>
        {refreshedAt && !pending && (
          <span aria-live="polite" className="text-[12px] text-subtle">
            updated {orderTime(new Date(refreshedAt).toISOString())}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-amber-deep">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-espresso-800/20 bg-paper px-6 py-16 text-center">
          <Coffee className="h-8 w-8 text-subtle" aria-hidden />
          <p className="mt-3 font-serif text-xl text-espresso-800">
            {done ? "Nothing finished yet" : "No orders waiting"}
          </p>
          <p className="mt-1 text-sm text-subtle">
            {done
              ? "Collected and cancelled orders show up here."
              : "New orders from the tables appear here on their own."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {orders.map((order) => {
              const next = NEXT[order.status];
              const working = busy === order.id;
              return (
                <motion.li
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE_SOFT }}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-paper p-5 shadow-card",
                    order.status === "placed" ? "border-terracotta/40" : "border-espresso-800/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-2xl text-espresso-800">
                        {order.table_number ? `Table ${order.table_number}` : "Counter"}
                      </p>
                      <p className="text-[13px] text-subtle">
                        #{order.order_number} · {orderTime(order.created_at)} · {waitingFor(order.created_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "label-caps rounded-full px-2.5 py-1 text-[9px]",
                        order.status === "placed" && "bg-terracotta/15 text-amber-deep",
                        order.status === "preparing" && "bg-gold/20 text-amber-deep",
                        order.status === "ready" && "bg-[#7ee08a]/20 text-[#2f6b3a]",
                        (order.status === "collected" || order.status === "cancelled") &&
                          "bg-espresso-800/8 text-muted",
                      )}
                    >
                      {ORDER_STATUS[order.status].label}
                    </span>
                  </div>

                  {/* the guest asked to settle without waiting */}
                  {order.payment_requested_at && !order.paid_at && (
                    <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#7ee08a]/15 px-3 py-2 text-[13px] font-semibold text-[#2f6b3a]">
                      <Wallet className="h-4 w-4 shrink-0" aria-hidden />
                      Wants to pay — asked {waitingFor(order.payment_requested_at)}
                    </p>
                  )}

                  <ul className="mt-4 grid gap-1 text-[15px]">
                    {order.order_items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate text-espresso-800">
                          <span className="font-semibold tabular-nums">{item.qty}×</span> {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.customer_name && <p className="mt-3 text-[13px] text-muted">For {order.customer_name}</p>}
                  {order.note && (
                    <p className="mt-2 rounded-lg bg-peach/15 px-3 py-2 text-[13px] text-amber-deep">“{order.note}”</p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="font-semibold tabular-nums text-espresso-800">
                      {money(Number(order.total))}
                      {order.paid_at && (
                        <span className="ml-2 text-[12px] font-normal text-[#2f6b3a]">
                          paid · {order.payment_method === "card" ? "card" : "cash"}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/invoice/${order.id}?print=1`}
                        target="_blank"
                        rel="noopener"
                        className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-oat hover:text-espresso-800"
                        aria-label={`Print the invoice for order ${order.order_number}`}
                        title="Print invoice"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      {!done && (
                        <button
                          type="button"
                          onClick={() => move(order.id, "cancelled")}
                          disabled={working}
                          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-terracotta/10 hover:text-amber-deep disabled:opacity-40"
                          aria-label={`Cancel order ${order.order_number}`}
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {next && (
                        <button
                          type="button"
                          onClick={() => move(order.id, next.to)}
                          disabled={working}
                          className="inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-[#9c4d22] disabled:opacity-50"
                        >
                          {working ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Check className="h-4 w-4" aria-hidden />
                          )}
                          {next.label}
                        </button>
                      )}
                      {/* always at the end of the order, and early if they asked to settle */}
                      {!order.paid_at && (!next || order.payment_requested_at) && (
                        <Link
                          href={`/admin/pay/${order.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-espresso-800 px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-espresso-700"
                        >
                          <CreditCard className="h-4 w-4" aria-hidden />
                          Take payment
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}
