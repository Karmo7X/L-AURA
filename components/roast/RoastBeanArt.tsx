"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import type { CSSProperties } from "react";

// [left %, top %, size px, rotation deg, depth, float seconds, delay]
type Placed = [number, number, number, number, number, number, number];

const BEANS: Placed[] = [
  [6, 22, 96, -18, 1, 11, 0],
  [17, 64, 64, 34, 0.7, 13, 2],
  [30, 12, 52, 62, 0.5, 12, 4],
  [8, 84, 44, -42, 0.4, 14, 1],
  [40, 46, 38, 18, 0.3, 15, 3],
  [25, 34, 30, -70, 0.25, 16, 5],
];

/**
 * Drawn beans rather than rendered ones — they hold their shape and colour at
 * any size, and the fill follows the roast dial.
 */
function Bean({
  placed,
  color,
  shadow,
  px,
  py,
}: {
  placed: Placed;
  color: string;
  shadow: string;
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const [left, top, size, rotation, depth, duration, delay] = placed;
  const x = useTransform(px, (v) => v * depth * 26);
  const y = useTransform(py, (v) => v * depth * 16);

  return (
    <motion.div
      style={{ left: `${left}%`, top: `${top}%`, x, y, filter: depth < 0.45 ? `blur(${(0.5 - depth) * 6}px)` : undefined }}
      className="absolute"
    >
      <div
        className="animate-float"
        style={{ "--r": `${rotation}deg`, animationDuration: `${duration}s`, animationDelay: `-${delay}s` } as CSSProperties}
      >
        <svg width={size} height={size * 1.36} viewBox="0 0 40 54" aria-hidden>
          <ellipse cx="20" cy="27" rx="17.5" ry="25" fill={color} />
          <ellipse cx="20" cy="27" rx="17.5" ry="25" fill="url(#bean-shade)" />
          <path d="M21 6c-6.5 9 5.5 19-1 42" stroke={shadow} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <ellipse cx="12.5" cy="16" rx="4" ry="8" fill="#fff" opacity="0.16" transform="rotate(-16 12.5 16)" />
        </svg>
      </div>
    </motion.div>
  );
}

export function RoastBeanArt({ color, shadow }: { color: string; shadow: string }) {
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
          <radialGradient id="bean-shade" cx="0.32" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>
      </svg>
      {BEANS.map((placed) => (
        <Bean key={`${placed[0]}-${placed[1]}`} placed={placed} color={color} shadow={shadow} px={px} py={py} />
      ))}
    </div>
  );
}
