"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { animate as tween, motion, useAnimate, useMotionValue, type Variants } from "motion/react";
import { CupLogo } from "@/components/ui/icons";
import { getLenis } from "@/components/providers/SmoothScroll";
import { EASE_SOFT } from "@/lib/cn";

const SEEN_KEY = "laura-intro-seen";
const WORD = ["L", "’", "A", "U", "R", "A"];

/** Long enough for the name to finish setting itself before anything lifts. */
const MINIMUM_MS = 1400;
/** The longest we'll wait for the page before revealing it anyway. */
const PATIENCE_MS = 2600;

const noop = () => () => {};

/** Play once per tab, and never when the visitor asks for less motion. */
function shouldPlayIntro() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

/** Each letter rises out of its own mask, a beat apart. */
const letter: Variants = {
  hidden: { y: "115%" },
  shown: (i: number) => ({
    y: "0%",
    transition: { duration: 0.9, delay: 0.12 + i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

/**
 * The loading screen: the name sets itself, a hairline fills while the page
 * actually loads — fonts, then everything the browser is still fetching — and
 * the panel lifts away once it's ready. Nothing appears half-loaded behind it.
 */
export function BrandIntro() {
  const [scope, animate] = useAnimate();
  // Rendered with the page's HTML so it covers the screen from the very first
  // paint; a small script in the layout hides it before paint for anyone who
  // has already seen it, and this drops it once React takes over.
  const plays = useSyncExternalStore(noop, shouldPlayIntro, () => true);
  const [dismissed, setDismissed] = useState(false);
  const progress = useMotionValue(0);
  const done = !plays || dismissed;

  useEffect(() => {
    if (done) return;
    const lenis = getLenis();
    lenis?.stop();
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";

    // The intro holds the scroll, so it must always hand it back: when it
    // finishes, on error, if the tab is hidden (frames stop), and on a deadline.
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // private mode — the intro simply plays again next load
      }
      document.body.style.overflow = "";
      lenis?.start();
      setDismissed(true);
    };

    const watchdog = window.setTimeout(finish, PATIENCE_MS + 2500);
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };

    const after = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    /** The first drink in the hero — what the visitor sees the moment this lifts. */
    const heroReady = () =>
      new Promise<void>((resolve) => {
        const image = document.querySelector<HTMLImageElement>("#home img");
        if (!image || image.complete) return resolve();
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });

    const run = async () => {
      try {
        // creep toward the end while the page loads, then close the gap
        tween(progress, 0.92, { duration: 1.9, ease: [0.16, 1, 0.3, 1] });
        await Promise.race([
          Promise.all([document.fonts?.ready, heroReady(), after(MINIMUM_MS)]),
          after(PATIENCE_MS),
        ]);
        await tween(progress, 1, { duration: 0.32, ease: "easeOut" });
        await animate([
          ["#intro-stack", { y: -20, opacity: 0 }, { duration: 0.5, ease: [0.7, 0, 0.84, 0] }],
          ["#intro-root", { y: "-100%" }, { duration: 0.9, ease: [0.76, 0, 0.24, 1], at: "-0.2" }],
        ]);
      } catch {
        // animation interrupted — fall through to the reveal
      }
      finish();
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    run();

    return () => {
      window.clearTimeout(watchdog);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [done, animate, progress]);

  const skip = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    document.body.style.overflow = "";
    getLenis()?.start();
    setDismissed(true);
  };

  if (done) return null;

  return (
    <div ref={scope}>
      <motion.div
        id="intro-root"
        role="status"
        aria-label="Loading L’AURA"
        className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-espresso-950"
      >
        {/* a warm light behind the name */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_46%_at_50%_46%,rgba(200,109,81,0.22),transparent_72%)]"
        />

        <div id="intro-stack" className="relative flex flex-col items-center px-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_SOFT }}
          >
            <CupLogo className="h-10 w-10 text-terracotta" />
          </motion.span>

          {/* the name — masked letters, settling out of a slightly wide set */}
          <motion.span
            initial={{ scale: 1.07 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: EASE_SOFT }}
            className="mt-7 flex font-serif text-[16vw] leading-[1.06] font-semibold tracking-[0.08em] text-linen sm:text-[84px]"
          >
            {WORD.map((character, i) => (
              <span key={i} className="inline-block overflow-hidden py-[0.06em]">
                <motion.span custom={i} variants={letter} initial="hidden" animate="shown" className="inline-block">
                  {character}
                </motion.span>
              </span>
            ))}
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: EASE_SOFT }}
            className="label-caps mt-3 text-[10px] text-latte/70"
          >
            Specialty Coffee · Café &amp; Roastery
          </motion.span>

          {/* fills as the page loads */}
          <span aria-hidden className="mt-10 h-px w-[180px] overflow-hidden bg-white/12">
            <motion.span style={{ scaleX: progress, originX: 0 }} className="block h-full w-full bg-peach" />
          </span>
        </div>

        <button
          type="button"
          onClick={skip}
          className="label-caps absolute right-6 bottom-6 z-10 rounded-full border border-white/15 px-4 py-2 text-[10px] text-latte transition-colors hover:bg-white/10 hover:text-linen"
        >
          Skip
        </button>
      </motion.div>
    </div>
  );
}
