"use client";
"use no memo";

import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CUP, clamp01, cup, damp, easeInOutCubic, lerp, smoothstep } from "./runtime";

interface Anchors {
  hero: Element | null;
  showcase: Element | null;
  card: Element | null;
  grid: Element | null;
}

const find = (selector: string) => document.querySelector(selector);

/**
 * Places the cup on screen by tracking two DOM anchors:
 *   [data-cup-anchor="hero"]      — center stage in the hero
 *   [data-cup-anchor="showcase"]  — the pedestal in the customizer
 * Between them the cup follows a curved path driven by scroll progress.
 * Lenis already smooths the scroll, so positions are not damped here —
 * that keeps the cup glued to the (sticky) showcase card.
 */
export function CupRig({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const anchors = useRef<Anchors>({ hero: null, showcase: null, card: null, grid: null });
  const sim = useRef({ init: false, x: 0, y: 0, vx: 0, vy: 0, sx: 0, sz: 0, svx: 0, svz: 0, opacity: -1 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cup.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      cup.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const a = anchors.current;
    if (!a.hero?.isConnected) a.hero = find('[data-cup-anchor="hero"]');
    if (!a.showcase?.isConnected) a.showcase = find('[data-cup-anchor="showcase"]');
    if (!a.card?.isConnected) a.card = find("[data-cup-card]");
    if (!a.grid?.isConnected) a.grid = find("[data-cup-grid]");
    if (!a.hero || !a.showcase || !a.card || !a.grid) {
      root.current.visible = false;
      return;
    }

    const { width: vw, height: vh } = state.size;
    const camera = state.camera as THREE.PerspectiveCamera;
    const worldPerPx = (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / vh;
    const scrollY = window.scrollY;

    const hr = a.hero.getBoundingClientRect();
    const sr = a.showcase.getBoundingClientRect();
    const cr = a.card.getBoundingClientRect();
    const gr = a.grid.getBoundingClientRect();

    // Scroll distance at which the showcase anchor (ignoring sticky) is centered.
    const showcaseDocCenter = gr.top + scrollY + (sr.top - cr.top) + sr.height / 2;
    const end = Math.max(1, showcaseDocCenter - vh * 0.5);
    const raw = clamp01(scrollY / end);
    const eased = easeInOutCubic(raw);
    const mobile = vw < 768;

    const fit = (r: DOMRect) => Math.min(r.height / CUP.boundsHeight, r.width / CUP.boundsWidth);
    const heroX = hr.left + hr.width / 2;
    const showX = sr.left + sr.width / 2;
    const showY = sr.top + sr.height / 2;

    let x: number;
    let y: number;
    let pxPerUnit: number;
    let opacity = 1;
    let progress: number;

    if (!mobile) {
      // Quadratic Bézier from the hero spot (as seen at scroll 0) to the
      // viewport-centered showcase spot, dipping downward like a camera pan.
      const heroY0 = hr.top + scrollY + hr.height / 2;
      const endY = vh * 0.5;
      const cx = lerp(heroX, showX, 0.55);
      const cy = Math.max(heroY0, endY) + vh * 0.3;
      const u = 1 - eased;
      const bx = u * u * heroX + 2 * u * eased * cx + eased * eased * showX;
      const by = u * u * heroY0 + 2 * u * eased * cy + eased * eased * endY;
      const settle = smoothstep(0.8, 1, raw);
      x = lerp(bx, showX, settle);
      y = lerp(by, showY, settle);
      pxPerUnit = lerp(fit(hr), fit(sr), eased);
      progress = eased;
    } else {
      // Mobile: simple fade/slide between the two anchors.
      if (raw < 0.5) {
        const out = smoothstep(0.08, 0.4, raw);
        x = heroX;
        y = hr.top + hr.height / 2 - out * 40;
        pxPerUnit = fit(hr);
        opacity = 1 - out;
        progress = 0;
      } else {
        const inn = smoothstep(0.62, 0.96, raw);
        x = showX;
        y = showY + (1 - inn) * 56;
        pxPerUnit = fit(sr);
        opacity = inn;
        progress = 1;
      }
    }

    cup.progress = progress;
    opacity *= cup.intro;

    // Off-screen → skip drawing.
    const halfSize = pxPerUnit * CUP.boundsHeight;
    root.current.visible = opacity > 0.01 && y > -halfSize * 1.6 && y < vh + halfSize * 1.2;

    if (Math.abs(opacity - sim.current.opacity) > 0.004) {
      sim.current.opacity = opacity;
      state.gl.domElement.style.opacity = opacity.toFixed(3);
    }

    const scale = pxPerUnit * worldPerPx * lerp(0.9, 1, cup.intro);
    root.current.position.set((x - vw / 2) * worldPerPx, -(y - vh / 2) * worldPerPx + (1 - cup.intro) * -0.4, 0);
    root.current.scale.setScalar(scale);

    // Orientation: ¾ view tilt, gentle idle sway, pointer parallax, swing during travel.
    const p = cup.pointer;
    p.x = damp(p.x, p.tx, 3, dt);
    p.y = damp(p.y, p.ty, 3, dt);
    const heroWeight = 1 - progress;
    const swing = Math.sin(eased * Math.PI);
    const idle = Math.sin(cup.time * 0.4) * 0.12;
    cup.rotY = 0.55 + idle + swing * 0.75 + p.x * 0.25 * heroWeight - eased * 0.2;
    spin.current.rotation.y = cup.rotY;
    tilt.current.rotation.x = lerp(0.36, 0.3, progress) + p.y * 0.08 * heroWeight;
    tilt.current.rotation.z = mobile ? 0 : -swing * 0.14;

    // Liquid slosh: an under-damped spring pushed by screen velocity.
    const s = sim.current;
    if (!s.init) {
      s.init = true;
      s.x = x;
      s.y = y;
    }
    const vx = (x - s.x) / Math.max(dt, 1e-3);
    const vy = (y - s.y) / Math.max(dt, 1e-3);
    s.x = x;
    s.y = y;
    s.vx = damp(s.vx, vx, 10, dt);
    s.vy = damp(s.vy, vy, 10, dt);
    const worldTiltX = THREE.MathUtils.clamp(-s.vx * 0.00011, -0.13, 0.13);
    const worldTiltZ = THREE.MathUtils.clamp(s.vy * 0.00006, -0.08, 0.08);
    // Convert the world-space slope into the spinning cup's local space.
    const cos = Math.cos(cup.rotY);
    const sin = Math.sin(cup.rotY);
    const targetX = worldTiltX * cos - worldTiltZ * sin;
    const targetZ = worldTiltX * sin + worldTiltZ * cos;
    s.svx += ((targetX - s.sx) * 70 - s.svx * 5) * dt;
    s.svz += ((targetZ - s.sz) * 70 - s.svz * 5) * dt;
    s.sx += s.svx * dt;
    s.sz += s.svz * dt;
    cup.slosh.x = s.sx;
    cup.slosh.z = s.sz;
  }, -2);

  return (
    <group ref={root}>
      <group ref={tilt}>
        <group ref={spin}>
          <group position-y={-CUP.centerY}>{children}</group>
        </group>
      </group>
    </group>
  );
}
