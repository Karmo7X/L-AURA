"use client";
"use no memo";

import { Component, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useCafe } from "@/lib/store";
import { addTick } from "@/lib/ticker";
import { CupController } from "./CupController";
import { CupRig } from "./CupRig";
import { GroundEffects, Glass, Liquid, PourStream, Saucer, Steam } from "./CupParts";
import { Toppings } from "./Toppings";

class WebGLBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Renders frames from the shared ticker, right after Lenis updates scroll. */
function FrameDriver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => addTick((time) => advance(time / 1000, true), 10), [advance]);
  return null;
}

/**
 * The cup, built as the layer stack from the design reference:
 * shadows → saucer → coffee liquid → foam/crema → toppings → pour →
 * glass → highlights → steam.
 */
function CoffeeCup() {
  return (
    <>
      <GroundEffects />
      <Saucer />
      <Liquid />
      <Toppings />
      <PourStream />
      <Glass />
      <Steam />
    </>
  );
}

export default function CoffeeCanvas() {
  const setWebgl = useCafe((s) => s.setWebgl);
  const [supported] = useState(hasWebGL);

  useEffect(() => {
    if (!supported) setWebgl("failed");
  }, [supported, setWebgl]);

  if (!supported) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20">
      <WebGLBoundary onError={() => setWebgl("failed")}>
        <Canvas
          frameloop="never"
          dpr={[1, 1.75]}
          camera={{ fov: 30, near: 1, far: 80, position: [0, 0, 20] }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          onCreated={(state) => {
            state.gl.toneMappingExposure = 1.05;
            // Refraction buffer at half res — plenty for a single glass object.
            state.gl.transmissionResolutionScale = 0.5;
            setWebgl("ready");
          }}
          style={{ pointerEvents: "none" }}
        >
          <FrameDriver />
          <ambientLight intensity={0.35} color="#ffe9d6" />
          <directionalLight position={[-5, 7, 8]} intensity={1.8} color="#fff3e6" />
          <directionalLight position={[6, 4, -6]} intensity={1.6} color="#ffb98a" />
          <directionalLight position={[0, -4, 6]} intensity={0.35} color="#c86d51" />
          {/* Studio softboxes — the bright/dark contrast in these reflections is
              what makes the refracting glass read as real. */}
          <Environment resolution={512} frames={1}>
            <Lightformer form="rect" intensity={5} color="#ffffff" position={[-7, 3, 6]} scale={[5, 12, 1]} />
            <Lightformer form="rect" intensity={3} color="#fff1e0" position={[8, 4, 2]} scale={[4, 10, 1]} />
            <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 10, 1]} rotation-x={Math.PI / 2} scale={[9, 9, 1]} />
            <Lightformer form="rect" intensity={1.6} color="#ffd9b8" position={[0, -7, 4]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} />
            <Lightformer form="rect" intensity={2} color="#c86d51" position={[0, 0, -10]} scale={[14, 8, 1]} />
          </Environment>
          <CupController />
          <CupRig>
            <CoffeeCup />
          </CupRig>
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}
