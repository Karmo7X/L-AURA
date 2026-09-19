import type { IngredientId } from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Cup dimensions (model units)                                        */
/* ------------------------------------------------------------------ */
export const CUP = {
  glassBase: 0.12,
  // Thick, lens-like glass base, as on real heat-proof mugs.
  innerBottom: 0.44,
  rim: 2.36,
  innerRBottom: 0.82,
  innerRTop: 0.99,
  wall: 0.092,
  /** Pour stream starts this high above the saucer (well out of frame). */
  streamTop: 8,
  /** Bounds of saucer + mug + handle, used to fit the cup into DOM anchors. */
  boundsHeight: 2.45,
  boundsWidth: 3.7,
  centerY: 1.22,
};

export const CREAM = { radius: 0.84, height: 0.95 };

/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInQuad = (t: number) => t * t;
export const easeOutBack = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export function innerRadiusAt(y: number) {
  const t = clamp01((y - CUP.innerBottom) / (CUP.rim - CUP.innerBottom));
  return lerp(CUP.innerRBottom, CUP.innerRTop, t);
}

export function levelToY(level: number) {
  return CUP.innerBottom + level * (CUP.rim - CUP.innerBottom);
}

export function creamHeightAt(r: number) {
  const t = clamp01(r / CREAM.radius);
  return CREAM.height * (1 - Math.pow(t, 4 / 3));
}

/** Deterministic PRNG so particle layouts are stable between renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Shared per-frame runtime state                                      */
/* ------------------------------------------------------------------ */
// There is exactly one cup, and its animation state changes every frame.
// Keeping it in a plain mutable object (instead of React state) avoids
// re-rendering the scene 60 times per second.

interface Toggle {
  active: boolean;
  /** Clock time of the last change (−100 for the initial state → no animation). */
  at: number;
}

export const cup = {
  time: 0,

  /* Placement (written by CupRig) */
  progress: 0,
  rotY: 0,
  slosh: { x: 0, z: 0 },

  /* Liquid (written by CupController) */
  intro: 0,
  level: 0,
  surfaceY: CUP.innerBottom,
  surfaceR: CUP.innerRBottom,
  milk: 0,
  oat: 0,
  dark: 0,
  crema: 0,
  ripple: 0,
  steam: 0,
  creamScale: 0,
  stream: { top: CUP.streamTop, bottom: CUP.streamTop, width: 0, milk: 0 },

  toggles: {} as Partial<Record<IngredientId, Toggle>>,
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
};

/** 0→1 while an ingredient animates in, 1→0 while it animates out. */
export function toggleProgress(id: IngredientId, inDuration: number, outDuration: number) {
  const toggle = cup.toggles[id];
  if (!toggle) return { value: 0, active: false, elapsed: 0 };
  const elapsed = cup.time - toggle.at;
  return toggle.active
    ? { value: clamp01(elapsed / inDuration), active: true, elapsed }
    : { value: 1 - clamp01(elapsed / outDuration), active: false, elapsed };
}
