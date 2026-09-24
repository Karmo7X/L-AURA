"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle, Minus, Plus, Printer, Trash2 } from "lucide-react";
import { orderQr, placeOrder } from "@/app/actions/orders";
import { type PlacedOrder } from "@/lib/orders";
import { categoryLabel, type MenuProduct } from "@/lib/products";
import { formatPrice, useCafe } from "@/lib/store";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SlipPrinter } from "@/components/receipt/Slip";

/** For the live preview only — saved orders are priced and taxed by the database. */
const TAX_RATE = 0.0925;

/** `products` is the live menu from Supabase — whatever the cafe has on today. */
export function ReceiptPrinter({ products }: { products: MenuProduct[] }) {
  const cart = useCafe((s) => s.cart);
  const changeQty = useCafe((s) => s.changeQty);
  const removeFromCart = useCafe((s) => s.removeFromCart);
  const addToCart = useCafe((s) => s.addToCart);
  const clearCart = useCafe((s) => s.clearCart);
  const showToast = useCafe((s) => s.showToast);

  // The slip always shows the last order Supabase saved — its number, lines
  // and totals come back from the database, not from the cart.
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [qr, setQr] = useState<string | null>(null);
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
      setQr((await orderQr(result.order.id))?.svg ?? null);
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
    <section
      id="order"
      aria-labelledby="order-title"
      className="relative overflow-hidden border-t border-espresso-800/8 bg-parchment py-24 lg:py-32"
    >
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
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart({
                        key: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image ?? undefined,
                      });
                      showToast(`${product.name} added`);
                    }}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-espresso-800/10 bg-paper px-4 py-3.5 text-left transition-[border-color,box-shadow,transform] duration-300 ease-soft hover:-translate-y-0.5 hover:border-terracotta/50 hover:shadow-card"
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-espresso-800">{product.name}</span>
                      <span className="block text-[13px] text-subtle">
                        {product.origin || categoryLabel(product.category)}
                      </span>
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
            <SlipPrinter
              order={placed}
              qr={qr}
              state={sending ? "sending" : error ? "error" : feeding ? "printing" : "ready"}
              screen={screen}
              empty={
                <p className="mt-6 text-center text-[13px] text-subtle">
                  The slip prints here. Orders are saved to the bar — you pay at the counter.
                </p>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
