"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flame } from "lucide-react";
import { ROASTS, roastCurve, roastState, sampleRoast } from "@/lib/roast";
import { cn, EASE_SOFT } from "@/lib/cn";
import { RoastBeanArt } from "./RoastBeanArt";

const CURVE_W = 520;
const CURVE_H = 200;

export function RoastSection() {
  const track = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0.5);

  const roast = sampleRoast(value);
  const stop = roast.nearest;

  const commit = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setValue(clamped);
    roastState.target = clamped;
  }, []);

  const fromPointer = useCallback(
    (clientX: number) => {
      const rect = track.current?.getBoundingClientRect();
      if (!rect) return;
      commit((clientX - rect.left) / rect.width);
    },
    [commit],
  );

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let dragging = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      fromPointer(e.clientX);
    };
    const move = (e: PointerEvent) => dragging && fromPointer(e.clientX);
    const up = () => {
      dragging = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [fromPointer]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.2 : 0.05;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      commit(value + step);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      commit(value - step);
    } else if (e.key === "Home") {
      e.preventDefault();
      commit(0);
    } else if (e.key === "End") {
      e.preventDefault();
      commit(1);
    }
  };

  const bars = [
    { label: "Acidity", value: roast.acidity },
    { label: "Body", value: roast.body },
    { label: "Sweetness", value: roast.sweetness },
  ];

  return (
    <section
      id="roast"
      data-dark-section
      aria-labelledby="roast-title"
      className="relative isolate min-h-svh overflow-hidden bg-espresso-950 py-24 text-linen lg:py-28"
    >
      {/* the whole section changes temperature with the dial */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        animate={{ backgroundColor: stop.tone }}
        transition={{ duration: 0.7, ease: EASE_SOFT }}
      >
        <motion.div
          className="absolute top-1/2 left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          animate={{ backgroundColor: stop.hex, opacity: 0.2 - value * 0.07 }}
          transition={{ duration: 0.7, ease: EASE_SOFT }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(75%_65%_at_50%_45%,transparent_0%,rgba(8,4,2,0.55)_100%)]" />
      </motion.div>

      {/* drawn beans, coloured by the dial */}
      <RoastBeanArt color={stop.hex} shadow={stop.ink} />

      <div className="container-page relative z-10 grid items-center gap-12 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE_SOFT }}
          className="lg:col-span-5"
        >
          <p className="label-caps inline-flex items-center gap-2 text-peach">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            The roast dial
          </p>
          <h2
            id="roast-title"
            className="mt-3 font-serif text-[34px] leading-10 font-medium text-balance lg:text-[46px] lg:leading-[54px]"
          >
            Take the same bean
            <span className="block text-peach italic">anywhere you like</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-latte/90 text-pretty">
            One lot from Huila, three very different cups. Drag the dial — the beans roast as you go.
          </p>

          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stop.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="font-serif text-3xl text-linen"
                >
                  {stop.name} roast
                </motion.span>
              </AnimatePresence>
              <span className="label-caps text-latte/70">
                Drop {stop.drop} · {stop.time}
              </span>
            </div>

            {/* the dial */}
            <div
              ref={track}
              role="slider"
              tabIndex={0}
              aria-label="Roast level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(value * 100)}
              aria-valuetext={`${stop.name} roast`}
              onKeyDown={onKeyDown}
              className="relative mt-5 h-12 cursor-ew-resize touch-none select-none rounded-full"
            >
              <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full bg-[linear-gradient(90deg,#c08a4e_0%,#8a4a26_50%,#2a1409_100%)] opacity-80" />
              </div>
              {ROASTS.map((mark) => (
                <span
                  key={mark.name}
                  aria-hidden
                  style={{ left: `${mark.at * 100}%` }}
                  className="absolute top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/25"
                />
              ))}
              <motion.span
                aria-hidden
                animate={{ left: `${value * 100}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-espresso-800 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.8)]"
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor: `rgb(${roast.color.map((c) => Math.round(c * 255 * 1.35)).join(",")})`,
                  }}
                />
              </motion.span>
            </div>
            <div aria-hidden className="mt-2 flex justify-between">
              {ROASTS.map((mark) => (
                <button
                  key={mark.name}
                  type="button"
                  onClick={() => commit(mark.at)}
                  className={cn(
                    "label-caps transition-colors",
                    Math.abs(value - mark.at) < 0.2 ? "text-peach" : "text-latte/50 hover:text-latte",
                  )}
                >
                  {mark.name}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={stop.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 max-w-md text-[15px] leading-7 text-latte/85"
            >
              {stop.copy}
            </motion.p>
          </AnimatePresence>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE_SOFT, delay: 0.1 }}
          className="lg:col-span-6 lg:col-start-7"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
            <p className="label-caps text-peach">Roast curve</p>
            <svg viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} className="mt-4 w-full" role="img" aria-label={`${stop.name} roast curve`}>
              <defs>
                <linearGradient id="curve-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#dfc0b3" />
                  <stop offset="1" stopColor="#fe997a" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((y) => (
                <line key={y} x1="0" y1={CURVE_H * y} x2={CURVE_W} y2={CURVE_H * y} stroke="#dfc0b3" strokeOpacity="0.12" strokeWidth="1" />
              ))}
              <motion.path
                d={roastCurve(value, CURVE_W, CURVE_H)}
                fill="none"
                stroke="url(#curve-stroke)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={false}
                animate={{ d: roastCurve(value, CURVE_W, CURVE_H) }}
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
              />
            </svg>

            <dl className="mt-6 grid gap-4">
              {bars.map((bar) => (
                <div key={bar.label} className="grid grid-cols-[92px_1fr] items-center gap-4">
                  <dt className="text-[13px] text-latte/80">{bar.label}</dt>
                  <dd className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-gold to-terracotta"
                      initial={false}
                      animate={{ width: `${bar.value * 100}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 22 }}
                    />
                    <span className="sr-only">{Math.round(bar.value * 100)} out of 100</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {stop.notes.map((note) => (
                  <motion.span
                    key={note}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="rounded-full border border-peach/30 bg-peach/10 px-3 py-1 text-[13px] text-peach"
                  >
                    {note}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
