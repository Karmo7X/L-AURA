"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  FileText,
  History,
  LoaderCircle,
  Minus,
  PencilLine,
  Plus,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  addToOrder,
  amendOrderItem,
  orderQr,
  ordersByIds,
  orderStatus,
  placeOrder,
  requestBill,
} from "@/app/actions/orders";
import { money, ORDER_STATUS, orderDate, orderTime, invoiceNumber, type PlacedOrder } from "@/lib/orders";
import { STARTER_CATEGORIES, type Category, type MenuProduct } from "@/lib/products";
import { useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { CupLogo } from "@/components/ui/icons";
import { Toaster } from "@/components/cart/Toaster";
import { SlipPrinter } from "@/components/receipt/Slip";
import { MenuList } from "./MenuList";

const TAX_RATE = 0.0925; // preview only — the saved order is priced by the database
/** Every order this phone has placed, newest first — the guest's own history. */
const ORDERS_KEY = "laura-orders";
/** What earlier versions of the site remembered: one order. */
const LAST_ORDER_KEY = "laura-last-order";
/** Keep an order open on screen for this long after it was placed. */
const REMEMBER_MS = 3 * 60 * 60 * 1000;
/** How many of the guest's own orders to keep. */
const HISTORY = 20;

/** The ids this phone remembers, including the one the old site stored. */
function rememberedIds(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "[]");
    const ids = Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
    const legacy = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? "null") as { id?: string } | null;
    if (legacy?.id && !ids.includes(legacy.id)) ids.unshift(legacy.id);
    return ids.slice(0, HISTORY);
  } catch {
    return []; // private mode: nothing is remembered, everything still works
  }
}

function rememberOrder(id: string) {
  try {
    const ids = [id, ...rememberedIds().filter((old) => old !== id)].slice(0, HISTORY);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(ids));
  } catch {
    // private mode — the order is still placed, just not remembered here
  }
}

/** An order that can still grow: nothing paid, nothing finished. */
function stillOpen(order: PlacedOrder | null): order is PlacedOrder {
  return !!order && !order.paid_at && order.status !== "collected" && order.status !== "cancelled";
}

/**
 * Ordering from the table: browse the menu, send it to the bar, then watch it
 * move along. A second round joins the order that's already open, so the guest
 * leaves with one invoice — nothing is paid here, they show it at the counter.
 */
