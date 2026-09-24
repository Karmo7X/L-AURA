"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn, EASE_SOFT } from "@/lib/cn";
import type { Cadence, DayContent } from "@/lib/content";

/** The shop is in LA — the arc follows its day, not the reader's. */
const SHOP_TIME_ZONE = "America/Los_Angeles";
/** The arc spans opening to closing. */
const OPENS = 7;
const CLOSES = 19;

/** A dot per tempo: morning gold, midday green, evening clay. */
const DOTS = ["bg-gold", "bg-sage", "bg-terracotta"];

/** Where the sun sits along the arc, 0 at opening and 1 at closing. */
function arcPoint(hour: number) {
  const t = Math.min(1, Math.max(0, (hour - OPENS) / (CLOSES - OPENS)));
  // the same quadratic the arc is drawn with, so the marker rides the line
  const y = (1 - t) * (1 - t) * 0.8 + 2 * (1 - t) * t * 0.05 + t * t * 0.8;
  return { t, y };
}

function cadenceAt(hour: number, cadences: Cadence[]) {
  return (
    cadences.find((c) => hour >= c.from && hour < c.to) ?? (hour < OPENS ? cadences[0] : cadences[cadences.length - 1])
  );
}

/**
 * The day, as the room actually plays it: three cadences, with the sun riding
 * an arc to wherever the cafe's own clock has got to. The card matching the
 * current hour opens by itself; tapping another one takes you there.
 */
export function DayCadence({ content }: { content: DayContent }) {
  const cadences = content.cadences;
  const [hour, setHour] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // the clock only starts in the browser, so the first paint matches the server
  useEffect(() => {
    const read = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: SHOP_TIME_ZONE,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(new Date());
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
      const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      setHour((h % 24) + m / 60);
    };
    read();
    const timer = window.setInterval(read, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const live = hour == null ? cadences[0] : cadenceAt(hour, cadences);
  const active = cadences.find((c) => c.id === picked) ?? live;
  const open = hour != null && hour >= OPENS && hour < CLOSES;
  const sun = arcPoint(hour ?? 9);

  return (
    <section
      id="day-cadence"
      aria-labelledby="day-title"
      data-dark-section
      className="relative overflow-hidden bg-forest-deep py-24 text-linen lg:py-32"
    >
      {/* the light in the room drifts with the hour */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 h-[520px] w-[520px] rounded-full bg-gold/12 blur-[130px]"
        animate={{ left: `${10 + sun.t * 70}%` }}
        transition={{ duration: 2.4, ease: EASE_SOFT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(68,102,60,0.28),transparent_60%)]"
      />

      <div className="container-page relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: EASE_SOFT }}
            className="lg:col-span-7"
          >
            <span className="label-caps text-peach">{content.eyebrow}</span>
            <h2 id="day-title" className="mt-3 font-serif text-[34px] leading-[1.05] font-medium lg:text-[52px]">
              {content.title}
              <span className="mt-1 block font-serif text-[28px] italic lg:text-[44px]">{content.italic}</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE_SOFT }}
            className="text-[15px] leading-7 text-latte/80 lg:col-span-5"
          >
            {content.intro}
          </motion.p>
        </div>

        {/* the sun's arc across opening hours */}
        <div className="mt-14">
          <div className="relative h-24 sm:h-28">
            <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0,80 Q50,5 100,80"
                fill="none"
                stroke="rgb(223 192 179 / 0.22)"
                strokeWidth="0.6"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {cadences.map((c) => {
              const mark = arcPoint((c.from + c.to) / 2);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPicked(c.id)}
                  aria-label={`Show ${c.title}`}
                  aria-current={active.id === c.id ? "true" : undefined}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-3"
                  style={{ left: `${mark.t * 100}%`, top: `${mark.y * 100}%` }}
                >
                  <span
                    className={cn(
                      "block h-2.5 w-2.5 rounded-full transition-all duration-500",
                      active.id === c.id ? "scale-150 bg-peach" : "bg-latte/35 hover:bg-latte/70",
                    )}
                  />
                </button>
              );
            })}
            {/* where the cafe's own clock has got to */}
            <motion.span
              aria-hidden
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center"
              initial={false}
              animate={{ left: `${sun.t * 100}%`, top: `${sun.y * 100}%` }}
              transition={{ duration: 2.4, ease: EASE_SOFT }}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full",
                  open ? "bg-gold shadow-[0_0_28px_8px_rgba(217,165,102,0.5)]" : "bg-latte/40",
                )}
              />
            </motion.span>
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-latte/45 tabular-nums">
            <span>07:00</span>
            <span aria-live="polite" className="label-caps text-peach">
              {hour == null
                ? "Today at the bar"
                : open
                  ? `Now · ${live.title.split("&")[0].trim()}`
                  : "Closed for the night"}
            </span>
            <span>19:00</span>
          </div>
        </div>

        {/* the three tempos */}
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {cadences.map((c, i) => {
            const on = active.id === c.id;
            return (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_SOFT }}
              >
                <button
                  type="button"
                  onClick={() => setPicked(c.id)}
                  aria-pressed={on}
                  className={cn(
                    "group relative h-full w-full overflow-hidden rounded-2xl border p-6 text-left transition-colors duration-500 sm:p-8",
                    on
                      ? "border-terracotta/70 bg-white/[0.05]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="cadence-glow"
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-terracotta/25 blur-3xl"
                    />
                  )}
                  <span className="relative flex items-center justify-between">
                    <span className="label-caps rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-latte/80 tabular-nums">
                      {c.hours}
                    </span>
                    <span className={cn("text-lg transition-colors", on ? "text-peach" : "text-latte/50")}>
                      {c.glyph}
                    </span>
                  </span>
                  <h3
                    className={cn(
                      "relative mt-4 font-serif text-2xl transition-colors",
                      on ? "text-peach" : "text-linen group-hover:text-peach",
                    )}
                  >
                    {c.title}
                  </h3>
                  <p className="relative mt-2 text-[14px] leading-6 text-latte/75">{c.copy}</p>
                  <span className="relative mt-5 flex items-center gap-2 border-t border-white/10 pt-3 text-[12px] text-latte/60">
                    <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[i % DOTS.length])} />
                    {c.mood}
                    {live.id === c.id && open && (
                      <span className="label-caps ml-auto text-[9px] text-peach">Happening now</span>
                    )}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* what that hour actually feels like */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE_SOFT }}
              className="grid gap-6 p-6 sm:p-8 md:grid-cols-4 md:items-center"
            >
              <div className="border-b border-white/10 pb-4 md:border-r md:border-b-0 md:pr-6 md:pb-0">
                <span className="label-caps text-terracotta">Current cadence</span>
                <p className="mt-1 font-serif text-2xl text-linen">{active.title.split("&")[0].trim()}</p>
                <span className="text-[12px] text-latte/60 tabular-nums">{active.hours}</span>
              </div>
              <p className="text-[14px] leading-7 text-latte/80 italic md:col-span-2">“{active.quote}”</p>
              <div className="flex flex-col gap-2">
                <span className="label-caps text-[10px] text-latte/50">On the bar</span>
                <div className="flex flex-wrap gap-1.5">
                  {active.tags.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 + i * 0.07, ease: EASE_SOFT }}
                      className="rounded-md bg-white/10 px-2.5 py-1 text-[12px] text-latte"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
