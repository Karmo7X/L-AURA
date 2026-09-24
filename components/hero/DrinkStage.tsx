"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useTransform, type MotionValue, type Variants } from "motion/react";
import { stopsFor, type HeroSlide } from "@/lib/heroSlides";
import { cn, EASE_SOFT } from "@/lib/cn";

const DRINK_SIZES = "(min-width: 1024px) 560px, 70vw";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0 below `a`, 1 above `b`, smooth in between. */
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The drink image sits in a square box with object-contain, pinned to the
 * bottom. Convert a point given as % of the image into % of that box.
 */
function onImage([w, h]: [number, number], [fx, fy]: [number, number]): [number, number] {
  const wide = w >= h;
  const iw = wide ? 100 : (100 * w) / h;
  const ih = wide ? (100 * h) / w : 100;
  return [(100 - iw) / 2 + (fx * iw) / 100, 100 - ih + (fy * ih) / 100];
}

/** Width of the ground shadow, as % of the box — roughly the drink's footprint. */
function shadowWidth({ imageSize, scale, cutout }: HeroSlide) {
  if (!cutout) return 56 * scale; // the framed photo's base
  const [w, h] = imageSize ?? [1, 1];
  const iw = w >= h ? 100 : (100 * w) / h;
  return Math.min(62, iw * scale * 0.78);
}

/**
 * Magnify the image around `focus` and slide that point to the middle of the
 * loupe. object-position lines the focus up with the same % point of the box,
 * so scaling about it and nudging it to 50% centres it exactly.
 */
function loupe([fx, fy]: [number, number], zoom = 2.2): React.CSSProperties {
  const at = `${fx}% ${fy}%`;
  return {
    objectPosition: at,
    transformOrigin: at,
    transform: `translate(${50 - fx}%, ${50 - fy}%) scale(${zoom})`,
  };
}

const chip: Variants = {
  enter: { opacity: 0, y: 18 },
  center: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_SOFT, delay: 0.1 + i * 0.1 },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

/**
 * Beans hanging in the air at three depths. `d` is nearness: near beans are
 * bigger, move furthest with scroll and pointer, and fall out of focus.
 */
const BEANS = [
  { x: 6, y: 16, size: 30, r: -24, d: 0.35, delay: 0 },
  { x: 88, y: 8, size: 22, r: 40, d: 0.25, delay: -2.4 },
  { x: 30, y: 2, size: 26, r: 18, d: 0.5, delay: -4.1 },
  { x: 74, y: 30, size: 18, r: -60, d: 0.2, delay: -1.2 },
  { x: 94, y: 56, size: 46, r: 12, d: 0.85, delay: -3.3 },
  { x: 20, y: 78, size: 40, r: 58, d: 0.7, delay: -5.2 },
  { x: 80, y: 88, size: 58, r: -35, d: 1, delay: -0.6 },
] as const;

interface StageProps {
  /** Every drink in the slider, in order. */
  slides: HeroSlide[];
  /** The drink the copy is showing — drives the floating labels. */
  slide: HeroSlide;
  /** Continuous slide position, 0 … count−1. Whole numbers are resting drinks. */
  pos: MotionValue<number>;
  /** Scroll progress through the whole hero, 0–1. */
  progress: MotionValue<number>;
  /** Pointer position, −1…1. */
  px: MotionValue<number>;
  py: MotionValue<number>;
}

/**
 * The drink floats free in a lit set. Nothing here runs on a timer: every
 * layer is a function of the scroll position and the pointer, so it moves
 * exactly as fast as you scroll, and stops when you stop.
 */
