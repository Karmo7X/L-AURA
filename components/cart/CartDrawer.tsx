"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Coffee, Minus, Plus, Trash2, X } from "lucide-react";
import { formatPrice, useCafe } from "@/lib/store";
import { getLenis, scrollToHash } from "@/components/providers/SmoothScroll";

export function CartDrawer() {
  const open = useCafe((s) => s.cartOpen);
  const setOpen = useCafe((s) => s.setCartOpen);
  const cart = useCafe((s) => s.cart);
  const changeQty = useCafe((s) => s.changeQty);
  const removeFromCart = useCafe((s) => s.removeFromCart);
  const showToast = useCafe((s) => s.showToast);
  const closeButton = useRef<HTMLButtonElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((n, item) => n + item.qty, 0);

  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] bg-espresso-900/50 backdrop-blur-sm"
          />
          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-linen shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-espresso-800/10 px-6 py-5">
              <div>
                <p className="label-caps text-amber-deep">Order Online</p>
                <h2 id="cart-title" className="font-serif text-2xl text-espresso-800">
                  Your Order {count > 0 && <span className="text-subtle">({count})</span>}
                </h2>
              </div>
              <button
                ref={closeButton}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close order"
                className="grid h-10 w-10 place-items-center rounded-full text-espresso-800 transition-colors hover:bg-oat"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-oat text-terracotta">
                    <Coffee className="h-7 w-7" aria-hidden />
                  </span>
                  <p className="mt-4 font-serif text-xl text-espresso-800">Your cup is empty</p>
                  <p className="mt-1 max-w-xs text-sm text-muted">Pick something from the menu or craft your own signature cup.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => scrollToHash("#menu"), 80);
                    }}
                    className="mt-6 rounded-full bg-espresso-800 px-6 py-3 text-sm font-semibold text-paper transition hover:bg-espresso-700"
                  >
                    Browse the menu
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-espresso-800/10">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24, height: 0 }}
                        className="flex gap-4 py-4"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-oat">
                          {item.image ? (
                            <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-terracotta">
                              <Coffee className="h-6 w-6" aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-espresso-800">{item.name}</p>
                            <p className="font-semibold text-amber-deep">{formatPrice(item.price * item.qty)}</p>
                          </div>
                          {item.detail && <p className="truncate text-[13px] text-subtle">{item.detail}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-espresso-800/15">
                              <button
                                type="button"
                                onClick={() => changeQty(item.key, -1)}
                                aria-label={`Decrease ${item.name}`}
                                className="grid h-8 w-8 place-items-center rounded-full hover:bg-oat"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQty(item.key, 1)}
                                aria-label={`Increase ${item.name}`}
                                className="grid h-8 w-8 place-items-center rounded-full hover:bg-oat"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.key)}
                              aria-label={`Remove ${item.name}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-subtle hover:bg-oat hover:text-espresso-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <footer className="border-t border-espresso-800/10 px-6 pt-5 pb-6">
                <div className="flex items-center justify-between text-espresso-800">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
                </div>
                <p className="mt-1 text-xs text-subtle">Ready for pickup in about 10 minutes.</p>
                <button
                  type="button"
                  onClick={() => showToast("Checkout isn’t connected yet — this is a demo order.")}
                  className="mt-5 w-full rounded-full bg-amber py-4 text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition duration-300 ease-soft hover:scale-[1.02] hover:bg-[#9c4d22]"
                >
                  Checkout · {formatPrice(subtotal)}
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
