"use client";

import type { ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const DARK = [23, 14, 9]; // #170e09
const LIGHT = [247, 244, 238]; // #f7f4ee

/** Dark espresso → cream background, tied to scroll, behind hero + customizer. */
export function ScrollBackdrop({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(scrollY, (y) => {
    if (typeof window === "undefined") return "rgb(23,14,9)";
    const vh = window.innerHeight;
    const t = Math.min(1, Math.max(0, (y - vh * 0.4) / (vh * 0.55)));
    const e = t * t * (3 - 2 * t);
    const [r, g, b] = DARK.map((d, i) => Math.round(d + (LIGHT[i] - d) * e));
    return `rgb(${r},${g},${b})`;
  });

  return <motion.div style={{ backgroundColor }}>{children}</motion.div>;
}
