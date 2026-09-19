"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { CupLogo } from "@/components/ui/icons";
import { getLenis, scrollToHash } from "@/components/providers/SmoothScroll";

const DARK_SECTIONS = ["about", "contact"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(true);
  const [active, setActive] = useState<string>("#home");
  const [open, setOpen] = useState(false);
  const count = useCafe((s) => s.cart.reduce((n, item) => n + item.qty, 0));
  const setCartOpen = useCafe((s) => s.setCartOpen);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      setScrolled(y > 24);

      // The hero background fades to cream around 0.7 × viewport height.
      let dark = y < vh * 0.72;
      for (const id of DARK_SECTIONS) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= 36 && rect.bottom >= 36) dark = true;
      }
      setOverDark(dark);

      let current: string = NAV_LINKS[0].href;
      for (const link of NAV_LINKS) {
        const el = document.querySelector(link.href);
        if (el && el.getBoundingClientRect().top <= vh * 0.4) current = link.href;
      }
      if (vh + y >= document.documentElement.scrollHeight - 4) current = "#contact";
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
          scrolled && !open && overDark && "border-white/10 bg-espresso-900/55 backdrop-blur-xl backdrop-saturate-150",
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
          <a href="#home" className="group flex items-center gap-2.5" aria-label="L’AURA Café & Roastery — home">
            <CupLogo className="h-8 w-8 text-terracotta transition-transform duration-500 ease-spring group-hover:-rotate-6" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[22px] font-semibold tracking-tight">L’AURA</span>
              <span className="label-caps mt-1 text-[9px] opacity-70">Café &amp; Roastery</span>
            </span>
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => (
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
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="group relative inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-semibold text-paper shadow-[0_10px_24px_-10px_rgba(176,90,42,0.8)] transition duration-300 ease-soft hover:scale-[1.04] hover:bg-[#9c4d22] active:scale-[0.98] sm:px-5"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Order Online</span>
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
            </button>

            <button
              ref={menuButton}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-current/10 lg:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
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
              className="fixed inset-0 z-40 bg-espresso-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="panel"
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="fixed inset-y-0 right-0 z-40 flex w-[min(86vw,380px)] flex-col bg-linen px-8 pt-28 pb-10 shadow-2xl lg:hidden"
            >
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } }}
                className="flex flex-col gap-1"
              >
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.href}
                    variants={{ hidden: { opacity: 0, x: 32 }, show: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.5, ease: EASE_SOFT }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        setTimeout(() => scrollToHash(link.href), 60);
                      }}
                      className={cn(
                        "flex items-baseline gap-4 border-b border-espresso-800/10 py-4 font-serif text-3xl text-espresso-800 transition-colors hover:text-amber",
                        active === link.href && "text-amber",
                      )}
                    >
                      <span className="label-caps font-sans text-subtle">0{i + 1}</span>
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="mt-auto text-sm text-muted">
                <p className="label-caps text-amber-deep">Visit</p>
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
