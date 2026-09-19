"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { HOURS } from "@/lib/shop";
import { cn, EASE_SOFT } from "@/lib/cn";

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const round = (n: number) => Math.round(n * 100) / 100;

/** The glass, drawn in layers so the liquid and ice can move on their own. */
function IcedLatte({ tilt, swirl }: { tilt: number; swirl: number }) {
  return (
    <svg viewBox="0 0 220 300" className="h-full w-full" aria-hidden>
      <defs>
        <clipPath id="glass-inside">
          <path d="M64 74h92l-9 156a22 22 0 0 1-22 20h-30a22 22 0 0 1-22-20z" />
        </clipPath>
        <linearGradient id="milk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6ead8" />
          <stop offset="1" stopColor="#e2cbab" />
        </linearGradient>
        <linearGradient id="espresso" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b3417" />
          <stop offset="1" stopColor="#2a1208" />
        </linearGradient>
        <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      <g clipPath="url(#glass-inside)">
        {/* milk base */}
        <rect x="56" y="150" width="110" height="120" fill="url(#milk)" />
        {/* espresso poured over, tilting with scroll */}
        <g transform={`rotate(${tilt} 110 150)`}>
          <rect x="46" y="96" width="130" height="58" fill="url(#espresso)" />
          <ellipse cx="110" cy="96" rx="65" ry="9" fill="#8a4a26" opacity="0.9" />
        </g>
        {/* swirl where they meet */}
        <motion.path
          d="M60 150c18-10 30 8 48 0s32-12 52 0"
          stroke="#c89a6a"
          strokeWidth="7"
          fill="none"
          opacity="0.75"
          style={{ transform: `translateY(${swirl}px)` }}
        />
        {/* ice cubes */}
        <g opacity="0.85">
          <rect x="74" y="104" width="34" height="32" rx="7" fill="#ffffff" opacity="0.35" transform={`rotate(${12 + tilt} 91 120)`} />
          <rect x="112" y="128" width="30" height="28" rx="6" fill="#ffffff" opacity="0.3" transform={`rotate(${-18 + tilt} 127 142)`} />
          <rect x="88" y="160" width="32" height="30" rx="7" fill="#ffffff" opacity="0.24" transform={`rotate(${26 - tilt} 104 175)`} />
        </g>
      </g>

      {/* glass body */}
      <path
        d="M64 74h92l-9 156a22 22 0 0 1-22 20h-30a22 22 0 0 1-22-20z"
        fill="url(#glassSheen)"
        stroke="#f7f4ee"
        strokeOpacity="0.75"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="110" cy="74" rx="46" ry="9" fill="none" stroke="#f7f4ee" strokeOpacity="0.85" strokeWidth="3" />
      {/* straw */}
      <path d="M132 40l-14 34" stroke="#c86d51" strokeWidth="9" strokeLinecap="round" />
      <path d="M132 40l-14 34" stroke="#e08a67" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function ClockSection() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  // One full turn of the dial across the section.
  const dialAngle = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const handAngle = useTransform(scrollYProgress, [0, 1], [-8, 352]);
  const tilt = useTransform(scrollYProgress, [0, 1], [-9, 9]);
  const swirl = useTransform(scrollYProgress, [0, 1], [-6, 6]);
  const glassTurn = useTransform(scrollYProgress, [0, 1], [-14, 14]);

  const [tiltValue, setTiltValue] = useState(-9);
  const [swirlValue, setSwirlValue] = useState(-6);

  useEffect(() => {
    const stopTilt = tilt.on("change", setTiltValue);
    const stopSwirl = swirl.on("change", setSwirlValue);
    const stopProgress = scrollYProgress.on("change", (v) => {
      const index = Math.min(HOURS.length - 1, Math.max(0, Math.round(v * (HOURS.length - 1))));
      setActive(index);
    });
    return () => {
      stopTilt();
      stopSwirl();
      stopProgress();
    };
  }, [tilt, swirl, scrollYProgress]);

  const hour = HOURS[active];

  return (
    <section
      ref={section}
      id="hours"
      aria-labelledby="hours-title"
      className="relative h-[320vh] bg-espresso-900 text-linen"
    >
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,#331c12_0%,#1b100a_60%,#100804_100%)]" />
          <div className="absolute top-1/2 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/12 blur-[110px]" />
        </div>

        <div className="container-page relative grid w-full items-center gap-8 lg:grid-cols-12">
          <div className="order-2 text-center lg:order-1 lg:col-span-4 lg:text-left">
            <p className="label-caps text-peach">A day on the dial</p>
            <h2 id="hours-title" className="mt-3 font-serif text-[34px] leading-10 font-medium lg:text-[44px] lg:leading-[52px]">
              Every hour drinks
              <span className="block text-peach italic">differently</span>
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-latte/90">
              Scroll to turn the clock. The bar changes what it recommends as the light moves across the room.
            </p>
          </div>

          {/* the dial */}
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-4">
            <div className="relative aspect-square w-[min(78vw,420px)] lg:w-full">
              <motion.div style={{ rotate: dialAngle }} className="absolute inset-0">
                <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
                  <circle cx="200" cy="200" r="186" fill="none" stroke="#dfc0b3" strokeOpacity="0.18" strokeWidth="1.5" />
                  <circle cx="200" cy="200" r="150" fill="none" stroke="#dfc0b3" strokeOpacity="0.1" strokeWidth="1" />
                  {TICKS.map((i) => {
                    const major = i % 5 === 0;
                    const angle = (i / 60) * Math.PI * 2;
                    const outer = 186;
                    const inner = major ? 168 : 178;
                    return (
                      <line
                        key={i}
                        // rounded so server and client render identical markup
                        x1={round(200 + Math.sin(angle) * inner)}
                        y1={round(200 - Math.cos(angle) * inner)}
                        x2={round(200 + Math.sin(angle) * outer)}
                        y2={round(200 - Math.cos(angle) * outer)}
                        stroke={major ? "#fe997a" : "#dfc0b3"}
                        strokeOpacity={major ? 0.85 : 0.3}
                        strokeWidth={major ? 3 : 1.2}
                        strokeLinecap="round"
                      />
                    );
                  })}
                  {HOURS.map((entry, i) => {
                    const angle = (i / HOURS.length) * Math.PI * 2;
                    const r = 124;
                    return (
                      <text
                        key={entry.time}
                        x={round(200 + Math.sin(angle) * r)}
                        y={round(200 - Math.cos(angle) * r + 7)}
                        textAnchor="middle"
                        className="font-serif"
                        fill={i === active ? "#fe997a" : "#dfc0b3"}
                        fillOpacity={i === active ? 1 : 0.45}
                        fontSize="26"
                      >
                        {entry.time}
                      </text>
                    );
                  })}
                </svg>
              </motion.div>

              {/* sweeping hand */}
              <motion.div style={{ rotate: handAngle }} className="absolute inset-0">
                <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
                  <line x1="200" y1="210" x2="200" y2="52" stroke="#fe997a" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="200" cy="200" r="7" fill="#fe997a" />
                </svg>
              </motion.div>

              {/* the glass, turning with the dial */}
              <motion.div style={{ rotate: glassTurn }} className="absolute inset-[22%] drop-shadow-[0_20px_30px_rgba(10,5,2,0.6)]">
                <IcedLatte tilt={tiltValue} swirl={swirlValue} />
              </motion.div>
            </div>
          </div>

          {/* what's being poured */}
          <div className="order-3 lg:col-span-4">
            <div className="relative min-h-[190px] rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hour.time}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: EASE_SOFT }}
                >
                  <p className="label-caps text-peach">
                    {hour.time} · {hour.label}
                  </p>
                  <h3 className="mt-3 font-serif text-[30px] leading-9 text-linen">{hour.drink}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-latte/90">{hour.copy}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex gap-1.5" aria-hidden>
                {HOURS.map((entry, i) => (
                  <span
                    key={entry.time}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-500",
                      i === active ? "bg-peach" : "bg-white/15",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
