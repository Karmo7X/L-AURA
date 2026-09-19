"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { Flame, HandHeart, Sprout } from "lucide-react";
import { IMAGES } from "@/lib/data";
import { EASE_SOFT } from "@/lib/cn";

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_SOFT } },
};

const VALUES = [
  { icon: Sprout, title: "Direct Trade", text: "Single-origin micro-lots bought straight from highland growers." },
  { icon: Flame, title: "1968 Drum Roaster", text: "A restored cast-iron roaster for slow, even development." },
  { icon: HandHeart, title: "Made by Hand", text: "Every cup dialed in by baristas who taste every shot." },
];

const STATS = [
  { value: "12", label: "Years roasting" },
  { value: "9", label: "Partner farms" },
  { value: "340k", label: "Cups poured" },
];

export function About() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.04, 1.12]);

  return (
    <section
      ref={section}
      id="about"
      aria-labelledby="about-title"
      className="relative isolate overflow-hidden bg-espresso-900 py-28 text-linen lg:py-40"
    >
      <motion.div aria-hidden style={{ y: imageY, scale: imageScale }} className="absolute inset-x-0 -top-[14%] -bottom-[14%] -z-20">
        <Image src={IMAGES.interior} alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-espresso-900/95 via-espresso-900/80 to-espresso-900/35"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-espresso-900/80 to-transparent" />

      <div className="container-page">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="max-w-2xl"
        >
          <motion.span variants={rise} className="label-caps inline-block text-peach">
            About Us · The Sanctuary
          </motion.span>
          <motion.h2
            variants={rise}
            id="about-title"
            className="mt-4 font-serif text-[32px] leading-10 font-medium text-balance lg:text-[48px] lg:leading-[56px] lg:tracking-[-0.015em]"
          >
            The Ritual of Slowness in an <em className="text-peach">Accelerated</em> World
          </motion.h2>
          <motion.p variants={rise} className="mt-6 text-[15px] leading-7 text-latte lg:text-lg lg:leading-8">
            L’AURA began with a simple idea: coffee isn’t just fuel, it’s a pause. In our sun-drenched Arts District
            roastery, every variable, from water minerality to roast curve, is tuned by hand so that each cup tastes
            like the place it came from.
          </motion.p>

          <motion.dl variants={rise} className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1 border-l border-peach/30 pl-4">
                <dt className="label-caps text-latte/70">{stat.label}</dt>
                <dd className="font-serif text-3xl text-linen">{stat.value}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.ul variants={stagger} className="mt-12 grid gap-4 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <motion.li
                key={title}
                variants={rise}
                className="rounded-xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.1]"
              >
                <Icon className="h-6 w-6 text-peach" aria-hidden />
                <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-latte/85">{text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
