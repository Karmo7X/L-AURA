"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/data";
import { cn, EASE_SOFT } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";

const AUTOPLAY_MS = 6500;

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = TESTIMONIALS.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [index, paused, go]);

  const t = TESTIMONIALS[index];

  return (
    <section aria-labelledby="testimonials-title" className="relative overflow-hidden bg-oat py-24 lg:py-32">
      <div aria-hidden className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-[100px]" />
      <div className="container-page relative">
        <SectionHeading id="testimonials-title" eyebrow="Patron Impressions" title="Words From Our Regulars" />

        <div
          className="mx-auto mt-12 max-w-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Customer testimonials"
            className="relative rounded-3xl border border-espresso-800/[0.06] bg-paper px-6 py-10 text-center shadow-card sm:px-14 sm:py-14"
          >
            <Quote aria-hidden className="absolute top-6 left-6 h-10 w-10 text-terracotta/15 sm:h-14 sm:w-14" />
            <div className="flex justify-center gap-1 text-gold" aria-label="Rated 5 out of 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4.5 w-4.5 fill-current" aria-hidden />
              ))}
            </div>

            <div className="relative mt-6 grid min-h-[210px] place-items-center sm:min-h-[190px]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.figure
                  key={index}
                  initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.6, ease: EASE_SOFT }}
                >
                  <blockquote className="font-serif text-[22px] leading-8 text-espresso-800 text-balance sm:text-[28px] sm:leading-10">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6">
                    <span className="block text-base font-semibold text-espresso-800">{t.author}</span>
                    <span className="label-caps mt-1 block text-subtle">{t.role}</span>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="grid h-11 w-11 place-items-center rounded-full border border-espresso-800/10 bg-linen text-espresso-800 transition duration-300 ease-soft hover:scale-105 hover:bg-oat"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((item, i) => (
                  <button
                    key={item.author}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show testimonial ${i + 1}`}
                    aria-current={i === index}
                    className="grid h-6 place-items-center"
                  >
                    <span
                      className={cn(
                        "block h-2 rounded-full transition-all duration-500 ease-soft",
                        i === index ? "w-6 bg-terracotta" : "w-2 bg-oat-deep hover:bg-subtle/40",
                      )}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="grid h-11 w-11 place-items-center rounded-full border border-espresso-800/10 bg-linen text-espresso-800 transition duration-300 ease-soft hover:scale-105 hover:bg-oat"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
