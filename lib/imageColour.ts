/**
 * The colour a drink photo actually reads as.
 *
 * The hero lights its room from the drink standing in it: we sample the
 * photo in the browser, keep the pixels that carry colour (the cut-out's
 * empty space, the highlights and the shadows are all thrown away), and
 * return two shades of that hue — a near-black for the room and a brighter
 * one for the halo behind the glass.
 */
export interface Palette {
  tone: string;
  glow: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** r,g,b 0–255 → h 0–360, s 0–1, l 0–1 */
function toHsl(r: number, g: number, b: number) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = (max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4) * 60;
  return { h, s, l };
}

function hex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function paletteFrom(r: number, g: number, b: number): Palette {
  const { h, s } = toHsl(r, g, b);
  return {
    // the room: the drink's hue, taken down to near-black but still readable
    tone: hex(h, clamp(s * 0.9, 0.22, 0.55), 0.105),
    // the halo: the same hue with the life left in it
    glow: hex(h, clamp(s * 1.1, 0.35, 0.85), 0.55),
  };
}

/** Sample one image. Returns null if it can't be read (CORS, 404, no colour). */
export async function dominantColour(src: string): Promise<Palette | null> {
  if (typeof window === "undefined" || !src) return null;
  try {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;
    await img.decode();

    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0;
    let g = 0;
    let b = 0;
    let weight = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 160) continue; // transparent: the cut-out's empty space
      const [R, G, B] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(R, G, B);
      const min = Math.min(R, G, B);
      if (max < 24 || min > 236) continue; // the deepest shadows and the highlights
      const w = 1 + ((max - min) / 255) * 2; // colour counts for more than grey
      r += R * w;
      g += G * w;
      b += B * w;
      weight += w;
    }
    if (weight === 0) return null;
    return paletteFrom(r / weight, g / weight, b / weight);
  } catch {
    // a photo we're not allowed to read: the product's own accent still stands in
    return null;
  }
}
