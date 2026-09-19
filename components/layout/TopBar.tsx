"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Receipt, X } from "lucide-react";
import { SHOP_NAV } from "@/lib/shop";
import { useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { CupLogo } from "@/components/ui/icons";
import { getLenis, scrollToHash } from "@/components/providers/SmoothScroll";

/** Sections that sit on espresso-dark backgrounds. */
const DARK_SECTIONS = ["home", "hours", "roast", "contact"];

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(true);
  const [active, setActive] = useState<string>(SHOP_NAV[0].href);
  const [open, setOpen] = useState(false);
  const count = useCafe((s) => s.cart.reduce((n, item) => n + item.qty, 0));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      setScrolled(y > 24);

      let dark = false;
      for (const id of DARK_SECTIONS) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= 36 && rect.bottom >= 36) dark = true;
      }
      // the weightless section has no id but sits between hours and order
      const drift = document.querySelector("[data-dark-section]")?.getBoundingClientRect();
      if (drift && drift.top <= 36 && drift.bottom >= 36) dark = true;
      setOverDark(dark);

      let current: string = SHOP_NAV[0].href;
      for (const link of SHOP_NAV) {
        const el = document.querySelector(link.href);
        if (el && el.getBoundingClientRect().top <= vh * 0.4) current = link.href;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const light = !overDark || open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-soft",
          !scrolled && !open && "border-transparent bg-transparent",
          scrolled && !open && overDark && "border-white/10 bg-espresso-950/60 backdrop-blur-xl backdrop-saturate-150",
          (scrolled || open) &&
            light &&
            "border-espresso-800/10 bg-linen/80 shadow-[0_1px_16px_rgba(43,26,18,0.06)] backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <nav
          aria-label="Primary"
          className={cn(
            "container-page flex h-18 items-center justify-between transition-colors duration-500",
            light && (scrolled || open) ? "text-espresso-800" : overDark ? "text-linen" : "text-espresso-800",
          )}
        >
          <a href="#home" className="group flex items-center gap-2.5" aria-label="L’AURA — top of page">
            <CupLogo className="h-8 w-8 text-terracotta transition-transform duration-500 ease-spring group-hover:-rotate-6" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[22px] font-semibold tracking-tight">L’AURA</span>
              <span className="label-caps mt-1 text-[9px] opacity-70">Specialty Coffee</span>
            </span>
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {SHOP_NAV.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={active === link.href ? "true" : undefined}
                  className={cn(
                    "relative py-2 text-sm font-medium transition-opacity duration-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-soft hover:opacity-100 hover:after:scale-x-100",
                    active === link.href ? "opacity-100 after:scale-x-100" : "opacity-70",
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#order"
              className="group relative inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-semibold text-paper shadow-[0_10px_24px_-10px_rgba(176,90,42,0.8)] transition duration-300 ease-soft hover:scale-[1.04] hover:bg-[#9c4d22] active:scale-[0.98] sm:px-5"
            >
              <Receipt className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Print order</span>
              <span className="sm:hidden">Order</span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-espresso-800 px-1 text-[11px] font-bold text-paper ring-2 ring-linen"
                    aria-label={`${count} items in order`}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </a>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="shop-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-current/10 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-espresso-950/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="panel"
              id="shop-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="fixed inset-y-0 right-0 z-40 flex w-[min(86vw,360px)] flex-col bg-linen px-8 pt-28 pb-10 shadow-2xl lg:hidden"
            >
              <ul className="flex flex-col">
                {SHOP_NAV.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: EASE_SOFT, delay: 0.1 + i * 0.06 }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        setTimeout(() => scrollToHash(link.href), 60);
                      }}
                      className="flex items-baseline gap-4 border-b border-espresso-800/10 py-4 font-serif text-3xl text-espresso-800 transition-colors hover:text-amber"
                    >
                      <span className="label-caps font-sans text-subtle">0{i + 1}</span>
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto text-sm text-muted">
                <p className="label-caps text-amber-deep">Find us</p>
                <p className="mt-2">742 Palmetto Street, Arts District</p>
                <p>Mon–Fri 07:00–16:00 · Sat–Sun 08:00–17:00</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
