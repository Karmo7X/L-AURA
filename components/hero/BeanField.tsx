"use client";

import { useEffect, type CSSProperties } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

// [left %, top %, size px, rotation deg, float duration s, delay s]
type Bean = [number, number, number, number, number, number];

// Three depth layers. Focus sits on the cup, so both the far background and
// the large foreground beans are blurred for a depth-of-field feel.
const LAYERS: { beans: Bean[]; blur: number; opacity: number; scroll: number; pointer: number }[] = [
  {
    blur: 3.5,
    opacity: 0.32,
    scroll: 0.06,
    pointer: 8,
    beans: [
      [9, 16, 20, -20, 9, 0],
      [21, 58, 15, 35, 11, 1.5],
      [33, 9, 13, 60, 10, 3],
      [70, 12, 17, -45, 12, 2],
      [87, 32, 19, 15, 9, 4],
      [78, 66, 15, -60, 13, 1],
      [56, 6, 12, 80, 10, 5],
      [40, 78, 13, 25, 12, 2.5],
      [4, 44, 14, -70, 11, 3.5],
    ],
  },
  {
    blur: 0.6,
    opacity: 0.7,
    scroll: 0.16,
    pointer: 18,
    beans: [
      [14, 34, 28, 25, 8, 0.5],
      [84, 48, 32, -30, 9, 2],
      [25, 80, 26, 70, 10, 1],
      [68, 84, 24, -15, 8.5, 3],
      [63, 22, 22, 40, 11, 4],
    ],
  },
  {
    blur: 7,
    opacity: 0.85,
    scroll: 0.32,
    pointer: 36,
    beans: [
      [3, 72, 58, -35, 7, 0],
      [93, 14, 50, 55, 8, 1.5],
      [95, 82, 44, 10, 9, 3],
    ],
  },
];

function Bean({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 56" width={size} height={size * 1.4} aria-hidden>
      <ellipse cx="20" cy="28" rx="17" ry="25" fill="url(#bean-shade)" />
      <path d="M21 5c-7 9 6 20-1 46" stroke="#1a0c06" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="17" rx="3.5" ry="7.5" fill="#fff" opacity="0.14" transform="rotate(-15 12 17)" />
    </svg>
  );
}

function Layer({
  layer,
  scrollY,
  px,
  py,
}: {
  layer: (typeof LAYERS)[number];
  scrollY: MotionValue<number>;
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const y = useTransform([scrollY, py], ([s, p]: number[]) => -s * layer.scroll + p * layer.pointer);
  const x = useTransform(px, (p) => p * layer.pointer);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, y, filter: layer.blur ? `blur(${layer.blur}px)` : undefined, opacity: layer.opacity }}
    >
      {layer.beans.map(([left, top, size, rotation, duration, delay]) => (
        <div
          key={`${left}-${top}`}
          className="absolute animate-float"
          style={
            {
              left: `${left}%`,
              top: `${top}%`,
              "--r": `${rotation}deg`,
              animationDuration: `${duration}s`,
              animationDelay: `-${delay}s`,
            } as CSSProperties
          }
        >
          <Bean size={size} />
        </div>
      ))}
    </motion.div>
  );
}

export function BeanField() {
  const { scrollY } = useScroll();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 40, damping: 18 });
  const py = useSpring(rawY, { stiffness: 40, damping: 18 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth) * 2 - 1);
      rawY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="bean-shade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#95593a" />
            <stop offset="0.55" stopColor="#4d2816" />
            <stop offset="1" stopColor="#23110a" />
          </linearGradient>
        </defs>
      </svg>
      {LAYERS.map((layer, i) => (
        <Layer key={i} layer={layer} scrollY={scrollY} px={px} py={py} />
      ))}
    </div>
  );
}
