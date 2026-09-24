"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE_SOFT } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CupLogo } from "@/components/ui/icons";
import type { BarContent } from "@/lib/content";

/**
 * The front bar: who is pouring, and what they wrote on the board this
 * morning. Both are the cafe's own (admin → Home page).
 */
export function BaristaTable({ content }: { content: BarContent }) {
  return (
    <section id="barista-table" aria-labelledby="bar-title" className="linen-pattern py-24 lg:py-32">
      <div className="container-page">
        <SectionHeading
          id="bar-title"
          eyebrow={content.eyebrow}
          title={content.title}
          divider
          description={content.description}
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-stretch">
          {/* ------------------------------------------------------ the counter */}
          <motion.figure
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE_SOFT }}
            className="group relative overflow-hidden rounded-2xl border border-espresso-800/10 bg-espresso-900 shadow-card"
          >
            <Image
              src={content.photo}
              alt="The counter at L’AURA: a V60 going through, the day's chalkboard beside it"
              width={1200}
              height={896}
              sizes="(min-width: 1024px) 620px, 92vw"
              className="h-full min-h-[320px] w-full object-cover transition-transform duration-[900ms] ease-soft group-hover:scale-[1.04]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-espresso-950/85 via-transparent to-transparent"
            />
            <figcaption className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2 text-linen">
              <span className="flex items-center gap-2 text-[13px]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sage" />
                {content.shift}
              </span>
              <span className="rounded-full border border-white/15 bg-white/15 px-2.5 py-1 text-[11px] backdrop-blur-md">
                {content.pour}
              </span>
            </figcaption>
          </motion.figure>

          {/* --------------------------------------------------- the chalkboard */}
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_SOFT }}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-espresso-800/40 bg-[#1c1714] p-6 text-latte shadow-card sm:p-8"
          >
            <div aria-hidden className="bean-pattern pointer-events-none absolute inset-0 opacity-[0.07] invert" />
            <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <span className="label-caps flex items-center gap-2 text-linen">
                <span className="text-terracotta">✦</span>
                Barista’s daily chalkboard
              </span>
              <span className="rounded border border-sage/40 bg-sage/10 px-2 py-0.5 text-[10px] text-sage tabular-nums">
                {content.board.calibrated}
              </span>
            </div>

            <div className="relative mt-6 flex items-start justify-between gap-6">
              <div>
                <span className="label-caps text-[10px] text-latte/50">Featured origin</span>
                <h3 className="mt-1 font-serif text-2xl text-linen sm:text-[30px]">
                  {content.board.origin}{" "}
                  {content.board.grade && <span className="text-latte/50">· {content.board.grade}</span>}
                </h3>
              </div>
              {/* a cup someone left steaming on the board */}
              <span aria-hidden className="relative hidden h-16 w-12 shrink-0 sm:block">
                {[0, 0.9, 1.7].map((delay, i) => (
                  <span
                    key={i}
                    className="animate-steam absolute bottom-8 left-1/2 h-8 w-[6px] -translate-x-1/2 rounded-full bg-linen/25 blur-[3px]"
                    style={{ animationDelay: `${delay}s`, marginLeft: `${(i - 1) * 7}px` }}
                  />
                ))}
                <CupLogo className="absolute bottom-0 left-1/2 h-10 w-10 -translate-x-1/2 text-terracotta" />
              </span>
            </div>

            <dl className="relative mt-6 grid gap-3 rounded-xl border border-white/5 bg-white/5 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] text-latte/50">Tasting accents</dt>
                <dd className="font-medium text-linen">{content.board.accents}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-latte/50">Bar ambient</dt>
                <dd className="font-medium text-linen tabular-nums">{content.board.ambient}</dd>
              </div>
            </dl>

            <p className="relative mt-auto pt-6 text-[15px] leading-7 text-latte/75 italic">“{content.board.quote}”</p>
            <p className="relative mt-2 text-[12px] text-latte/50">— {content.board.barista}</p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
