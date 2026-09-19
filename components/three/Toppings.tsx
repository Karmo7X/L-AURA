"use client";
"use no memo";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCafe } from "@/lib/store";
import type { IngredientId } from "@/lib/data";
import {
  CREAM,
  clamp01,
  creamHeightAt,
  cup,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  mulberry32,
  smoothstep,
  toggleProgress,
} from "./runtime";

/** Everything that floats on the coffee rides this group (follows level + slosh). */
export function Toppings() {
  const group = useRef<THREE.Group>(null!);

  useFrame(() => {
    const g = group.current;
    g.visible = cup.level > 0.08;
    g.position.y = cup.surfaceY;
    g.rotation.z = Math.atan(cup.slosh.x);
    g.rotation.x = -Math.atan(cup.slosh.z);
  });

  return (
    <group ref={group}>
      <WhippedCream />
      <Drizzle id="caramel" color="#c47a2e" radius={0.03} phase={0} />
      <Drizzle id="chocolate" color="#3a1d10" radius={0.024} phase={Math.PI} crosswise />
      <Cinnamon />
      <ChocolateShavings />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Whipped cream — piped swirl that springs in                         */
/* ------------------------------------------------------------------ */
function createCreamGeometry() {
  const rings = 84;
  const segs = 128;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i++) {
    const v = i / rings;
    const base = CREAM.radius * Math.pow(1 - v, 0.75);
    const tier = 1 + 0.085 * Math.sin(v * Math.PI * 6) * (1 - v);
    const curl = smoothstep(0.78, 1, v) * 0.1;
    for (let j = 0; j <= segs; j++) {
      const theta = (j / segs) * Math.PI * 2;
      const ridge = 1 + 0.1 * Math.cos(8 * theta + v * 9) * (1 - v * 0.5);
      const r = base * ridge * tier;
      positions.push(Math.cos(theta) * r + curl, v * CREAM.height, Math.sin(theta) * r);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Stitch the seam so the lighting doesn't show a hard line.
  const normals = geometry.attributes.normal as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  for (let i = 0; i <= rings; i++) {
    const a = i * (segs + 1);
    const b = a + segs;
    n.set(normals.getX(a) + normals.getX(b), normals.getY(a) + normals.getY(b), normals.getZ(a) + normals.getZ(b)).normalize();
    normals.setXYZ(a, n.x, n.y, n.z);
    normals.setXYZ(b, n.x, n.y, n.z);
  }
  return geometry;
}

function WhippedCream() {
  const mesh = useRef<THREE.Mesh>(null!);
  const { geometry, material } = useMemo(
    () => ({
      geometry: createCreamGeometry(),
      material: new THREE.MeshPhysicalMaterial({
        color: "#fbf4ea",
        roughness: 0.6,
        sheen: 1,
        sheenColor: new THREE.Color("#ffffff"),
        sheenRoughness: 0.45,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
      }),
    }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const { active, elapsed } = toggleProgress("cream", 1, 1);
    let scale = 0;
    let drop = 0;
    if (cup.toggles.cream) {
      if (active) {
        const k = clamp01(elapsed / 0.8);
        scale = easeOutBack(k, 2.1);
        drop = (1 - easeOutCubic(clamp01(elapsed / 0.45))) * 1.1;
      } else {
        scale = 1 - easeInCubic(clamp01(elapsed / 0.3));
      }
    }
    cup.creamScale = clamp01(scale);
    const m = mesh.current;
    m.visible = scale > 0.001;
    const squash = active ? 1 + (1 - clamp01(elapsed / 0.6)) * 0.25 : 1;
    m.scale.set(scale / Math.sqrt(squash), scale * squash, scale / Math.sqrt(squash));
    m.position.y = -0.035 + drop;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} />;
}

/* ------------------------------------------------------------------ */
/* Drizzles (caramel / chocolate)                                      */
/* ------------------------------------------------------------------ */
const RADIAL_SEGMENTS = 8;

function buildDrizzle(onCream: boolean, phase: number, crosswise: boolean, radius: number) {
  const points: THREE.Vector3[] = [];

  if (onCream) {
    const steps = 150;
    const turns = 3.1;
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const r = lerp(CREAM.radius * 1.02, 0.06, Math.pow(s, 0.8));
      const a = s * turns * Math.PI * 2 + phase;
      const y = creamHeightAt(r) + 0.04;
      points.push(new THREE.Vector3(Math.cos(a) * r * 1.09, y, Math.sin(a) * r * 1.09));
    }
  } else {
    const lines = 6;
    const reachR = 0.74;
    for (let i = 0; i <= lines; i++) {
      const u = lerp(-0.6, 0.6, i / lines) + Math.sin(phase) * 0.04;
      const reach = Math.sqrt(Math.max(reachR * reachR - u * u, 0)) * 0.92;
      const from = i % 2 === 0 ? -reach : reach;
      for (let k = 0; k <= 6; k++) {
        const w = lerp(from, -from, k / 6);
        const x = u + Math.sin(k * 1.7 + phase * 3 + i) * 0.018 + (k / 6) * 0.07;
        points.push(crosswise ? new THREE.Vector3(w, 0.02, x) : new THREE.Vector3(x, 0.02, w));
      }
    }
  }

  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
  return new THREE.TubeGeometry(curve, onCream ? 380 : 440, radius, RADIAL_SEGMENTS, false);
}

function Drizzle({
  id,
  color,
  radius,
  phase,
  crosswise = false,
}: {
  id: IngredientId;
  color: string;
  radius: number;
  phase: number;
  crosswise?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const onCream = useCafe((s) => s.selected.includes("cream"));
  const builtAt = useRef(-100);

  const geometry = useMemo(() => buildDrizzle(onCream, phase, crosswise, radius), [onCream, phase, crosswise, radius]);
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }),
    [color],
  );

  useEffect(() => {
    builtAt.current = cup.time;
    return () => geometry.dispose();
  }, [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const { value, active } = toggleProgress(id, 1.5, 0.35);
    let reveal = active ? easeInOutCubic(value) : value;
    // Re-draw after switching between the flat and the on-cream path.
    if (active && builtAt.current > 0) reveal = Math.min(reveal, easeInOutCubic(clamp01((cup.time - builtAt.current) / 1.1)));

    const total = geometry.index!.count;
    const count = Math.floor((total / (RADIAL_SEGMENTS * 6)) * reveal) * RADIAL_SEGMENTS * 6;
    geometry.setDrawRange(0, count);

    const m = mesh.current;
    m.visible = count > 0;
    if (onCream) {
      const s = Math.max(cup.creamScale, 0.001);
      m.scale.set(s, s, s);
    } else {
      m.scale.set(1, 1, 1);
    }
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Falling particles (cinnamon dust / chocolate shavings)               */
/* ------------------------------------------------------------------ */
interface Bit {
  x: number;
  z: number;
  r: number;
  delay: number;
  height: number;
  drift: number;
  size: number;
  rx: number;
  ry: number;
  rz: number;
  spin: number;
}

function useBits(count: number, seed: number, sizeMin: number, sizeMax: number, spread = 0.78) {
  return useMemo<Bit[]>(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: count }, () => {
      const r = Math.sqrt(rnd()) * spread;
      const a = rnd() * Math.PI * 2;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        r,
        delay: rnd() * 0.7,
        height: 1.4 + rnd() * 1.6,
        drift: (rnd() - 0.5) * 0.6,
        size: lerp(sizeMin, sizeMax, rnd()),
        rx: rnd() * Math.PI * 2,
        ry: rnd() * Math.PI * 2,
        rz: rnd() * Math.PI * 2,
        spin: (rnd() - 0.5) * 16,
      };
    });
  }, [count, seed, sizeMin, sizeMax, spread]);
}

