// Slice the coffee-splash PNG into independent layers:
//   hero-splash.png  — the liquid
//   hero-cup.png     — the ceramic cup
//   hero-bean-N.png  — one file per flying bean (+ position metadata)
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
const OUT = process.argv[3];
await mkdir(OUT, { recursive: true });

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const N = W * H;

// ---------------------------------------------------------------- matte
let transparentPixels = 0;
for (let i = 0; i < N; i++) if (data[i * 4 + 3] < 250) transparentPixels++;
const hasAlpha = transparentPixels > N * 0.02;

const alpha = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i * 4];
  const g = data[i * 4 + 1];
  const b = data[i * 4 + 2];
  const a = data[i * 4 + 3];
  if (hasAlpha) {
    alpha[i] = a;
  } else {
    // White background: how far is this pixel from pure white?
    const dist = Math.max(255 - r, 255 - g, 255 - b);
    alpha[i] = dist <= 4 ? 0 : Math.min(255, Math.round(dist * 4));
  }
}
console.log(`source ${W}x${H} — ${hasAlpha ? "has alpha channel" : "white background keyed"}`);

// ------------------------------------------------- connected components
const label = new Int32Array(N).fill(-1);
const components = [];
const stack = new Int32Array(N);
for (let start = 0; start < N; start++) {
  if (alpha[start] < 40 || label[start] !== -1) continue;
  const id = components.length;
  let top = 0;
  stack[top++] = start;
  label[start] = id;
  let count = 0;
  let minX = W;
  let minY = H;
  let maxX = 0;
  let maxY = 0;
  while (top > 0) {
    const p = stack[--top];
    const x = p % W;
    const y = (p / W) | 0;
    count++;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (label[q] === -1 && alpha[q] >= 40) {
          label[q] = id;
          stack[top++] = q;
        }
      }
    }
  }
  components.push({ id, count, minX, minY, maxX, maxY });
}
components.sort((a, b) => b.count - a.count);
console.log(`${components.length} components; largest ${components[0].count}px`);

// -------------------------------------------------------- write helpers
/** 3×3 box blur so the cut between layers isn't jagged. */
function feather(mask) {
  const out = new Uint8Array(N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= W) continue;
          sum += mask[ny * W + nx];
          count++;
        }
      }
      out[y * W + x] = Math.round(sum / count);
    }
  }
  return out;
}

// The artwork's soft edges are pure white with partial alpha (it was cut out
// on a white background), which paints a pale halo on a dark page. The colour
// can't be recovered, so trim the transparent fringe away instead.
const CUT = 70;
for (let i = 0; i < N; i++) {
  alpha[i] = alpha[i] <= CUT ? 0 : Math.min(255, Math.round(((alpha[i] - CUT) * 255) / (255 - CUT)));
}
const deFringed = new Uint8Array(N * 3);
for (let i = 0; i < N; i++) {
  for (let c = 0; c < 3; c++) deFringed[i * 3 + c] = data[i * 4 + c];
}

async function writeLayer(name, mask, crop) {
  const soft = feather(mask);
  const rgba = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const a = Math.min(soft[i], alpha[i]);
    rgba[i * 4] = deFringed[i * 3];
    rgba[i * 4 + 1] = deFringed[i * 3 + 1];
    rgba[i * 4 + 2] = deFringed[i * 3 + 2];
    rgba[i * 4 + 3] = a;
  }
  let image = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
  if (crop) image = image.extract(crop);
  await image.png({ compressionLevel: 9 }).toFile(path.join(OUT, name));
}

// ------------------------------------- split the big blob: cup vs liquid
const main = components[0];
const cupMask = new Uint8Array(N);
const splashMask = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  if (label[i] !== main.id) continue;
  const r = data[i * 4];
  const g = data[i * 4 + 1];
  const b = data[i * 4 + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  // Coffee is warm and saturated; the ceramic cup is bright and neutral.
  const isLiquid = sat > 0.16 && r >= g && g >= b;
  if (isLiquid) splashMask[i] = alpha[i];
  else cupMask[i] = alpha[i];
}

await writeLayer("hero-splash.png", splashMask);
await writeLayer("hero-cup.png", cupMask);

// --------------------------------------------------------- flying beans
const beans = [];
for (const comp of components.slice(1)) {
  if (comp.count < 120) continue; // specks
  const pad = 6;
  const minX = Math.max(0, comp.minX - pad);
  const minY = Math.max(0, comp.minY - pad);
  const width = Math.min(W - minX, comp.maxX - comp.minX + 1 + pad * 2);
  const height = Math.min(H - minY, comp.maxY - comp.minY + 1 + pad * 2);
  const mask = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (label[i] === comp.id) mask[i] = alpha[i];
  const name = `hero-bean-${beans.length + 1}.png`;
  await writeLayer(name, mask, { left: minX, top: minY, width, height });
  beans.push({
    src: `/hero/${name}`,
    // position + size as % of the artwork, so the layers stay registered
    left: +((minX / W) * 100).toFixed(3),
    top: +((minY / H) * 100).toFixed(3),
    width: +((width / W) * 100).toFixed(3),
    height: +((height / H) * 100).toFixed(3),
    size: comp.count,
  });
}
beans.sort((a, b) => b.size - a.size);

await writeFile(
  path.join(OUT, "layers.json"),
  JSON.stringify({ width: W, height: H, beans }, null, 2),
);
console.log(`wrote ${beans.length} bean layers`);
