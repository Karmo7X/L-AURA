"use client";
"use no memo";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { CUP, cup, innerRadiusAt, lerp } from "./runtime";
import {
  liquidFragment,
  liquidVertex,
  steamFragment,
  steamVertex,
  streamFragment,
  streamVertex,
  surfaceFragment,
  surfaceVertex,
} from "./shaders";

const color = (hex: string) => new THREE.Color(hex);

/* ------------------------------------------------------------------ */
/* Glass mug                                                           */
/* ------------------------------------------------------------------ */
function glassProfile() {
  const { glassBase: b, innerBottom, rim, wall, innerRTop } = CUP;
  const pts: [number, number][] = [
    [0, b],
    [0.7, b],
    [0.8, b + 0.012],
    [0.86, b + 0.05],
    [0.875, b + 0.12],
  ];
  for (let i = 0; i <= 10; i++) {
    const y = lerp(0.3, rim - 0.03, i / 10);
    pts.push([innerRadiusAt(y) + wall, y]);
  }
  pts.push(
    [innerRTop + wall * 0.8, rim - 0.004],
    [innerRTop + wall * 0.5, rim + 0.014],
    [innerRTop + wall * 0.18, rim - 0.004],
  );
  for (let i = 0; i <= 10; i++) {
    const y = lerp(rim - 0.03, innerBottom + 0.07, i / 10);
    pts.push([innerRadiusAt(y), y]);
  }
  pts.push([CUP.innerRBottom - 0.05, innerBottom + 0.012], [CUP.innerRBottom - 0.14, innerBottom], [0, innerBottom]);
  return pts.map(([x, y]) => new THREE.Vector2(x, y));
}

