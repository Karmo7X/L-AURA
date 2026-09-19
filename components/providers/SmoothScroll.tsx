"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { addTick } from "@/lib/ticker";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

/** Smoothly scroll to a hash target (falls back to native scrolling). */
export function scrollToHash(hash: string) {
  const target = document.querySelector(hash);
  if (!target) return;
  if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.4 });
  else target.scrollIntoView({ behavior: "smooth" });
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({ autoRaf: false, anchors: { duration: 1.4 }, lerp: 0.09 });
    lenis = instance;
    const stop = addTick((time) => instance.raf(time), -100);

    return () => {
      stop();
      instance.destroy();
      lenis = null;
    };
  }, []);

  return children;
}