export function DrinkStage({ slides, slide, pos, progress, px, py }: StageProps) {
  // slow drift across the whole hero — continuous, so nothing jumps at a change
  const archY = useTransform(progress, (v) => (0.5 - v) * 60);
  const detailY = useTransform(progress, (v) => (0.5 - v) * 200);
  const detailSpin = useTransform(progress, (v) => (v - 0.5) * 40);
  const chipNearY = useTransform(progress, (v) => (0.5 - v) * 300);
  const chipFarY = useTransform(progress, (v) => (0.5 - v) * 140);

  // a light sweep crosses the arch during each change, hidden while resting
  const sweep = useTransform(pos, (v) => `${-60 + (v - Math.floor(v)) * 220}%`);
  const glow = useTransform(pos, ...stopsFor(slides.map((s) => s.glow)));
  const shadow = useTransform(pos, ...stopsFor(slides.map((s) => `${shadowWidth(s)}%`)));
  const ice = useTransform(pos, ...stopsFor(slides.map((s): number => (s.serve === "iced" ? 1 : 0))));

  // pointer depth
  const beam = useTransform(px, (v) => v * 7);
  const archX = useTransform(px, (v) => v * 10);
  const drinkX = useTransform(px, (v) => v * 20);
  const drinkLean = useTransform(px, (v) => v * 2.5);
  const detailX = useTransform(px, (v) => v * 32);
  const chipNearX = useTransform(px, (v) => v * 46);
  const chipFarX = useTransform(px, (v) => v * 20);
  const ringX = useTransform(px, (v) => v * -18);
  const ringY = useTransform(py, (v) => v * -12);

  return (
    <div className="relative h-full w-full">
      {/* a spotlight from above that swings toward the pointer */}
      <motion.div
        aria-hidden
        style={{ rotate: beam }}
        className="pointer-events-none absolute -top-[18%] left-1/2 h-[118%] w-[78%] -translate-x-1/2 origin-top bg-linear-to-b from-[rgba(255,226,196,0.13)] via-[rgba(255,226,196,0.04)] to-transparent blur-md [clip-path:polygon(43%_0,57%_0,100%_100%,0_100%)]"
      />

      {/* orbit rings, drifting against the pointer */}
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY }}
        className="absolute top-1/2 left-1/2 aspect-square h-[96%] -translate-1/2 rounded-full border border-peach/12"
      />
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY }}
        className="absolute top-1/2 left-1/2 aspect-square h-[74%] -translate-1/2 rounded-full border border-dashed border-latte/10"
      />

      {/* the arch: a window of coloured light the drink stands in front of */}
      <motion.div
        aria-hidden
        style={{ x: archX, y: archY }}
        className="absolute bottom-[12%] left-1/2 aspect-[3/4] h-[80%] max-h-[600px] -translate-x-1/2"
      >
        <div className="absolute inset-0 overflow-hidden rounded-t-full rounded-b-[28px] bg-espresso-900/55 ring-1 ring-white/10">
          <motion.div className="absolute inset-0 opacity-20" style={{ backgroundColor: glow }} />
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_30%,transparent_0%,rgba(10,5,3,0.75)_100%)]" />
          <motion.div
            style={{ x: sweep }}
            className="absolute inset-y-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent"
          />
        </div>
      </motion.div>

      {/* far beans (ice, for iced drinks) sit behind the drink */}
      {BEANS.filter((b) => b.d < 0.6).map((b, i) => (
        <Bean key={i} bean={b} pos={pos} ice={ice} progress={progress} px={px} py={py} />
      ))}

      {/* pedestal the drink hovers over */}
      <motion.div
        aria-hidden
        style={{ x: archX }}
        className="absolute bottom-[7%] left-1/2 h-[11%] w-[66%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(58,37,27,0.9),rgba(23,14,9,0.6)_70%,transparent)] shadow-[inset_0_2px_0_rgba(255,226,196,0.08)]"
      />

      {/* the drinks — all mounted, each placed by the scroll position */}
      <motion.div
        style={{ x: drinkX, rotate: drinkLean }}
        className="absolute bottom-[12%] left-1/2 aspect-square h-[74%] max-h-[560px] -translate-x-1/2"
      >
        <motion.span
          aria-hidden
          style={{ width: shadow }}
          className="absolute -bottom-[3%] left-1/2 h-[9%] -translate-x-1/2 animate-levitate-shadow rounded-[50%] bg-black/80 blur-xl"
        />
        {slides.map((s, i) => (
          <DrinkLayer key={s.id} slide={s} index={i} pos={pos} />
        ))}
      </motion.div>

      {/* near beans cross in front of it */}
      {BEANS.filter((b) => b.d >= 0.6).map((b, i) => (
        <Bean key={i} bean={b} pos={pos} ice={ice} progress={progress} px={px} py={py} />
      ))}

      {/* close-up loupe on the top of the drink, nearer the camera */}
      <motion.div
        style={{ y: detailY, x: detailX, rotate: detailSpin }}
        className="absolute bottom-[4%] left-[2%] z-20 hidden aspect-square h-[28%] max-h-[200px] overflow-hidden rounded-full bg-espresso-800 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)] ring-[6px] ring-espresso-950 sm:block"
      >
        {slides.map((s, i) => (
          <LoupeLayer key={s.id} slide={s} index={i} pos={pos} />
        ))}
      </motion.div>

      {/* floating labels — the near one moves most */}
      <motion.div style={{ y: chipFarY, x: chipFarX }} className="absolute top-[12%] left-[4%] z-20">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={`${slide.id}-a`}
            custom={0}
            variants={chip}
            initial="enter"
            animate="center"
            exit="exit"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-espresso-900/80 px-4 py-2 text-[13px] text-latte"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-peach" />
            {slide.chips[0]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      {slide.chips[1] && (
        <motion.div
          style={{ y: chipNearY, x: chipNearX }}
          className="absolute right-0 bottom-[24%] z-30 hidden sm:block"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={`${slide.id}-b`}
              custom={1}
              variants={chip}
              initial="enter"
              animate="center"
              exit="exit"
              className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-[13px] font-semibold text-espresso-800 shadow-[0_16px_30px_-12px_rgba(0,0,0,0.7)]"
            >
              {slide.chips[1]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/**
 * One drink, placed purely by how far the slide position is from its own
 * index (`d`). Coming up (d < 0) it waits below and to the right, tipped
 * forward; once passed (d > 0) it lifts away up and to the left. The outgoing
 * drink is mostly gone by the midpoint while the incoming one is nearly there,
 * so the two cross instead of ghosting on top of each other.
 */
function DrinkLayer({ slide, index, pos }: { slide: HeroSlide; index: number; pos: MotionValue<number> }) {
  const d = useTransform(pos, (v) => v - index);
  const x = useTransform(d, (v) => `${v < 0 ? -v * 22 : -v * 16}%`);
  const y = useTransform(d, (v) => `${v < 0 ? -v * 42 : -v * 36}%`);
  const rotate = useTransform(d, (v) => (v < 0 ? -v * 18 : -v * 14));
  const scale = useTransform(d, (v) => (v < 0 ? 1 + v * 0.26 : 1 - v * 0.16));
  const opacity = useTransform(d, (v) => (v > 0 ? 1 - smoothstep(0.05, 0.6, v) : 1 - smoothstep(0.4, 0.95, -v)));
  const visibility = useTransform(d, (v) => (Math.abs(v) >= 0.999 ? "hidden" : "visible"));
  // a new cut-out's size isn't known until it loads — needed to put the steam on its rim
  const [measured, setMeasured] = useState<[number, number] | null>(null);
  const size = slide.imageSize ?? measured;

  const image = (
    <Image
      src={slide.image}
      alt={slide.alt}
      fill
      sizes={DRINK_SIZES}
      quality={85}
      // every drink is on stage from the start, so load them all up front
      loading="eager"
      fetchPriority={index === 0 ? "high" : "auto"}
      onLoad={(e) => {
        if (!slide.imageSize) setMeasured([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight]);
      }}
      className={
        slide.cutout ? "object-contain object-bottom drop-shadow-[0_26px_28px_rgba(0,0,0,0.55)]" : "object-cover"
      }
    />
  );

  return (
    <motion.div style={{ x, y, rotate, scale, opacity, visibility }} className="absolute inset-0 will-change-transform">
      <div className="absolute inset-0 animate-levitate">
        <div className="absolute inset-0 origin-bottom" style={{ transform: `scale(${slide.scale})` }}>
          {slide.cutout ? (
            <>
              {slide.steam && size && <Steam at={onImage(size, slide.steam)} />}
              {image}
            </>
          ) : (
            // a regular photo (no cut-out yet): framed in an arch, like the window behind it
            <>
              {slide.steam && <Steam at={[50, 8]} />}
              <div className="absolute inset-x-[16%] top-[8%] bottom-0 overflow-hidden rounded-t-full rounded-b-[28px] shadow-[0_40px_60px_-28px_rgba(0,0,0,0.9)] ring-1 ring-white/15">
                {image}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-white/5" />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** The loupe's close-up of one drink, cross-faded by the same scroll position. */
function LoupeLayer({ slide, index, pos }: { slide: HeroSlide; index: number; pos: MotionValue<number> }) {
  const d = useTransform(pos, (v) => v - index);
  const opacity = useTransform(d, (v) => 1 - smoothstep(0.15, 0.55, Math.abs(v)));
  const scale = useTransform(d, (v) => 1 + Math.abs(v) * 0.3);
  const rotate = useTransform(d, (v) => v * -14);

  return (
    <motion.div style={{ opacity, scale, rotate }} className="absolute inset-0">
      <Image
        src={slide.image}
        alt=""
        fill
        sizes="200px"
        quality={85}
        className="object-cover"
        style={loupe(slide.focus)}
      />
    </motion.div>
  );
}

function Bean({
  bean,
  pos,
  ice,
  progress,
  px,
  py,
}: {
  bean: (typeof BEANS)[number];
  pos: MotionValue<number>;
  /** 0 = coffee bean, 1 = ice cube — blended by scroll between hot and iced drinks. */
  ice: MotionValue<number>;
  progress: MotionValue<number>;
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const { d } = bean;
  const id = useId();
  const x = useTransform(px, (v) => v * 64 * d);
  const y = useTransform([progress, py], ([p, v]: number[]) => (0.5 - p) * 560 * d + v * 34 * d);
  // tumbles as you scroll between drinks
  const rotate = useTransform(pos, (v) => bean.r + v * 70);
  const beanOpacity = useTransform(ice, (v) => 1 - v);
  const beanScale = useTransform(ice, (v) => 1 - v * 0.4);
  const cubeScale = useTransform(ice, (v) => 0.6 + v * 0.4);

  return (
    <motion.div
      aria-hidden
      style={{
        left: `${bean.x}%`,
        top: `${bean.y}%`,
        x,
        y,
        width: bean.size,
        height: bean.size,
      }}
      className={cn(
        "pointer-events-none absolute",
        d >= 0.6 ? "z-10 blur-[2px]" : d < 0.3 ? "opacity-45 blur-[1px]" : "opacity-80",
      )}
    >
      <motion.div style={{ rotate }} className="h-full w-full">
        <div className="relative h-full w-full animate-float" style={{ animationDelay: `${bean.delay}s` }}>
          {/* coffee bean */}
          <motion.svg
            viewBox="0 0 40 52"
            style={{ opacity: beanOpacity, scale: beanScale }}
            className="absolute inset-0 h-full w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)]"
          >
            <defs>
              <radialGradient id={`${id}-bean`} cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="#8a4f2c" />
                <stop offset="0.55" stopColor="#5a2f17" />
                <stop offset="1" stopColor="#2a140a" />
              </radialGradient>
            </defs>
            <ellipse cx="20" cy="26" rx="17" ry="23" fill={`url(#${id}-bean)`} />
            <path d="M20 5c-7 11 7 20 0 42" fill="none" stroke="#1c0c05" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="13" cy="16" rx="4" ry="7" fill="#ffffff" opacity="0.12" />
          </motion.svg>
          {/* ice cube */}
          <motion.svg
            viewBox="0 0 48 48"
            style={{ opacity: ice, scale: cubeScale }}
            className="absolute inset-0 h-full w-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]"
          >
            <defs>
              <linearGradient id={`${id}-ice`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="0.5" stopColor="#dcebf2" stopOpacity="0.35" />
                <stop offset="1" stopColor="#a9c4d2" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <rect
              x="5"
              y="5"
              width="38"
              height="38"
              rx="9"
              fill={`url(#${id}-ice)`}
              stroke="#ffffff"
              strokeOpacity="0.6"
              strokeWidth="1.5"
            />
            <rect
              x="12"
              y="12"
              width="24"
              height="24"
              rx="5"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />
            <path
              d="M11 17c1-4 3-6 7-7"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Three wisps rising off the cup, staggered so there's always one in the air. */
function Steam({ at: [left, top] }: { at: [number, number] }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute h-[22%] w-[26%] -translate-x-1/2 -translate-y-full"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {[-30, 0, 30].map((offset, i) => (
        <svg
          key={offset}
          viewBox="0 0 20 80"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full w-[26%] animate-steam blur-[1.5px]"
          style={{ left: `${37 + offset}%`, animationDelay: `${i * -1.2}s` }}
        >
          <path
            d="M10 78C2 64 18 54 10 40S2 16 10 2"
            fill="none"
            stroke="rgba(255,244,232,0.45)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
}
