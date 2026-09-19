"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element is within `margin` of the viewport. Used to mount the
 * WebGL scenes only when they're about to be seen, so an off-screen canvas
 * isn't burning frames.
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = "60% 0px") {
  // Without IntersectionObserver, just always render.
  const [near, setNear] = useState(() => typeof window !== "undefined" && typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measure once on mount: an observer's first callback can be delayed in a
    // throttled/background tab, and the scene shouldn't wait for it.
    const measure = window.setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const slack = window.innerHeight * 0.6;
      setNear(rect.top < window.innerHeight + slack && rect.bottom > -slack);
    }, 0);

    if (typeof IntersectionObserver === "undefined") return () => window.clearTimeout(measure);

    const observer = new IntersectionObserver((entries) => setNear(entries[0].isIntersecting), {
      rootMargin: margin,
    });
    observer.observe(el);
    return () => {
      window.clearTimeout(measure);
      observer.disconnect();
    };
  }, [ref, margin]);

  return near;
}
