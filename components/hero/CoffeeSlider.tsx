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
import { HERO_SLIDES } from "@/lib/heroSlides";
import { formatPrice, useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { getLenis } from "@/components/providers/SmoothScroll";
import Image from "next/image";
import { DrinkStage } from "./DrinkStage";

const COUNT = HERO_SLIDES.length;

/** Scroll progress is NaN until the section has been measured. */
const finite = (v: number) => (Number.isFinite(v) ? v : 0);

const slide: Variants = {
  enter: (dir: number) => ({ y: dir >= 0 ? "105%" : "-105%", opacity: 0 }),
  center: { y: "0%", opacity: 1, transition: { duration: 0.75, ease: EASE_SOFT } },
  exit: (dir: number) => ({
    y: dir >= 0 ? "-105%" : "105%",
    opacity: 0,
    transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] },
  }),
};

const fade: Variants = {
  enter: (dir: number) => ({ y: dir >= 0 ? 24 : -24, opacity: 0, filter: "blur(6px)" }),
  center: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_SOFT, delay: 0.08 } },
  exit: { opacity: 0, filter: "blur(6px)", transition: { duration: 0.25 } },
};

/**
 * The hero is a slider through four drinks, driven by scroll. The section is
 * pinned for four screens' worth of scrolling; each screen is one drink,
 * swinging into a lit set where every layer moves at its own depth.
 */
export function CoffeeSlider() {
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const addToCart = useCafe((s) => s.addToCart);
  const showToast = useCafe((s) => s.showToast);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    const v = finite(raw);
    const next = Math.min(COUNT - 1, Math.max(0, Math.floor(v * COUNT)));
    if (next !== index) {
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    }
  });

  // Progress through the current drink (0–1), for the rail and the parallax.
  const within = useTransform(scrollYProgress, (v) => {
    const scaled = finite(v) * COUNT;
    return Math.min(1, scaled - Math.min(COUNT - 1, Math.floor(scaled)));
  });
  const wordX = useTransform(within, (v) => `${(0.5 - v) * 14}%`);
  const liveWidth = useTransform(within, (v) => `${Math.round(v * 100)}%`);
  const cupLift = useTransform(within, (v) => (v - 0.5) * -24);

  // Pointer parallax.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 40, damping: 18 });
  const py = useSpring(rawY, { stiffness: 40, damping: 18 });
  const glowX = useTransform(px, (v) => v * -40);
  const glowY = useTransform(py, (v) => v * -24);
  const copyX = useTransform(px, (v) => v * -8);
  const bgX = useTransform(px, (v) => v * -14);
  const bgY = useTransform(within, (v) => (v - 0.5) * 30);

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
    const target = top + ((i + 0.5) / COUNT) * travel;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const current = HERO_SLIDES[index];

  return (
    <section
      ref={section}
      id="home"
      aria-roledescription="carousel"
      aria-label="Our coffees"
      className="relative bg-espresso-950 text-linen"
      style={{ height: `${COUNT * 100}vh` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* tone shifts with each drink */}
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{ backgroundColor: current.tone }}
          transition={{ duration: 0.9, ease: EASE_SOFT }}
        />
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
          style={{ x: glowX, y: glowY }}
          animate={{ backgroundColor: current.glow }}
          transition={{ duration: 0.9, ease: EASE_SOFT }}
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
              <span className="label-caps text-latte/60">{String(COUNT).padStart(2, "0")}</span>
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
                  <p className="text-[15px] leading-7 text-latte/90 text-pretty lg:text-lg lg:leading-8">{current.copy}</p>

                  <dl className="mt-6 grid grid-cols-3 gap-5">
                    <div className="flex flex-col-reverse gap-1.5 border-l border-peach/30 pl-3">
                      <dt className="label-caps text-latte/60">Strength</dt>
                      <dd className="flex gap-1" aria-label={`${current.strength} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn("h-2 w-2 rounded-full", i < current.strength ? "bg-peach" : "bg-white/15")}
                          />
                        ))}
                      </dd>
                    </div>
                    <div className="flex flex-col-reverse gap-1 border-l border-peach/30 pl-3">
                      <dt className="label-caps text-latte/60">Milk</dt>
                      <dd className="font-serif text-lg text-linen">{current.milk}</dd>
                    </div>
                    <div className="flex flex-col-reverse gap-1 border-l border-peach/30 pl-3">
                      <dt className="label-caps text-latte/60">Size</dt>
                      <dd className="font-serif text-lg text-linen">{current.size}</dd>
                    </div>
                  </dl>
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
          <motion.div
            style={{ y: cupLift }}
            className="relative order-1 h-[38vh] min-h-[260px] w-full lg:order-2 lg:col-span-6 lg:h-[70vh]"
          >
            <DrinkStage slide={current} direction={direction} within={within} px={px} py={py} />
          </motion.div>
        </div>

        {/* rail: one segment per drink, filling as you scroll */}
        <div className="absolute inset-x-0 bottom-8">
          <div className="container-page flex items-end gap-3 sm:gap-5">
            {HERO_SLIDES.map((s, i) => (
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
                    <motion.span className="absolute inset-y-0 left-0 rounded-full bg-peach" style={{ width: liveWidth }} />
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
