"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useAnimate } from "motion/react";
import { getLenis } from "@/components/providers/SmoothScroll";

const SEEN_KEY = "laura-intro-seen";

const noop = () => () => {};

/** Play once per tab, and never when the visitor asks for less motion. */
function shouldPlayIntro() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return false;
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

/**
 * Opening titles: a line-drawn cup draws itself, fills with coffee, then tips
 * and pours the whole screen away to reveal the page.
 */
export function PourIntro() {
  const [scope, animate] = useAnimate();
  const plays = useSyncExternalStore(noop, shouldPlayIntro, () => false);
  const [dismissed, setDismissed] = useState(false);
  const done = !plays || dismissed;

  useEffect(() => {
    if (done) return;
    const lenis = getLenis();
    lenis?.stop();
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";

    // The intro holds the scroll, so it must always hand it back: on finish,
    // on error, if the tab is hidden (frames stop), and on a hard deadline.
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

    const watchdog = window.setTimeout(finish, 7000);
    const onVisibility = () => {
      if (document.hidden) finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };

    const run = async () => {
      try {
        await animate([
          // 1. the cup draws itself
          [
            "#intro-line",
            { pathLength: 1 },
            { duration: 0.85, ease: [0.65, 0, 0.35, 1] },
          ],
          [
            "#intro-handle",
            { pathLength: 1 },
            { duration: 0.4, ease: "easeOut", at: "-0.35" },
          ],
          [
            "#intro-saucer",
            { pathLength: 1 },
            { duration: 0.35, ease: "easeOut", at: "-0.25" },
          ],
          // 2. coffee pours in and the cup fills
          [
            "#intro-stream",
            { opacity: 1, scaleY: 1 },
            { duration: 0.28, ease: "easeIn", at: "-0.1" },
          ],
          ["#intro-fill", { y: 0 }, { duration: 0.95, ease: [0.4, 0, 0.3, 1] }],
          ["#intro-crema", { opacity: 1 }, { duration: 0.4, at: "-0.5" }],
          ["#intro-stream", { opacity: 0, scaleY: 0.2 }, { duration: 0.25 }],
          ["#intro-steam", { opacity: 1 }, { duration: 0.35, at: "-0.1" }],
          [
            "#intro-word",
            { opacity: 1, y: 0 },
            { duration: 0.45, ease: "easeOut", at: "-0.3" },
          ],
          // 3. the cup tips and pours the screen away
          ["#intro-steam", { opacity: 0 }, { duration: 0.25, at: "+0.2" }],
          [
            "#intro-cup",
            { rotate: -104, x: -26, y: 18 },
            { duration: 0.6, ease: [0.5, 0, 0.2, 1] },
          ],
          [
            "#intro-pour",
            { opacity: 1, scaleY: 1 },
            { duration: 0.4, ease: "easeIn", at: "-0.4" },
          ],
          [
            "#intro-word",
            { opacity: 0, y: -12 },
            { duration: 0.3, at: "-0.5" },
          ],
          [
            "#intro-wash",
            { y: "0%" },
            { duration: 0.45, ease: [0.5, 0, 0.3, 1] },
          ],
          ["#intro-art", { opacity: 0 }, { duration: 0.2, at: "-0.3" }],
          // 4. reveal
          [
            "#intro-root",
            { y: "-100%" },
            { duration: 0.7, ease: [0.76, 0, 0.24, 1], at: "+0.05" },
          ],
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
  }, [done, animate]);

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
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-espresso-950"
      >
        {/* the wash of coffee that sweeps the screen */}
        <motion.div
          id="intro-wash"
          initial={{ y: "-101%" }}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#3a2318_0%,#2b1a12_55%,#170e09_100%)]"
        />

        <motion.div id="intro-art" className="relative">
          <svg
            width="260"
            height="300"
            viewBox="0 0 260 300"
            fill="none"
            aria-hidden
          >
            <defs>
              <clipPath id="intro-cup-inside">
                <path d="M74 112h112l-11 74a26 26 0 0 1-26 22h-38a26 26 0 0 1-26-22z" />
              </clipPath>
            </defs>

            {/* steam */}
            <motion.g
              id="intro-steam"
              initial={{ opacity: 0 }}
              stroke="#dfc0b3"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0"
            >
              <motion.path
                d="M112 86c-9-10 7-18-2-30"
                animate={{ y: [0, -6, 0], opacity: [0.5, 0.9, 0.5] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d="M140 84c-9-12 7-20-2-32"
                animate={{ y: [0, -8, 0], opacity: [0.35, 0.75, 0.35] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              />
            </motion.g>

            {/* the pour that lands in the cup */}
            <motion.rect
              id="intro-stream"
              x="126"
              y="0"
              width="8"
              height="118"
              rx="4"
              fill="#6b3417"
              initial={{ opacity: 0, scaleY: 0 }}
              style={{ originY: 0, originX: 0.5 }}
            />

            <motion.g
              id="intro-cup"
              style={{ originX: "74px", originY: "208px" }}
            >
              {/* coffee inside the cup */}
              <g clipPath="url(#intro-cup-inside)">
                <motion.g id="intro-fill" initial={{ y: 110 }}>
                  <rect
                    x="70"
                    y="112"
                    width="120"
                    height="110"
                    fill="#2e1409"
                  />
                  <motion.ellipse
                    id="intro-crema"
                    cx="130"
                    cy="114"
                    rx="56"
                    ry="9"
                    fill="#b9773f"
                    initial={{ opacity: 0 }}
                  />
                </motion.g>
              </g>

              {/* line art */}
              <motion.path
                id="intro-line"
                d="M74 112h112l-11 74a26 26 0 0 1-26 22h-38a26 26 0 0 1-26-22z"
                stroke="#f7f4ee"
                strokeWidth="3.5"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
              />
              <motion.path
                id="intro-handle"
                d="M186 126c26 0 30 46 4 52"
                stroke="#f7f4ee"
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
              />
            </motion.g>

            <motion.path
              id="intro-saucer"
              d="M56 220h148"
              stroke="#f7f4ee"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
            />

            {/* liquid leaving the tipped cup */}
            <motion.path
              id="intro-pour"
              d="M60 196c-6 34-10 60-8 104h40c-4-44-10-70-14-104z"
              fill="#3a2318"
              initial={{ opacity: 0, scaleY: 0.2 }}
              style={{ originY: 0 }}
            />
          </svg>

          <motion.p
            id="intro-word"
            initial={{ opacity: 0, y: 14 }}
            className="mt-2 text-center font-serif text-2xl text-linen"
          >
            L’AURA
            <span className="label-caps mt-2 block text-[10px] text-latte/70">
              Specialty Coffee House
            </span>
          </motion.p>
        </motion.div>

        <button
          type="button"
          onClick={skip}
          className="label-caps absolute right-6 bottom-6 z-10 rounded-full border border-white/15 px-4 py-2 text-[10px] text-latte transition-colors hover:bg-white/10 hover:text-linen"
        >
          Skip intro
        </button>
      </motion.div>
    </div>
  );
}
