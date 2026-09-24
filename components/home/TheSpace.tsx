"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { cn, EASE_SOFT } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SpaceContent } from "@/lib/content";

/**
 * The room as it is: the photograph drifts a little against the page as you
 * scroll, the window light sweeps across it, and tapping a marker — or a card
 * — dims everything but that corner.
 */
export function TheSpace({ content }: { content: SpaceContent }) {
  const zones = content.zones;
  const section = useRef<HTMLElement>(null);
  const [zone, setZone] = useState<string | null>(null);
  const active = zones.find((z) => z.id === zone) ?? null;

  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  // the photo moves slower than the page, and eases back to its own size
  const drift = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.04, 1.12]);
  const lightX = useTransform(scrollYProgress, [0, 1], ["-10%", "160%"]);

  return (
    <section ref={section} id="sanctuary" aria-labelledby="space-title" className="linen-pattern py-24 lg:py-32">
      <div className="container-page">
        <SectionHeading
          id="space-title"
          eyebrow={content.eyebrow}
          title={content.title}
          divider
          description={content.description}
        />

        {/* the room */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1, ease: EASE_SOFT }}
          className="relative mt-14 overflow-hidden rounded-3xl border border-espresso-800/10 bg-[#efe6d9] shadow-card"
        >
          {/* the room itself, drifting a little as you scroll past it */}
          <motion.div style={{ y: drift, scale }} className="relative">
            <Image
              src={content.photo}
              alt="Inside L’AURA: paper lanterns over the oak counter, the roaster behind the bar and long tables in the window light"
              width={1376}
              height={768}
              priority={false}
              sizes="(min-width: 1024px) 1200px, 100vw"
              className="aspect-[1376/768] w-full object-cover"
            />
          </motion.div>
          {/* the light from the window, breathing */}
          <motion.div
            aria-hidden
            style={{ x: lightX }}
            className="animate-beam pointer-events-none absolute inset-y-0 -left-1/4 w-2/3 bg-[linear-gradient(105deg,transparent_0%,rgba(255,244,222,0.28)_45%,transparent_78%)] mix-blend-screen"
          />

          {/* the room dims to the corner you picked */}
          <AnimatePresence>
            {active && (
              <motion.div
                key={active.id}
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE_SOFT }}
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(38% 46% at ${active.x}% ${active.y}%, rgba(15,8,5,0) 0%, rgba(15,8,5,0.16) 46%, rgba(15,8,5,0.62) 100%)`,
                }}
              />
            )}
          </AnimatePresence>

          {/* markers */}
          {zones.map((z) => {
            const on = zone === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setZone(on ? null : z.id)}
                aria-pressed={on}
                // the photo is cropped on a phone, so the markers only make
                // sense once the whole room is on screen
                className="absolute z-20 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
                style={{ left: `${z.x}%`, top: `${z.y}%` }}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border text-[12px] transition-transform duration-300",
                    on
                      ? "scale-110 border-terracotta bg-terracotta text-paper"
                      : "animate-pulse-ring border-terracotta/60 bg-paper/90 text-espresso-800 hover:scale-110",
                  )}
                >
                  ✦
                </span>
                <span
                  className={cn(
                    "label-caps absolute top-10 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-espresso-950/85 px-2.5 py-1 text-[9px] whitespace-nowrap text-linen transition-opacity duration-300",
                    on ? "opacity-100" : "opacity-0 sm:opacity-70",
                  )}
                >
                  {z.pin}
                </span>
              </button>
            );
          })}

          {/* the caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-espresso-950/80 to-transparent p-6 sm:p-8">
            <span className="label-caps text-[10px] text-peach">{content.captionKicker}</span>
            <p className="mt-1 font-serif text-2xl text-linen sm:text-3xl">{content.captionTitle}</p>
          </div>
        </motion.div>

        {/* the three zones */}
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {zones.map((z, i) => {
            const on = zone === z.id;
            return (
              <motion.li
                key={z.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_SOFT }}
              >
                <button
                  type="button"
                  onClick={() => setZone(on ? null : z.id)}
                  aria-pressed={on}
                  className={cn(
                    "h-full w-full rounded-2xl border bg-paper p-6 text-left shadow-card transition-[border-color,transform,box-shadow] duration-500 ease-soft hover:-translate-y-1 hover:shadow-card-hover sm:p-8",
                    on ? "border-terracotta/60" : "border-espresso-800/10",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold transition-colors",
                      on ? "bg-terracotta text-paper" : "bg-oat text-terracotta",
                    )}
                  >
                    {z.n}
                  </span>
                  <span className="label-caps mt-5 block text-terracotta">{z.eyebrow}</span>
                  <h3 className="mt-1 font-serif text-2xl text-espresso-800">{z.title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-muted">{z.copy}</p>
                  <span className="mt-5 flex items-center justify-between border-t border-espresso-800/8 pt-4 text-[12px] text-subtle">
                    {z.meta}
                    <span className="font-semibold text-terracotta">{on ? "Showing ✦" : "Show me →"}</span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* what the room is made of */}
        <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-2xl border border-espresso-800/10 bg-oat/70 p-6 sm:p-8 md:flex-row">
          <div>
            <span className="label-caps text-subtle">Tactile sensory palette</span>
            <p className="mt-1 font-serif text-xl text-espresso-800">Built from four honest materials</p>
          </div>
          <ul className="flex flex-wrap items-center gap-3">
            {content.materials.map((m) => (
              <li
                key={m.label}
                className="flex items-center gap-2 rounded-xl border border-espresso-800/10 bg-paper px-3.5 py-2 text-[13px] text-muted shadow-[0_2px_6px_rgba(43,26,18,0.04)]"
              >
                <span className="h-3 w-3 rounded-full" style={{ background: m.swatch }} />
                {m.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
