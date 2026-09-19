"use client";

import { useEffect } from "react";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { ArrowDown, RotateCcw } from "lucide-react";
import { useCafe } from "@/lib/store";
import { EASE_SOFT } from "@/lib/cn";
import { BeanField } from "./BeanField";
import { FallbackCup } from "./FallbackCup";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_SOFT } },
};
const lineUp: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 1.15, ease: EASE_SOFT } },
};

function scrollFade(start: number, length: number) {
  return (y: number) => {
    if (typeof window === "undefined") return 1;
    const vh = window.innerHeight;
    return 1 - Math.min(1, Math.max(0, (y - vh * start) / (vh * length)));
  };
}

const STATS = [
  { value: "93.5", label: "SCA Cupping Score" },
  { value: "2,150m", label: "Farm Elevation" },
  { value: "48hr", label: "Slow Fermentation" },
];

export function Hero() {
  const filled = useCafe((s) => s.heroFilled);
  const webgl = useCafe((s) => s.webgl);
  const setHeroFilled = useCafe((s) => s.setHeroFilled);
  const replayPour = useCafe((s) => s.replayPour);

  const { scrollY } = useScroll();
  const contentOpacity = useTransform(scrollY, scrollFade(0.1, 0.45));
  const atmosphereOpacity = useTransform(scrollY, scrollFade(0.25, 0.6));
  const contentLift = useTransform(scrollY, (y) => y * -0.15);

  // Never leave the headline hidden if the 3D pour can't play.
  useEffect(() => {
    if (webgl === "failed") {
      setHeroFilled(true);
      return;
    }
    const id = setTimeout(() => setHeroFilled(true), 7000);
    return () => clearTimeout(id);
  }, [webgl, setHeroFilled]);

  return (
    <section id="home" aria-labelledby="hero-title" className="relative isolate min-h-svh overflow-hidden text-linen">
      {/* Atmosphere: warm ambient light, pour spotlight, floating beans, vignette */}
      <motion.div aria-hidden style={{ opacity: atmosphereOpacity }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_36%,#3b2117_0%,#20120b_48%,#110905_100%)]" />
        <div className="absolute top-[36%] left-1/2 h-[75vh] w-[75vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/20 blur-[120px]" />
        <div className="absolute top-0 left-1/2 h-[62vh] w-[60vh] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_158deg,rgba(255,200,160,0.09)_172deg,rgba(255,214,178,0.16)_180deg,rgba(255,200,160,0.09)_188deg,transparent_202deg)] blur-md" />
        <BeanField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(8,4,2,0.7)_100%)]" />
      </motion.div>

      <div className="container-page relative flex min-h-svh flex-col items-center pt-20 pb-6 sm:pt-24">
        {/* Cup stage — the WebGL cup is drawn over this anchor */}
        <div className="relative w-full min-h-[250px] flex-1 sm:min-h-[340px]">
          <motion.div aria-hidden style={{ opacity: contentOpacity }} className="pointer-events-none absolute inset-0">
            <div className="absolute bottom-[4%] left-1/2 h-[22%] w-[62%] max-w-[520px] -translate-x-1/2 rounded-[100%] bg-[#ff9d62]/25 blur-3xl" />
            <div className="absolute bottom-[10%] left-1/2 h-[10%] w-[36%] max-w-[300px] -translate-x-1/2 rounded-[100%] bg-[#ffc08f]/30 blur-2xl" />
          </motion.div>

          <div data-cup-anchor="hero" className="absolute inset-x-0 top-[3%] bottom-[3%] mx-auto max-w-[560px]" />

          {webgl === "failed" && (
            <div className="absolute inset-0 grid place-items-center">
              <FallbackCup className="h-[78%] max-h-[420px] w-auto" />
            </div>
          )}

          <motion.dl
            style={{ opacity: contentOpacity }}
            initial="hidden"
            animate={filled ? "show" : "hidden"}
            variants={container}
            className="absolute top-1/2 left-0 hidden -translate-y-1/2 flex-col gap-7 xl:flex"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="flex flex-col-reverse border-l border-peach/30 pl-4">
                <dt className="label-caps text-latte/70">{stat.label}</dt>
                <dd className="font-serif text-2xl text-linen">{stat.value}</dd>
              </motion.div>
            ))}
          </motion.dl>

          <motion.div style={{ opacity: contentOpacity }} className="absolute top-[58%] right-0 hidden xl:block">
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={filled ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 1, ease: EASE_SOFT, delay: 0.5 }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-espresso-800/60 px-4 py-3 shadow-2xl backdrop-blur-md"
            >
              <span className="h-2 w-2 rounded-full bg-peach animate-pulse-ring" />
              <div>
                <p className="label-caps text-[10px] text-latte/80">Today’s Pour</p>
                <p className="text-sm font-semibold">Huila, Colombia · Washed</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Headline appears once the cup is full */}
        <motion.div style={{ opacity: contentOpacity, y: contentLift }} className="relative w-full">
          <motion.div
            initial="hidden"
            animate={filled ? "show" : "hidden"}
            variants={container}
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
          >
            <motion.p variants={fadeUp} className="label-caps inline-flex items-center gap-2 text-peach">
              <span className="h-px w-6 bg-peach/60" />
              Highland Micro-Lot Roastery
              <span className="h-px w-6 bg-peach/60" />
            </motion.p>
            <h1
              id="hero-title"
              className="mt-3 font-serif text-[40px] leading-[48px] font-semibold tracking-[-0.01em] sm:text-[52px] sm:leading-[60px] lg:text-[64px] lg:leading-[72px] lg:tracking-[-0.02em]"
            >
              <span className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span variants={lineUp} className="inline-block">
                  Every Cup
                </motion.span>
              </span>{" "}
              <span className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span variants={lineUp} className="inline-block font-medium text-peach italic">
                  Tells a Story
                </motion.span>
              </span>
            </h1>
            <motion.p variants={fadeUp} className="mt-4 max-w-xl text-[15px] leading-6 text-latte lg:text-lg lg:leading-7">
              From mist-shrouded highland farms to our slow drum roaster — specialty coffee sculpted with unhurried
              devotion.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#customize"
                className="group inline-flex items-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-paper shadow-[0_14px_34px_-12px_rgba(176,90,42,0.9)] transition duration-300 ease-soft hover:scale-[1.04] hover:bg-[#9c4d22] active:scale-[0.98]"
              >
                Craft Your Cup
                <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
              </a>
              <a
                href="#menu"
                className="inline-flex items-center rounded-full border border-linen/20 bg-white/5 px-6 py-3.5 text-sm font-medium backdrop-blur-md transition duration-300 ease-soft hover:scale-[1.04] hover:bg-white/10"
              >
                Explore Menu
              </a>
              {webgl === "ready" && (
                <button
                  type="button"
                  onClick={replayPour}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 text-sm text-latte transition-colors hover:text-linen"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Replay pour
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: contentOpacity }} className="mt-6">
          <motion.a
            href="#customize"
            initial={{ opacity: 0 }}
            animate={{ opacity: filled ? 1 : 0 }}
            transition={{ duration: 1, delay: filled ? 0.9 : 0 }}
            className="group flex flex-col items-center gap-2 text-latte/80 transition-colors hover:text-linen"
          >
            <span className="label-caps text-[10px]">Scroll to explore</span>
            <span className="flex h-10 w-6 justify-center rounded-full border border-latte/40 p-1.5 animate-pulse-ring">
              <span className="h-2 w-1 rounded-full bg-peach animate-scroll-dot" />
            </span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