export function Glass() {
  const { body, handle, material } = useMemo(() => {
    const body = new THREE.LatheGeometry(glassProfile(), 160);
    const curve = new THREE.CatmullRomCurve3(
      [
        [0.95, 1.98],
        [1.36, 2.0],
        [1.64, 1.74],
        [1.68, 1.26],
        [1.46, 0.82],
        [0.9, 0.7],
      ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    );
    const handle = new THREE.TubeGeometry(curve, 96, 0.095, 24, false);

    // Real glass: light is refracted through the wall thickness rather than
    // faked with an alpha gradient. Dispersion adds the faint colour fringing
    // you see on thick glassware edges.
    const material = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0,
      roughness: 0.035,
      transmission: 1,
      thickness: 0.6,
      ior: 1.52,
      dispersion: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      attenuationColor: new THREE.Color("#dfeee6"),
      attenuationDistance: 3.5,
      specularIntensity: 1,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
    });

    return { body, handle, material };
  }, []);

  useEffect(
    () => () => {
      body.dispose();
      handle.dispose();
      material.dispose();
    },
    [body, handle, material],
  );

  return (
    <group>
      <mesh geometry={body} material={material} />
      <mesh geometry={handle} material={material} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Ceramic saucer                                                      */
/* ------------------------------------------------------------------ */
export function Saucer() {
  const { geometry, material, band, bandMaterial } = useMemo(() => {
    const profile = [
      [0, 0.03],
      [0.82, 0.03],
      [0.86, 0],
      [0.98, 0],
      [1.02, 0.03],
      [1.4, 0.07],
      [1.68, 0.13],
      [1.8, 0.19],
      [1.83, 0.215],
      [1.8, 0.23],
      [1.7, 0.205],
      [1.45, 0.155],
      [1.1, 0.128],
      [0.98, 0.12],
      [0.6, 0.12],
      [0, 0.12],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return {
      geometry: new THREE.LatheGeometry(profile, 128),
      // Glazed porcelain.
      material: new THREE.MeshPhysicalMaterial({
        color: "#f4efe6",
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.1,
      }),
      band: new THREE.TorusGeometry(1.815, 0.013, 10, 160),
      bandMaterial: new THREE.MeshPhysicalMaterial({ color: "#c86d51", roughness: 0.4, clearcoat: 0.8 }),
    };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      band.dispose();
      bandMaterial.dispose();
    },
    [geometry, material, band, bandMaterial],
  );

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={band} material={bandMaterial} rotation-x={Math.PI / 2} position-y={0.222} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Soft contact shadow + warm hero glow                                */
/* ------------------------------------------------------------------ */
function radialTexture(stops: [number, string][]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [offset, c] of stops) gradient.addColorStop(offset, c);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function GroundEffects() {
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null!);
  const { saucerShadow, cupShadow, glow } = useMemo(
    () => ({
      // Wide, soft shadow cast by the whole assembly onto the table.
      saucerShadow: radialTexture([
        [0, "rgba(0,0,0,0.5)"],
        [0.4, "rgba(0,0,0,0.26)"],
        [1, "rgba(0,0,0,0)"],
      ]),
      // Tighter, darker contact shadow where the mug meets the saucer.
      cupShadow: radialTexture([
        [0, "rgba(0,0,0,0.62)"],
        [0.5, "rgba(0,0,0,0.3)"],
        [1, "rgba(0,0,0,0)"],
      ]),
      glow: radialTexture([
        [0, "rgba(255,178,120,0.95)"],
        [0.3, "rgba(200,109,81,0.4)"],
        [1, "rgba(200,109,81,0)"],
      ]),
    }),
    [],
  );

  useEffect(
    () => () => {
      saucerShadow.dispose();
      cupShadow.dispose();
      glow.dispose();
    },
    [saucerShadow, cupShadow, glow],
  );

  useFrame(() => {
    glowMaterial.current.opacity = (1 - cup.progress) * 0.5;
  });

  return (
    <group>
      {/* Volumetric pool of light under the cup (hero only) */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.012} renderOrder={0}>
        <planeGeometry args={[8.5, 8.5]} />
        <meshBasicMaterial
          ref={glowMaterial}
          map={glow}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Saucer shadow layer */}
      <mesh rotation-x={-Math.PI / 2} position={[0.12, 0.002, 0.16]} renderOrder={1}>
        <planeGeometry args={[5.4, 5.4]} />
        <meshBasicMaterial map={saucerShadow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Cup shadow layer — sits on the saucer surface */}
      <mesh rotation-x={-Math.PI / 2} position={[0.1, CUP.glassBase + 0.004, 0.12]} renderOrder={2}>
        <planeGeometry args={[2.9, 2.9]} />
        <meshBasicMaterial map={cupShadow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}


/* ------------------------------------------------------------------ */
/* Coffee: body + surface                                              */
/* ------------------------------------------------------------------ */
const DAIRY = { latte: color("#d9b48d"), body: color("#c69a72") };
const OAT = { latte: color("#dcc19b"), body: color("#c9a983") };
const POUR_POINT = new THREE.Vector2(-0.22, 0.12);

export function Liquid() {
  const bodyMesh = useRef<THREE.Mesh>(null!);
  const surfaceMesh = useRef<THREE.Mesh>(null!);

  const { bodyGeometry, bodyMaterial, surfaceGeometry, surfaceMaterial } = useMemo(() => {
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 1, 72, 1, true);
    bodyGeometry.translate(0, 0.5, 0);
    const surfaceGeometry = new THREE.RingGeometry(0.0001, 1, 96, 28);
    surfaceGeometry.rotateX(-Math.PI / 2);

    const bodyMaterial = new THREE.ShaderMaterial({
      vertexShader: liquidVertex,
      fragmentShader: liquidFragment,
      uniforms: {
        uBottom: { value: CUP.innerBottom + 0.006 },
        uTop: { value: CUP.innerBottom },
        uGlassBottom: { value: CUP.innerBottom },
        uGlassTop: { value: CUP.rim },
        uRB: { value: CUP.innerRBottom },
        uRT: { value: CUP.innerRTop },
        uSlosh: { value: new THREE.Vector2() },
        uTime: { value: 0 },
        uMilk: { value: 0 },
        uDark: { value: 0 },
        uCrema: { value: 0 },
        uHeight: { value: 0 },
        uCoffee: { value: color("#1c0c05") },
        uCoffeeLight: { value: color("#6b3417") },
        uCremaBand: { value: color("#a9713c") },
        uMilkColor: { value: DAIRY.body.clone() },
        uFoam: { value: color("#f2e5d2") },
      },
    });

    const surfaceMaterial = new THREE.ShaderMaterial({
      vertexShader: surfaceVertex,
      fragmentShader: surfaceFragment,
      uniforms: {
        uTop: { value: CUP.innerBottom },
        uR: { value: CUP.innerRBottom },
        uSlosh: { value: new THREE.Vector2() },
        uTime: { value: 0 },
        uCrema: { value: 0 },
        uMilk: { value: 0 },
        uRipple: { value: 0 },
        uDark: { value: 0 },
        uArtAngle: { value: 0 },
        uPour: { value: POUR_POINT },
        uCoffee: { value: color("#2a1208") },
        uCremaA: { value: color("#6e3b1b") },
        uCremaB: { value: color("#c07e45") },
        uLatte: { value: DAIRY.latte.clone() },
        uLatteRim: { value: color("#9b6139") },
        uFoam: { value: color("#f8efe3") },
      },
    });

    return { bodyGeometry, bodyMaterial, surfaceGeometry, surfaceMaterial };
  }, []);

  useEffect(
    () => () => {
      bodyGeometry.dispose();
      bodyMaterial.dispose();
      surfaceGeometry.dispose();
      surfaceMaterial.dispose();
    },
    [bodyGeometry, bodyMaterial, surfaceGeometry, surfaceMaterial],
  );

  useFrame(() => {
    const visible = cup.level > 0.004;
    bodyMesh.current.visible = visible;
    surfaceMesh.current.visible = visible;
    if (!visible) return;

    const b = bodyMaterial.uniforms;
    b.uTop.value = cup.surfaceY;
    b.uHeight.value = cup.surfaceY - (CUP.innerBottom + 0.006);
    b.uSlosh.value.set(cup.slosh.x, cup.slosh.z);
    b.uTime.value = cup.time;
    b.uMilk.value = cup.milk;
    b.uDark.value = cup.dark;
    b.uCrema.value = cup.crema;
    b.uMilkColor.value.lerpColors(DAIRY.body, OAT.body, cup.oat);

    const s = surfaceMaterial.uniforms;
    s.uTop.value = cup.surfaceY;
    s.uR.value = cup.surfaceR;
    s.uSlosh.value.set(cup.slosh.x, cup.slosh.z);
    s.uTime.value = cup.time;
    s.uCrema.value = cup.crema;
    s.uMilk.value = cup.milk;
    s.uRipple.value = cup.ripple;
    s.uDark.value = cup.dark;
    s.uArtAngle.value = cup.rotY;
    s.uLatte.value.lerpColors(DAIRY.latte, OAT.latte, cup.oat);
  });

  return (
    <group>
      <mesh ref={bodyMesh} geometry={bodyGeometry} material={bodyMaterial} />
      <mesh ref={surfaceMesh} geometry={surfaceGeometry} material={surfaceMaterial} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Pour stream                                                         */
/* ------------------------------------------------------------------ */
const STREAM_COFFEE = color("#2b1207");
const STREAM_MILK = color("#efe2cf");

export function PourStream() {
  const mesh = useRef<THREE.Mesh>(null!);
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(1, 1, 1, 20, 64, true);
    geometry.translate(0, 0.5, 0);
    const material = new THREE.ShaderMaterial({
      vertexShader: streamVertex,
      fragmentShader: streamFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTop: { value: CUP.streamTop },
        uBottom: { value: CUP.streamTop },
        uWidth: { value: 0 },
        uTime: { value: 0 },
        uXZ: { value: new THREE.Vector2(POUR_POINT.x * 0.9, POUR_POINT.y * 0.9) },
        uColor: { value: STREAM_COFFEE.clone() },
        uHighlight: { value: color("#d98b52") },
      },
    });
    return { geometry, material };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const { top, bottom, width, milk } = cup.stream;
    const visible = width > 0.002 && top - bottom > 0.01;
    mesh.current.visible = visible;
    if (!visible) return;
    const u = material.uniforms;
    u.uTop.value = top;
    u.uBottom.value = bottom;
    u.uWidth.value = width;
    u.uTime.value = cup.time;
    u.uColor.value.lerpColors(STREAM_COFFEE, STREAM_MILK, milk);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={11} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Steam                                                               */
/* ------------------------------------------------------------------ */
const STEAM_PLUMES = [
  { x: -0.32, z: 0.05, w: 1.3, h: 2.9, seed: 1.3 },
  { x: 0.28, z: -0.1, w: 1.1, h: 2.5, seed: 4.7 },
  { x: 0.02, z: -0.25, w: 1.6, h: 3.4, seed: 8.1 },
];
const STEAM_DARK_BG = color("#fff8f0");
const STEAM_LIGHT_BG = color("#a8968a");

export function Steam() {
  const group = useRef<THREE.Group>(null!);
  const materials = useMemo(
    () =>
      STEAM_PLUMES.map(
        (plume) =>
          new THREE.ShaderMaterial({
            vertexShader: steamVertex,
            fragmentShader: steamFragment,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uSeed: { value: plume.seed },
              uColor: { value: STEAM_DARK_BG.clone() },
            },
          }),
      ),
    [],
  );

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  useFrame(() => {
    const opacity = cup.steam * lerp(1, 0.55, cup.progress);
    group.current.visible = opacity > 0.01;
    for (const m of materials) {
      m.uniforms.uTime.value = cup.time;
      m.uniforms.uOpacity.value = opacity;
      m.uniforms.uColor.value.lerpColors(STEAM_DARK_BG, STEAM_LIGHT_BG, cup.progress);
    }
  });

  return (
    <group ref={group} position-y={CUP.rim + 0.05}>
      {STEAM_PLUMES.map((plume, i) => (
        <Billboard key={plume.seed} position={[plume.x, plume.h / 2, plume.z]}>
          <mesh material={materials[i]} renderOrder={20}>
            <planeGeometry args={[plume.w, plume.h]} />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