/** Height of the topping bed (flat coffee or the cream dome) at radius r. */
function bedHeight(r: number) {
  const s = cup.creamScale;
  if (s <= 0.001) return 0;
  return creamHeightAt(r / s) * s - 0.035;
}

function useFallingBits(
  mesh: RefObject<THREE.InstancedMesh>,
  id: IngredientId,
  bits: Bit[],
  apply: (dummy: THREE.Object3D, bit: Bit, fall: number, scale: number) => void,
) {
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const toggle = cup.toggles[id];
    const m = mesh.current;
    if (!toggle || (!toggle.active && cup.time - toggle.at > 0.4)) {
      m.visible = false;
      return;
    }
    m.visible = true;
    const elapsed = cup.time - toggle.at;
    const out = toggle.active ? 1 : 1 - clamp01(elapsed / 0.35);

    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      const bed = Math.max(bedHeight(bit.r), 0) + 0.012;
      let fall = 1;
      let y = bed;
      let x = bit.x;
      let started = true;
      if (toggle.active) {
        const local = elapsed - bit.delay;
        started = local > 0;
        fall = clamp01(local / 0.6);
        y = bed + (1 - fall * fall) * bit.height;
        x = bit.x + bit.drift * (1 - fall) * 0.4;
      }
      dummy.position.set(x, y, bit.z);
      apply(dummy, bit, fall, started ? bit.size * out : 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
}

function Cinnamon() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const bits = useBits(260, 7, 0.011, 0.026);
  const { geometry, material } = useMemo(
    () => ({
      geometry: new THREE.IcosahedronGeometry(1, 0),
      material: new THREE.MeshStandardMaterial({ roughness: 1, color: "#ffffff" }),
    }),
    [],
  );

  useEffect(() => {
    const rnd = mulberry32(11);
    const tones = ["#8a4722", "#a25a2c", "#6e3719", "#b86d3a"].map((c) => new THREE.Color(c));
    for (let i = 0; i < bits.length; i++) mesh.current.setColorAt(i, tones[Math.floor(rnd() * tones.length)]);
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [bits, geometry, material]);

  useFallingBits(mesh, "cinnamon", bits, (dummy, bit, _fall, scale) => {
    dummy.rotation.set(bit.rx, bit.ry, bit.rz);
    dummy.scale.set(scale, scale * 0.7, scale);
  });

  return <instancedMesh ref={mesh} args={[geometry, material, bits.length]} frustumCulled={false} />;
}

function ChocolateShavings() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const bits = useBits(38, 23, 0.05, 0.085, 0.7);
  const { geometry, material } = useMemo(
    () => ({
      // A partial open cylinder reads as a curled shaving.
      geometry: new THREE.CylinderGeometry(1, 1, 1, 10, 1, true, 0, Math.PI * 1.25),
      material: new THREE.MeshStandardMaterial({ color: "#3b1f12", roughness: 0.45, side: THREE.DoubleSide }),
    }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFallingBits(mesh, "chocolate", bits, (dummy, bit, fall, scale) => {
    const tumble = (1 - fall) * bit.spin;
    dummy.rotation.set(Math.PI / 2 + tumble * 0.6 + (bit.rx - Math.PI) * 0.08, bit.ry + tumble, tumble * 0.4);
    dummy.position.y += scale * 0.5;
    dummy.scale.set(scale * 0.45, scale * 1.4, scale * 0.45);
  });

  return <instancedMesh ref={mesh} args={[geometry, material, bits.length]} frustumCulled={false} />;
}