export function TableOrder({
  products,
  table,
  categories = STARTER_CATEGORIES,
}: {
  products: MenuProduct[];
  table: string | null;
  categories?: Category[];
}) {
  const cart = useCafe((s) => s.cart);
  const changeQty = useCafe((s) => s.changeQty);
  const clearCart = useCafe((s) => s.clearCart);
  const showToast = useCafe((s) => s.showToast);

  const [sheet, setSheet] = useState<"none" | "cart" | "edit">("none");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [amending, startAmending] = useTransition();
  const [busyLine, setBusyLine] = useState<string | null>(null);
  // the slip rolling out of the terminal, right after the order changes
  const [feeding, setFeeding] = useState(false);
  // everything this phone has ordered before
  const [history, setHistory] = useState<PlacedOrder[]>([]);
  const [asking, startAsking] = useTransition();

  const count = cart.reduce((n, item) => n + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + subtotal * TAX_RATE;

  const open = stillOpen(order) ? order : null;
  // the bar hasn't picked it up yet, so lines can still be changed
  const canEdit = open?.status === "placed";

  const reprint = () => {
    setFeeding(true);
    window.setTimeout(() => setFeeding(false), 2200);
  };

  // what this phone ordered before: the open one comes back on screen, the
  // rest sit in the guest's own history below
  useEffect(() => {
    let cancelled = false;
    const ids = rememberedIds();
    if (!ids.length) return;
    ordersByIds(ids).then((rows) => {
      if (cancelled || !rows.length) return;
      setHistory(rows);
      const current = rows.find((o) => stillOpen(o)) ?? rows[0];
      if (!current || Date.now() - new Date(current.created_at).getTime() > REMEMBER_MS) return;
      setOrder(current);
      orderQr(current.id).then((code) => {
        if (!cancelled && code) setQr(code.svg);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Keep the history in step with whatever just changed. */
  const record = (fresh: PlacedOrder) =>
    setHistory((rows) => [fresh, ...rows.filter((o) => o.id !== fresh.id)].slice(0, HISTORY));

  // while it's being made, keep the status fresh
  useEffect(() => {
    if (!order || ["collected", "cancelled"].includes(order.status)) return;
    const id = order.id;
    const timer = window.setInterval(async () => {
      const fresh = await orderStatus(id);
      if (fresh) setOrder(fresh);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [order]);

  /** Send the basket: onto the open order if there is one, otherwise a new one. */
  const send = () => {
    if (!cart.length || sending) return;
    setError(null);
    const items = cart.map((item) => ({ id: item.key, qty: item.qty }));
    const joining = open;
    startSending(async () => {
      const result = joining
        ? await addToOrder(joining.id, items)
        : await placeOrder({ items, customerName: name, table: table ?? undefined, note });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrder(result.order);
      record(result.order);
      if (!joining) setQr((await orderQr(result.order.id))?.svg ?? null);
      clearCart();
      setNote("");
      setSheet("none");
      reprint();
      rememberOrder(result.order.id);
      showToast(
        joining
          ? `Added to order #${result.order.order_number} — still one bill`
          : `Order #${result.order.order_number} is in`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  /** Change one line of the order already at the bar — 0 takes it off. */
  const amend = (itemId: string, qty: number) => {
    if (!open || amending) return;
    setError(null);
    setBusyLine(itemId);
    startAmending(async () => {
      const result = await amendOrderItem(open.id, itemId, qty);
      setBusyLine(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrder(result.order);
      record(result.order);
      reprint();
      if (result.order.status === "cancelled") {
        setSheet("none");
        showToast(`Order #${result.order.order_number} was called off`);
      }
    });
  };

  /** "We'd like to pay now" — the counter brings the machine over. */
  const askToPay = () => {
    if (!open || asking) return;
    setError(null);
    startAsking(async () => {
      const result = await requestBill(open.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrder(result.order);
      record(result.order);
      showToast("The counter knows — someone is on their way");
    });
  };

  const jumpToMenu = () => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-svh bg-linen pb-32 text-ink">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-espresso-800/10 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="L’AURA home">
            <CupLogo className="h-8 w-8 text-terracotta" />
            <span className="leading-none">
              <span className="block font-serif text-xl font-semibold text-espresso-800">L’AURA</span>
              <span className="label-caps mt-0.5 block text-[9px] text-subtle">Order &amp; pay at the counter</span>
            </span>
          </Link>
          <span className="label-caps rounded-full bg-espresso-800 px-3 py-1.5 text-[10px] text-linen">
            {table ? `Table ${table}` : "Takeaway"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* the menu reads on the left; the order you're building stays beside it */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start lg:gap-10">
          <aside className="grid min-w-0 gap-5 lg:sticky lg:top-24 lg:order-2">
            {order && (
              <OrderCard
                order={order}
                onAddMore={open ? jumpToMenu : undefined}
                onEdit={canEdit ? () => setSheet("edit") : undefined}
                onAskToPay={open ? askToPay : undefined}
                asking={asking}
              />
            )}

            {/* what's in the basket, on a screen with room for it */}
            {count > 0 && (
              <section
                aria-label="Your basket"
                className="hidden rounded-2xl border border-espresso-800/10 bg-paper p-5 shadow-card lg:block"
              >
                <h2 className="label-caps flex items-center justify-between text-amber-deep">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    In your basket
                  </span>
                  <span className="text-subtle tabular-nums">{count}</span>
                </h2>
                <ul className="mt-3 divide-y divide-espresso-800/8">
                  {cart.map((item) => (
                    <li key={item.key} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0 truncate text-[15px] text-espresso-800">
                        <span className="font-semibold tabular-nums">{item.qty}×</span> {item.name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-espresso-800">
                        {money(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-baseline justify-between border-t border-dashed border-espresso-800/20 pt-3 text-[14px]">
                  <span className="text-muted">Total incl. tax</span>
                  <span className="font-serif text-2xl font-semibold text-amber-deep">{money(total)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSheet("cart")}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber py-3.5 text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition hover:bg-[#9c4d22]"
                >
                  {open ? `Add to order #${open.order_number}` : "Review order"}
                </button>
              </section>
            )}

            {/* the invoice, straight off the bar terminal */}
            {order && (
              <section
                aria-labelledby="invoice-title"
                className="rounded-2xl border border-espresso-800/10 bg-paper px-4 py-7 shadow-card sm:px-7"
              >
                <h2 id="invoice-title" className="label-caps text-center text-amber-deep">
                  Your invoice
                </h2>
                <p className="mx-auto mt-2 max-w-[42ch] text-center text-[14px] text-muted">
                  {open
                    ? "One invoice for the whole visit — anything you add prints onto this same slip."
                    : "Show the code at the counter when you pay — or print the invoice and save it as a PDF."}
                </p>
                <SlipPrinter
                  className="mt-7"
                  order={order}
                  qr={qr}
                  state={sending || amending ? "sending" : error ? "error" : feeding ? "printing" : "ready"}
                  screen={
                    sending || amending
                      ? "SENDING TO THE BAR…"
                      : feeding
                        ? "PRINTING…"
                        : `ORDER #${order.order_number} · ${ORDER_STATUS[order.status].label.toUpperCase()}`
                  }
                />
              </section>
            )}
          </aside>

          <div className="min-w-0 lg:order-1">
            <MenuList products={products} table={table} categories={categories} />
          </div>
        </div>

        {/* everything this phone has ordered before */}
        {history.length > 0 && (
          <section aria-labelledby="history-title" className="mt-16 border-t border-espresso-800/10 pt-10">
            <h2 id="history-title" className="label-caps flex items-center gap-2 text-amber-deep">
              <History className="h-4 w-4" aria-hidden />
              Your orders
            </h2>
            <p className="mt-1 text-[13px] text-subtle">
              Kept on this phone — invoices stay open for anyone with the link.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {history.map((past) => (
                <li
                  key={past.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-paper px-4 py-3",
                    past.id === order?.id ? "border-terracotta/50" : "border-espresso-800/10",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso-800">
                      Order #{past.order_number}
                      {past.table_number ? ` · Table ${past.table_number}` : ""}
                    </p>
                    <p className="text-[13px] text-subtle">
                      {orderDate(past.created_at)} · {orderTime(past.created_at)} ·{" "}
                      {past.items.reduce((n, i) => n + i.qty, 0)} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-right">
                      <span className="block font-semibold tabular-nums text-espresso-800">{money(past.total)}</span>
                      <span className={cn("block text-[12px]", past.paid_at ? "text-[#2f6b3a]" : "text-subtle")}>
                        {past.paid_at
                          ? `Paid · ${past.payment_method === "card" ? "card" : "cash"}`
                          : ORDER_STATUS[past.status].label}
                      </span>
                    </span>
                    <Link
                      href={`/invoice/${past.id}`}
                      target="_blank"
                      rel="noopener"
                      aria-label={`Open ${invoiceNumber(past)}`}
                      className="grid h-10 w-10 place-items-center rounded-full text-subtle transition-colors hover:bg-oat hover:text-espresso-800"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Toaster />

      {/* the bar at the bottom of the screen */}
      <AnimatePresence>
        {count > 0 && sheet === "none" && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ duration: 0.35, ease: EASE_SOFT }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-espresso-800/10 bg-paper/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
          >
            <button
              type="button"
              onClick={() => setSheet("cart")}
              className="mx-auto flex w-full max-w-[900px] items-center justify-between gap-3 rounded-full bg-amber px-5 py-3.5 text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition hover:bg-[#9c4d22]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingBag className="h-4 w-4" aria-hidden />
                {count} {count === 1 ? "item" : "items"}
              </span>
              <span className="text-sm font-semibold">
                {open ? `Add to order #${open.order_number}` : "Review order"} · {money(total)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the order sheet */}
      <AnimatePresence>
        {sheet !== "none" && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheet("none")}
              aria-label="Close the order"
              className="fixed inset-0 z-40 bg-espresso-950/50 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: EASE_SOFT }}
              role="dialog"
              aria-label={sheet === "edit" ? "Change your order" : "Your order"}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[88svh] overflow-y-auto rounded-t-3xl bg-paper px-4 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto max-w-[620px]">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-espresso-800">
                    {sheet === "edit"
                      ? `Change order #${open?.order_number}`
                      : open
                        ? `Add to order #${open.order_number}`
                        : "Your order"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSheet("none")}
                    aria-label="Close"
                    className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-oat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {sheet === "edit" && open ? (
                  <>
                    <p className="mt-1 text-[13px] text-subtle">You can change this until the bar starts making it.</p>
                    <ul className="mt-4 divide-y divide-espresso-800/8">
                      {open.items.map((item) => (
                        <li key={item.item_id} className="flex items-center justify-between gap-3 py-3">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-espresso-800">{item.name}</span>
                            <span className="text-[13px] text-subtle tabular-nums">{money(item.unit_price)} each</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="flex items-center rounded-full border border-espresso-800/15">
                              <button
                                type="button"
                                onClick={() => amend(item.item_id, item.qty - 1)}
                                disabled={amending}
                                aria-label={`One fewer ${item.name}`}
                                className="grid h-9 w-9 place-items-center rounded-full hover:bg-oat disabled:opacity-40"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                {busyLine === item.item_id ? (
                                  <LoaderCircle className="mx-auto h-3.5 w-3.5 animate-spin" aria-label="Saving" />
                                ) : (
                                  item.qty
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => amend(item.item_id, item.qty + 1)}
                                disabled={amending}
                                aria-label={`One more ${item.name}`}
                                className="grid h-9 w-9 place-items-center rounded-full hover:bg-oat disabled:opacity-40"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </span>
                            <button
                              type="button"
                              onClick={() => amend(item.item_id, 0)}
                              disabled={amending}
                              aria-label={`Take ${item.name} off the order`}
                              className="grid h-9 w-9 place-items-center rounded-full text-subtle hover:bg-terracotta/10 hover:text-amber-deep disabled:opacity-40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <dl className="mt-4 border-t border-dashed border-espresso-800/20 pt-4 text-[14px] tabular-nums">
                      <div className="flex items-baseline justify-between">
                        <dt className="label-caps text-espresso-800">Total so far</dt>
                        <dd className="font-serif text-2xl font-semibold text-amber-deep">{money(open.total)}</dd>
                      </div>
                    </dl>

                    {error && (
                      <p
                        role="alert"
                        className="mt-3 rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep"
                      >
                        {error}
                      </p>
                    )}

                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSheet("none");
                          jumpToMenu();
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-espresso-800/20 py-3.5 text-sm font-semibold text-espresso-800 transition-colors hover:bg-oat"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                        Add something else
                      </button>
                      <button
                        type="button"
                        onClick={() => setSheet("none")}
                        className="inline-flex w-full items-center justify-center rounded-full bg-espresso-800 py-3.5 text-sm font-semibold text-linen transition hover:bg-espresso-700"
                      >
                        Done
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {open && (
                      <p className="mt-1 text-[13px] text-subtle">
                        This goes onto the order you already placed — you’ll still get one invoice.
                      </p>
                    )}
                    <ul className="mt-4 divide-y divide-espresso-800/8">
                      {cart.map((item) => (
                        <li key={item.key} className="flex items-center justify-between gap-3 py-3">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-espresso-800">{item.name}</span>
                            <span className="text-[13px] text-subtle tabular-nums">{money(item.price)} each</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="flex items-center rounded-full border border-espresso-800/15">
                              <button
                                type="button"
                                onClick={() => changeQty(item.key, -1)}
                                aria-label={`One fewer ${item.name}`}
                                className="grid h-9 w-9 place-items-center rounded-full hover:bg-oat"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => changeQty(item.key, 1)}
                                aria-label={`One more ${item.name}`}
                                className="grid h-9 w-9 place-items-center rounded-full hover:bg-oat"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </span>
                            <span className="w-16 text-right font-semibold tabular-nums">
                              {money(item.price * item.qty)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* a new order needs a name; one that's already running doesn't */}
                    {!open && (
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-1.5">
                          <span className="label-caps text-amber-deep">Name for the order</span>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            placeholder="Optional — we’ll call it out"
                            className="w-full rounded-xl border border-espresso-800/15 bg-linen px-4 py-3 text-[15px] outline-none focus:border-terracotta focus:bg-paper"
                          />
                        </label>
                        <label className="grid gap-1.5">
                          <span className="label-caps text-amber-deep">Anything else?</span>
                          <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={200}
                            placeholder="Oat milk, extra hot, no sugar…"
                            className="w-full rounded-xl border border-espresso-800/15 bg-linen px-4 py-3 text-[15px] outline-none focus:border-terracotta focus:bg-paper"
                          />
                        </label>
                      </div>
                    )}

                    <dl className="mt-5 border-t border-dashed border-espresso-800/20 pt-4 text-[14px] tabular-nums">
                      <div className="flex justify-between py-1">
                        <dt className="text-muted">Subtotal</dt>
                        <dd>{money(subtotal)}</dd>
                      </div>
                      <div className="flex justify-between py-1">
                        <dt className="text-muted">Sales tax (9.25%)</dt>
                        <dd>{money(total - subtotal)}</dd>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <dt className="label-caps text-espresso-800">{open ? "This round" : "Total"}</dt>
                        <dd className="font-serif text-2xl font-semibold text-amber-deep">{money(total)}</dd>
                      </div>
                      {open && (
                        <div className="mt-1 flex items-baseline justify-between text-[13px] text-subtle">
                          <dt>Already on order #{open.order_number}</dt>
                          <dd>{money(open.total)}</dd>
                        </div>
                      )}
                    </dl>

                    {error && (
                      <p
                        role="alert"
                        className="mt-3 rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep"
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={send}
                      disabled={sending || !cart.length}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber py-4 text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition hover:bg-[#9c4d22] disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                          Sending to the bar…
                        </>
                      ) : open ? (
                        <>Add to order #{open.order_number}</>
                      ) : (
                        <>Send {table ? `to table ${table}` : "to the counter"}</>
                      )}
                    </button>
                    <p className="mt-3 text-center text-[13px] text-subtle">
                      Nothing is charged here — pay at the counter on your way out.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The guest's live order: where it's got to, and what they can still do to it. */
function OrderCard({
  order,
  onAddMore,
  onEdit,
  onAskToPay,
  asking,
}: {
  order: PlacedOrder;
  onAddMore?: () => void;
  onEdit?: () => void;
  onAskToPay?: () => void;
  asking?: boolean;
}) {
  const waitingToPay = Boolean(order.payment_requested_at) && !order.paid_at;
  const done = order.status === "collected" || order.status === "cancelled";
  const steps = ["placed", "preparing", "ready"] as const;
  const reached = steps.indexOf(order.status as (typeof steps)[number]);
  const items = order.items.reduce((n, i) => n + i.qty, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SOFT }}
      aria-label="Your order"
      className="mt-6 overflow-hidden rounded-2xl bg-espresso-900 text-linen shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="label-caps text-peach">{ORDER_STATUS[order.status].guest}</p>
          <p className="mt-1 font-serif text-[32px] leading-none">Order #{order.order_number}</p>
          <p className="mt-2 text-[13px] text-latte/80">
            {order.table_number ? `Table ${order.table_number} · ` : ""}
            {items} {items === 1 ? "item" : "items"} · {money(order.total)}
          </p>
        </div>
        <span
          className={cn(
            "label-caps rounded-full px-3 py-1.5 text-[10px]",
            waitingToPay ? "bg-sage/20 text-sage" : "bg-peach/15 text-peach",
          )}
        >
          {order.paid_at
            ? `Paid by ${order.payment_method === "card" ? "card" : "cash"}`
            : waitingToPay
              ? "Someone is coming to take payment"
              : done
                ? ORDER_STATUS[order.status].label
                : "Show this number to pay"}
        </span>
      </div>

      {(onAddMore || onEdit || onAskToPay) && (
        <div className="flex flex-wrap items-center gap-2 px-5 pb-5">
          {onAddMore && (
            <button
              type="button"
              onClick={onAddMore}
              className="inline-flex items-center gap-2 rounded-full bg-peach px-4 py-2.5 text-sm font-semibold text-espresso-900 transition hover:bg-linen"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add something else
            </button>
          )}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-linen transition-colors hover:bg-white/10"
            >
              <PencilLine className="h-4 w-4" aria-hidden />
              Change items
            </button>
          ) : (
            <p className="text-[13px] text-latte/70">The bar has started — ask at the counter to change it.</p>
          )}
          {onAskToPay &&
            (waitingToPay ? (
              <p className="flex items-center gap-2 text-[13px] text-sage">
                <Wallet className="h-4 w-4" aria-hidden />
                We’ve told the counter — they’ll bring the machine over.
              </p>
            ) : (
              <button
                type="button"
                onClick={onAskToPay}
                disabled={asking}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-linen transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {asking ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Wallet className="h-4 w-4" aria-hidden />
                )}
                Pay now
              </button>
            ))}
        </div>
      )}

      {!done && (
        <ol className="flex items-center gap-2 border-t border-white/10 px-5 py-3.5 text-[12px]">
          {steps.map((step, i) => (
            <li key={step} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px]",
                  i <= reached ? "border-peach bg-peach text-espresso-900" : "border-white/25 text-latte/50",
                )}
              >
                {i < reached ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={cn("truncate", i <= reached ? "text-linen" : "text-latte/50")}>
                {ORDER_STATUS[step].label}
              </span>
              {i < steps.length - 1 && <span className="h-px flex-1 bg-white/15" />}
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  );
}
