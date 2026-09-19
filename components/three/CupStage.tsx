"use client";

import dynamic from "next/dynamic";

// three.js needs `window`, so the canvas is client-only and code-split.
const CoffeeCanvas = dynamic(() => import("./CoffeeCanvas"), { ssr: false });

export function CupStage() {
  return <CoffeeCanvas />;
}
