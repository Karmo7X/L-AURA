"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowDown, Plus } from "lucide-react";
import { stopsFor, type HeroSlide } from "@/lib/heroSlides";
import { dominantColour, type Palette } from "@/lib/imageColour";
import { formatPrice, useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { getLenis } from "@/components/providers/SmoothScroll";
import Image from "next/image";
import { DrinkStage } from "./DrinkStage";

/** Scroll progress is NaN until the section has been measured. */
const finite = (v: number) => (Number.isFinite(v) ? v : 0);

/** Share of each drink's scroll, at either end, where the stage simply rests. */
const HOLD = 0.22;

/**
 * Scroll progress (0–1) → a continuous slide position (0 … count−1).
 *
 * Each drink rests at a whole number while you scroll through the middle of
 * its screen, then eases to the next with a smootherstep, so there's no jolt
 * at the start or end of a change. Everything on the stage is a function of
 * this one number, which is why scrolling back plays it exactly in reverse.
 */
function slidePosition(progress: number, count: number) {
  const base = Math.min(count - 1, Math.max(0, finite(progress) * count - 0.5));
  const i = Math.floor(base);
  const t = Math.min(1, Math.max(0, (base - i - HOLD) / (1 - 2 * HOLD)));
  return Math.min(count - 1, i + t * t * t * (t * (t * 6 - 15) + 10));
}

/** Specks of dust in the beam — fixed so the server and the browser agree. */
const MOTES = [
  { left: "46%", top: "72%", delay: "0s", duration: "11s" },
  { left: "52%", top: "84%", delay: "2.4s", duration: "13s" },
  { left: "58%", top: "66%", delay: "4.1s", duration: "10s" },
  { left: "49%", top: "92%", delay: "6.3s", duration: "14s" },
  { left: "62%", top: "78%", delay: "8.2s", duration: "12s" },
  { left: "44%", top: "88%", delay: "1.2s", duration: "15s" },
];

const slide: Variants = {
  enter: (dir: number) => ({ y: dir >= 0 ? "105%" : "-105%", opacity: 0 }),
  center: { y: "0%", opacity: 1, transition: { duration: 0.75, ease: EASE_SOFT } },
  exit: (dir: number) => ({
    y: dir >= 0 ? "-105%" : "105%",
    opacity: 0,
    transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] },
  }),
};

// transform + opacity only, so text changes stay on the compositor
const fade: Variants = {
  enter: (dir: number) => ({ y: dir >= 0 ? 24 : -24, opacity: 0 }),
  center: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE_SOFT, delay: 0.08 } },
  exit: (dir: number) => ({ y: dir >= 0 ? -14 : 14, opacity: 0, transition: { duration: 0.3, ease: EASE_SOFT } }),
};

/**
 * The hero is a slider through the drinks the cafe picked (admin → Products),
 * driven by scroll. The section is pinned for one screen of scrolling per
 * drink, each scrubbed into a lit set where every layer moves at its own depth.
 */
