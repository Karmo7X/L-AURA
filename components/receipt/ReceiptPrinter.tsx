"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, FileText, LoaderCircle, Minus, Plus, Printer, Trash2 } from "lucide-react";
import { placeOrder } from "@/app/actions/orders";
import { invoiceNumber, orderTime, type PlacedOrder } from "@/lib/orders";
import { PRODUCTS } from "@/lib/shop";
import { formatPrice, useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** For the live preview only — saved orders are priced and taxed by the database. */
const TAX_RATE = 0.0925;

export function ReceiptPrinter() {
  const cart = useCafe((s) => s.cart);
  const changeQty = useCafe((s) => s.changeQty);
  const removeFromCart = useCafe((s) => s.removeFromCart);
  const addToCart = useCafe((s) => s.addToCart);
  const clearCart = useCafe((s) => s.clearCart);
  const showToast = useCafe((s) => s.showToast);

  // The slip always shows the last order Supabase saved — its number, lines
  // and totals come back from the database, not from the cart.
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sending, startSending] = useTransition();
  const [feeding, setFeeding] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + subtotal * TAX_RATE;
  const count = cart.reduce((n, item) => n + item.qty, 0);

  const place = () => {
    if (!cart.length || sending) return;
    setError(null);
    startSending(async () => {
      const result = await placeOrder({
        items: cart.map((item) => ({ id: item.key, qty: item.qty })),
        customerName: name,
      });
      if (!result.ok) {
        setError(result.error);
        showToast("The order didn’t go through");
        return;
      }
      setPlaced(result.order);
      clearCart();
      setFeeding(true);
      window.setTimeout(() => setFeeding(false), 2200);
      showToast(`Order #${result.order.order_number} is in — check the printer`);
    });
  };

  const screen = sending
    ? "SENDING TO THE BAR…"
    : feeding
      ? "PRINTING…"
      : error
        ? "NOT SENT — TRY AGAIN"
        : cart.length
          ? `${count} ITEM(S) QUEUED`
          : placed
            ? `ORDER #${placed.order_number} SAVED`
            : "AWAITING ORDER";

  return (
    <section id="order" aria-labelledby="order-title" className="relative overflow-hidden bg-linen py-24 lg:py-32">
      <div className="container-page relative">
        <SectionHeading
          id="order-title"
          eyebrow="Order"
          title="Take it to the counter"
          divider
          description="Build the order and place it — it goes straight to the bar, the printer runs your slip, and you get an invoice to print."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* order builder */}
          <div className="lg:col-span-5">
            <h3 className="label-caps text-amber-deep">Add to the order</h3>
            <ul className="mt-4 grid gap-2.5">
              {PRODUCTS.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart({ key: product.id, name: product.name, price: product.price, image: product.image });
                      showToast(`${product.name} added`);
                    }}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-espresso-800/10 bg-paper px-4 py-3.5 text-left transition-[border-color,box-shadow,transform] duration-300 ease-soft hover:-translate-y-0.5 hover:border-terracotta/50 hover:shadow-card"
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-espresso-800">{product.name}</span>
                      <span className="block text-[13px] text-subtle">{product.origin}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold text-amber-deep">{formatPrice(product.price)}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-oat text-espresso-800 transition-colors group-hover:bg-amber group-hover:text-paper">
                        <Plus className="h-4 w-4" aria-hidden />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-espresso-800/10 bg-paper p-4">
              <h3 className="label-caps text-amber-deep">In the order {count > 0 && `· ${count}`}</h3>
              <ul className="mt-3 divide-y divide-espresso-800/8">
                <AnimatePresence initial={false}>
                  {cart.length === 0 && (
                    <motion.li
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-3 text-[14px] text-subtle"
                    >
                      Nothing yet — pick something above.
                    </motion.li>
                  )}
                  {cart.map((item) => (
                    <motion.li
                      key={item.key}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between gap-3 overflow-hidden py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-espresso-800">{item.name}</span>
                        {item.detail && <span className="block truncate text-[12px] text-subtle">{item.detail}</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex items-center rounded-full border border-espresso-800/15">
                          <button
                            type="button"
                            onClick={() => changeQty(item.key, -1)}
                            aria-label={`One fewer ${item.name}`}
                            className="grid h-8 w-8 place-items-center rounded-full hover:bg-oat"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => changeQty(item.key, 1)}
                            aria-label={`One more ${item.name}`}
                            className="grid h-8 w-8 place-items-center rounded-full hover:bg-oat"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.key)}
                          aria-label={`Remove ${item.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full text-subtle hover:bg-oat hover:text-espresso-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {cart.length > 0 && (
                <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-espresso-800/15 pt-3 text-[14px]">
                  <span className="text-subtle">Total incl. 9.25% tax</span>
                  <span className="font-semibold text-espresso-800 tabular-nums">{formatPrice(total)}</span>
                </div>
              )}

              <label className="mt-5 block">
                <span className="label-caps text-amber-deep">Name for the order</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  autoComplete="given-name"
                  placeholder="Optional — we’ll call it out at the bar"
                  className="mt-2 w-full rounded-full border border-espresso-800/15 bg-linen px-4 py-3 text-[15px] text-espresso-800 transition-colors outline-none placeholder:text-subtle/80 focus:border-terracotta focus:bg-paper"
                />
              </label>

              <button
                type="button"
                onClick={place}
                disabled={!cart.length || sending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber py-3.5 text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition duration-300 ease-soft hover:scale-[1.02] hover:bg-[#9c4d22] disabled:pointer-events-none disabled:opacity-40"
              >
                {sending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                    Sending to the bar…
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" aria-hidden />
                    Place order &amp; print
                  </>
                )}
              </button>

              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* the printer */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto max-w-[460px]">
              {/* body */}
              <div className="relative z-20 rounded-t-[26px] rounded-b-lg bg-[linear-gradient(180deg,#3d3833_0%,#272220_55%,#191513_100%)] px-6 pt-6 pb-4 shadow-[0_28px_60px_-24px_rgba(20,10,4,0.7)]">
                <div className="flex items-center justify-between">
                  <span className="label-caps text-[10px] text-white/45">L’AURA · Bar Terminal</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors duration-300",
                        error && !sending
                          ? "bg-[#ff7a6b]"
                          : sending
                            ? "animate-pulse bg-[#ffc56b]"
                            : feeding
                              ? "bg-[#7ee08a]"
                              : "bg-[#7ee08a]/40",
                      )}
                    />
                    <span className="label-caps text-[10px] text-white/40">
                      {sending ? "Sending" : feeding ? "Printing" : error ? "Error" : "Ready"}
                    </span>
                  </span>
                </div>

                <div className="mt-5 h-14 rounded-lg bg-black/45 p-3 ring-1 ring-white/5" aria-live="polite">
                  <p className="font-mono text-[11px] leading-4 text-[#9fe8ae]/80">{screen}</p>
                  <p className="font-mono text-[11px] leading-4 text-[#9fe8ae]/50">
                    {placed ? `TOTAL ${formatPrice(placed.total)}` : "TOTAL —"}
                  </p>
                </div>

                {/* the slot */}
                <div className="relative mt-5">
                  <div className="h-3 rounded-full bg-black shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]" />
                  <div className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-white/10" />
                </div>
              </div>

              {/* paper */}
              <div className="relative z-10 -mt-1 flex justify-center overflow-hidden px-6 pb-2">
                <AnimatePresence mode="wait">
                  {placed && (
                    <motion.div
                      key={placed.id}
                      initial={{ y: "-100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "-100%", opacity: 0, transition: { duration: 0.45 } }}
                      transition={{ duration: 1.8, ease: [0.16, 0.9, 0.24, 1] }}
                      className="w-full max-w-[300px] origin-top"
                    >
                      <Receipt order={placed} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {placed ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={`/invoice/${placed.id}?print=1`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-espresso-800 px-5 py-2.5 text-sm font-semibold text-linen transition duration-300 ease-soft hover:scale-[1.03] hover:bg-espresso-700"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    Print invoice
                  </Link>
                  <Link
                    href={`/invoice/${placed.id}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full border border-espresso-800/20 px-5 py-2.5 text-sm font-semibold text-espresso-800 transition-colors hover:bg-oat"
                  >
                    View {invoiceNumber(placed)}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              ) : (
                <p className="mt-6 text-center text-[13px] text-subtle">
                  The slip prints here. Orders are saved to the bar — you pay at the counter.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Receipt({ order }: { order: PlacedOrder }) {
  return (
    <div
      className="relative bg-[#fbfaf6] px-5 pt-6 pb-8 font-mono text-[12px] leading-[19px] text-[#2f2a26] shadow-[0_20px_40px_-18px_rgba(43,26,18,0.55)]"
      style={{
        // torn edge along the bottom
        maskImage:
          "linear-gradient(#000 calc(100% - 12px), transparent calc(100% - 12px)), repeating-conic-gradient(from -45deg at 6px calc(100% - 6px), #000 0deg 90deg, transparent 90deg 180deg)",
        WebkitMaskImage:
          "linear-gradient(#000 calc(100% - 12px), transparent calc(100% - 12px)), repeating-conic-gradient(from -45deg at 6px calc(100% - 6px), #000 0deg 90deg, transparent 90deg 180deg)",
      }}
    >
      <PrintLines>
        <p className="text-center font-sans text-[15px] font-bold tracking-[0.3em]">L’AURA</p>
        <p className="mt-1 text-center text-[11px] text-[#6b625b]">742 Palmetto St · Arts District</p>
        <p className="text-center text-[11px] text-[#6b625b]">(213) 555-0142</p>
        <p className="my-3 text-center text-[#b6aca3]">* * * * * * * * * * * * * * * *</p>
        <div className="flex justify-between text-[11px] text-[#6b625b]">
          <span>ORDER #{order.order_number}</span>
          <span>{orderTime(order.created_at)}</span>
        </div>
        {order.customer_name ? (
          <p className="truncate text-[11px] text-[#6b625b]">FOR {order.customer_name.toUpperCase()}</p>
        ) : null}
        <p className="my-3 border-t border-dashed border-[#c9c0b6]" />
        {order.items.map((item) => (
          <div key={item.item_id} className="flex justify-between gap-3">
            <span className="truncate">
              {item.qty} × {item.name.toUpperCase()}
            </span>
            <span>{formatPrice(item.line_total)}</span>
          </div>
        ))}
        <p className="my-3 border-t border-dashed border-[#c9c0b6]" />
        <div className="flex justify-between text-[#6b625b]">
          <span>SUBTOTAL</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#6b625b]">
          <span>TAX {(order.tax_rate * 100).toFixed(2)}%</span>
          <span>{formatPrice(order.tax)}</span>
        </div>
        <div className="mt-2 flex justify-between text-[14px] font-bold">
          <span>TOTAL</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <p className="my-3 border-t border-dashed border-[#c9c0b6]" />
        <p className="text-center text-[11px] text-[#6b625b]">THANK YOU — SEE YOU AT THE BAR</p>
        <div className="mt-4 flex h-10 items-stretch justify-center gap-[2px]" aria-hidden>
          {BARCODE.map((width, i) => (
            <span key={i} style={{ width }} className={i % 2 ? "bg-transparent" : "bg-[#2f2a26]"} />
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] tracking-[0.35em] text-[#6b625b]">{invoiceNumber(order)}</p>
      </PrintLines>
    </div>
  );
}

const BARCODE = [3, 2, 1, 3, 2, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 2, 3, 1, 2, 4, 2, 1, 3].map((n) => `${n}px`);

/** Reveals children line by line, the way a thermal head lays down each row. */
function PrintLines({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: 0.35 } } }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, filter: "blur(2px)" }, show: { opacity: 1, filter: "blur(0px)" } }}
              transition={{ duration: 0.18, ease: EASE_SOFT }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
