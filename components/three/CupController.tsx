"use client";
"use no memo";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { INGREDIENTS } from "@/lib/data";
import { useCafe } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/hooks";
import {
  CUP,
  clamp01,
  cup,
  damp,
  easeInOutSine,
  easeInQuad,
  easeOutCubic,
  innerRadiusAt,
  lerp,
  levelToY,
  smoothstep,
} from "./runtime";

// Hero pour timeline (seconds after the pour starts)
const STREAM_REACHES_CUP = 0.45;
const FILL_START = 0.5;
const FILL_DURATION = 2.8;
const STREAM_END = 3.25;
const HEADLINE_AT = 3.3;

interface SidePour {
  start: number;
  milk: boolean;
}

/**
 * Drives the liquid simulation: the intro pour, fill level, crema, steam,
 * milk blending and short "top-up" pours when ingredients are added.
 * Runs before every other frame callback (priority −1).
 */
export function CupController() {
  const pourStart = useRef<number | null>(null);
  const introStart = useRef<number | null>(null);
  const pourKey = useRef(useCafe.getState().pourKey);
  const fill = useRef(0);
  const targetLevel = useRef(0.72);
  const sidePour = useRef<SidePour | null>(null);
  const reduced = useRef(prefersReducedMotion());

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const t = state.clock.elapsedTime;
    cup.time = t;
    const store = useCafe.getState();

    if (pourStart.current === null) {
      pourStart.current = reduced.current ? t - 20 : t + 0.5;
      introStart.current = reduced.current ? t - 20 : t;
    }
    if (store.pourKey !== pourKey.current) {
      pourKey.current = store.pourKey;
      pourStart.current = t + 0.75; // drain first, then pour again
      sidePour.current = null;
    }

    /* Ingredient toggles */
    const selected = store.selected;
    for (const { id } of INGREDIENTS) {
      const on = selected.includes(id);
      const previous = cup.toggles[id];
      if (!previous) {
        cup.toggles[id] = { active: on, at: -100 };
      } else if (previous.active !== on) {
        cup.toggles[id] = { active: on, at: t };
        if (on && (id === "milk" || id === "oat" || id === "shot") && !reduced.current) {
          sidePour.current = { start: t, milk: id !== "shot" };
        }
      }
    }
    const hasMilk = selected.includes("milk") || selected.includes("oat");
    const hasShot = selected.includes("shot");

    /* Fill level */
    const pt = t - pourStart.current;
    targetLevel.current = damp(targetLevel.current, 0.72 + (hasMilk ? 0.1 : 0) + (hasShot ? 0.04 : 0), 2, dt);
    if (pt < 0) {
      fill.current = damp(fill.current, 0, 7, dt);
    } else {
      fill.current = easeInOutSine(clamp01((pt - FILL_START) / FILL_DURATION));
    }
    cup.level = fill.current * targetLevel.current;
    cup.surfaceY = levelToY(cup.level);
    cup.surfaceR = innerRadiusAt(cup.surfaceY) - 0.014;

    /* Stream */
    const top = CUP.streamTop;
    const surface = cup.surfaceY;
    let streamWidth = 0;
    let streamTop = top;
    let streamBottom = top;
    let streamMilk = 0;

    if (pt >= 0 && pt < STREAM_END + 0.5) {
      streamBottom = lerp(top, surface, easeInQuad(clamp01(pt / STREAM_REACHES_CUP)));
      streamTop = lerp(top, surface, easeInQuad(clamp01((pt - STREAM_END) / 0.45)));
      streamWidth = 0.075 * smoothstep(0, 0.12, pt) * (1 - smoothstep(STREAM_END - 0.1, STREAM_END + 0.4, pt) * 0.45);
    }

    const side = sidePour.current;
    let milkDelay = false;
    if (side && streamWidth === 0) {
      const sp = t - side.start;
      if (sp > 1.45) {
        sidePour.current = null;
      } else {
        streamBottom = lerp(top, surface, easeInQuad(clamp01(sp / 0.4)));
        streamTop = lerp(top, surface, easeInQuad(clamp01((sp - 0.95) / 0.45)));
        streamWidth = (side.milk ? 0.065 : 0.05) * smoothstep(0, 0.1, sp);
        streamMilk = side.milk ? 1 : 0;
        milkDelay = side.milk && sp < 0.42;
      }
    }
    cup.stream.top = streamTop;
    cup.stream.bottom = streamBottom;
    cup.stream.width = streamWidth;
    cup.stream.milk = streamMilk;

    const hitting = streamWidth > 0 && streamBottom <= surface + 0.02 && streamTop > surface + 0.05;
    cup.ripple = damp(cup.ripple, hitting ? 1 : 0, hitting ? 6 : 1.1, dt);

    /* Colour & surface */
    cup.milk = damp(cup.milk, hasMilk && !milkDelay ? 1 : 0, hasMilk ? 1.3 : 2.4, dt);
    cup.oat = damp(cup.oat, selected.includes("oat") ? 1 : 0, 3, dt);
    cup.dark = damp(cup.dark, hasShot ? 1 : 0, 1.4, dt);
    cup.crema = pt < 0 ? damp(cup.crema, 0, 6, dt) : smoothstep(1.6, 4.4, pt);
    cup.steam = pt < 0 ? damp(cup.steam, 0, 5, dt) : smoothstep(3.3, 5.6, pt);
    cup.intro = easeOutCubic(clamp01((t - (introStart.current ?? t)) / 1));

    if (!store.heroFilled && pt > HEADLINE_AT) store.setHeroFilled(true);
  }, -1);

  return null;
}