export function CoffeeSlider({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const addToCart = useCafe((s) => s.addToCart);
  const showToast = useCafe((s) => s.showToast);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  const progress = useTransform(scrollYProgress, finite);
  const pos = useTransform(scrollYProgress, (v) => slidePosition(v, count));

  // The copy switches halfway through a change, with a little hysteresis so
  // a scroll that hovers right at the midpoint can't make it flicker.
  useMotionValueEvent(pos, "change", (v) => {
    if (Math.abs(v - index) < 0.54) return;
    const next = Math.round(v);
    if (next !== index) {
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    }
  });

  // Progress through the current drink's screen (0–1), for the rail.
  const within = useTransform(scrollYProgress, (v) => {
    const scaled = finite(v) * count;
    return Math.min(1, scaled - Math.min(count - 1, Math.floor(scaled)));
  });
  const liveWidth = useTransform(within, (v) => `${Math.round(v * 100)}%`);

  // The room takes its colour from the drink standing in it: each photo is
  // sampled in the browser, and until that lands the product's own accent
  // (admin → Products) stands in.
  const [palette, setPalette] = useState<(Palette | null)[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(slides.map((s) => dominantColour(s.image))).then((picked) => {
      if (!cancelled) setPalette(picked);
    });
    return () => {
      cancelled = true;
    };
  }, [slides]);

  // Colours and drift follow the continuous values, never jumping at a change.
  const tone = useTransform(pos, ...stopsFor(slides.map((s, i) => palette[i]?.tone ?? s.tone)));
  const glow = useTransform(pos, ...stopsFor(slides.map((s, i) => palette[i]?.glow ?? s.glow)));
  const wordX = useTransform(progress, (v) => `${(0.5 - v) * 24}%`);

  // Pointer parallax.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 40, damping: 18 });
  const py = useSpring(rawY, { stiffness: 40, damping: 18 });
  const glowX = useTransform(px, (v) => v * -40);
  const glowY = useTransform(py, (v) => v * -24);
  const copyX = useTransform(px, (v) => v * -8);
  const bgX = useTransform(px, (v) => v * -14);
  const bgY = useTransform(progress, (v) => (v - 0.5) * 60);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1);
      rawY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);

  const jumpTo = (i: number) => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    const target = top + ((i + 0.5) / count) * travel;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const current = slides[Math.min(index, count - 1)];
  const details = [current.strength, current.milk, current.size].filter((d) => d != null).length;

  return (
    <section
      ref={section}
      id="home"
      aria-roledescription="carousel"
      aria-label="Our coffees"
      className="relative bg-espresso-950 text-linen"
      style={{ height: `${count * 100}vh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* tone shifts with each drink, blended by scroll */}
        <motion.div aria-hidden className="absolute inset-0" style={{ backgroundColor: tone }} />
        {/* the room: dark at the edges, lit where the drink stands — the hue
            underneath is the drink's own, so this stays colourless */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_55%_22%,rgba(255,250,240,0.08)_0%,rgba(10,6,4,0.3)_52%,rgba(8,5,3,0.82)_92%)]"
        />
        <div
          aria-hidden
          className="light-beam animate-beam absolute -top-10 left-[42%] h-[130%] w-[520px] origin-top"
        />
        {/* dust drifting through the beam */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {MOTES.map((m, i) => (
            <span
              key={i}
              className="animate-mote absolute h-[3px] w-[3px] rounded-full bg-linen/50"
              style={{ left: m.left, top: m.top, animationDelay: m.delay, animationDuration: m.duration }}
            />
          ))}
        </div>
        {/* the drink again, far behind: huge, blurred and dim — the deepest layer */}
        <motion.div aria-hidden style={{ x: bgX, y: bgY, scale: 1.25 }} className="absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.22 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: EASE_SOFT }}
              className="absolute inset-0"
            >
              <Image
                src={current.image}
                alt=""
                fill
                sizes="50vw"
                loading="eager"
                className="object-contain object-right blur-3xl saturate-[0.8]"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <motion.div
          aria-hidden
          style={{ x: glowX, y: glowY, backgroundColor: glow }}
          className="absolute top-1/2 right-[6%] h-[70vh] w-[70vh] -translate-y-1/2 rounded-full opacity-[0.18] blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,transparent_40%,rgba(8,4,2,0.7)_100%)]"
        />

        {/* the drink's name, huge and outlined, drifting behind everything */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[6%] overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={fade}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ x: wordX }}
              className="absolute inset-x-0 bottom-0 text-center font-serif text-[22vw] leading-none font-semibold whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgba(223,192,179,0.14)] lg:text-[15vw]"
            >
              {current.name}
            </motion.div>
          </AnimatePresence>
          <div className="invisible text-[22vw] leading-none lg:text-[15vw]">&nbsp;</div>
        </div>

        <h1 className="sr-only">L’AURA — specialty coffee house</h1>

        <div className="container-page relative grid h-full grid-rows-[auto_1fr] items-center gap-4 pt-24 pb-28 lg:grid-cols-12 lg:grid-rows-1 lg:gap-8 lg:pt-20 lg:pb-24">
          {/* copy */}
          <motion.div style={{ x: copyX }} className="order-2 lg:order-1 lg:col-span-6">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg text-peach tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <span className="h-px w-10 bg-peach/40" />
              <span className="label-caps text-latte/60">{String(count).padStart(2, "0")}</span>
            </div>

            <div aria-live="polite" className="mt-4 grid">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={fade}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="col-start-1 row-start-1"
                >
                  <p className="label-caps text-peach">{current.kicker}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-2 grid overflow-hidden pb-2">
              <AnimatePresence initial={false} custom={direction}>
                <motion.p
                  key={current.id}
                  custom={direction}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="col-start-1 row-start-1 font-serif text-[52px] leading-[58px] font-semibold tracking-[-0.02em] sm:text-[72px] sm:leading-[78px] lg:text-[92px] lg:leading-[96px]"
                >
                  {current.name}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-4 grid max-w-md">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={fade}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="col-start-1 row-start-1"
                >
                  <p className="text-[15px] leading-7 text-latte/90 text-pretty lg:text-lg lg:leading-8">
                    {current.copy}
                  </p>

                  {details > 0 && (
                    <dl className="mt-6 grid grid-cols-3 gap-5">
                      {current.strength != null && (
                        <div className="flex flex-col-reverse gap-1.5 border-l border-peach/30 pl-3">
                          <dt className="label-caps text-latte/60">Strength</dt>
                          <dd className="flex gap-1" aria-label={`${current.strength} out of 5`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  i < current.strength! ? "bg-peach" : "bg-white/15",
                                )}
                              />
                            ))}
                          </dd>
                        </div>
                      )}
                      {current.milk && (
                        <div className="flex flex-col-reverse gap-1 border-l border-peach/30 pl-3">
                          <dt className="label-caps text-latte/60">Milk</dt>
                          <dd className="font-serif text-lg text-linen">{current.milk}</dd>
                        </div>
                      )}
                      {current.size && (
                        <div className="flex flex-col-reverse gap-1 border-l border-peach/30 pl-3">
                          <dt className="label-caps text-latte/60">Size</dt>
                          <dd className="font-serif text-lg text-linen">{current.size}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="font-serif text-3xl text-linen tabular-nums">{formatPrice(current.price)}</span>
              <button
                type="button"
                onClick={() => {
                  addToCart({ key: current.id, name: current.name, price: current.price });
                  showToast(`${current.name} added — check the printer`);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-paper shadow-[0_14px_34px_-12px_rgba(176,90,42,0.9)] transition duration-300 ease-soft hover:scale-[1.04] hover:bg-[#9c4d22] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add to order
              </button>
            </div>
          </motion.div>

          {/* the drink — a cut-out in a layered set with depth parallax */}
          <div className="relative order-1 h-[38vh] min-h-[260px] w-full lg:order-2 lg:col-span-6 lg:h-[70vh]">
            <DrinkStage slides={slides} slide={current} pos={pos} progress={progress} px={px} py={py} />
          </div>
        </div>

        {/* rail: one segment per drink, filling as you scroll */}
        <div className="absolute inset-x-0 bottom-8">
          <div className="container-page flex items-end gap-3 sm:gap-5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Show ${s.name}`}
                aria-current={i === index ? "true" : undefined}
                className="group flex flex-1 flex-col gap-2 text-left"
              >
                <span
                  className={cn(
                    "label-caps hidden transition-colors sm:block",
                    i === index ? "text-linen" : "text-latte/45 group-hover:text-latte/80",
                  )}
                >
                  {s.name}
                </span>
                <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/12">
                  {i === index ? (
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-peach"
                      style={{ width: liveWidth }}
                    />
                  ) : (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-peach transition-[width] duration-500"
                      style={{ width: i < index ? "100%" : "0%" }}
                    />
                  )}
                </span>
              </button>
            ))}
            <span className="hidden items-center gap-2 pb-0.5 text-latte/60 lg:flex">
              <span className="label-caps text-[10px]">Scroll</span>
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
