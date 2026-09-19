export interface RoastStop {
  at: number;
  name: string;
  drop: string;
  time: string;
  notes: string[];
  acidity: number;
  body: number;
  sweetness: number;
  /** Bean colour at this point on the dial. */
  color: [number, number, number];
  /** Drawn-bean fill, its crease, and the section tone at this roast. */
  hex: string;
  ink: string;
  tone: string;
  copy: string;
}

/** Three points on the roast dial; everything between them is interpolated. */
export const ROASTS: RoastStop[] = [
  {
    at: 0,
    name: "Light",
    drop: "196°C",
    time: "9:20",
    notes: ["Jasmine", "Bergamot", "White peach"],
    acidity: 0.92,
    body: 0.34,
    sweetness: 0.52,
    color: [0.72, 0.42, 0.18],
    hex: "#b06a2c",
    ink: "#5d3213",
    tone: "#33200f",
    copy: "Dropped moments after first crack. Delicate, floral, and unforgiving of a sloppy pour.",
  },
  {
    at: 0.5,
    name: "Medium",
    drop: "208°C",
    time: "11:40",
    notes: ["Cocoa", "Plum", "Cane sugar"],
    acidity: 0.6,
    body: 0.66,
    sweetness: 0.82,
    color: [0.42, 0.21, 0.09],
    hex: "#7a3d16",
    ink: "#381c08",
    tone: "#24140b",
    copy: "Our house drop. Sugars caramelise, acidity rounds out, and the cup holds up to milk.",
  },
  {
    at: 1,
    name: "Dark",
    drop: "221°C",
    time: "13:05",
    notes: ["Dark chocolate", "Molasses", "Toasted walnut"],
    acidity: 0.28,
    body: 0.94,
    sweetness: 0.6,
    color: [0.19, 0.09, 0.04],
    hex: "#42200d",
    ink: "#1c0c04",
    tone: "#150c06",
    copy: "Taken into second crack. Heavy bodied and syrupy — the shot that cuts through anything.",
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function sampleRoast(value: number) {
  const v = Math.min(1, Math.max(0, value));
  const upper = ROASTS.findIndex((stop) => stop.at >= v);
  const high = ROASTS[upper === -1 ? ROASTS.length - 1 : upper];
  const low = ROASTS[Math.max(0, (upper === -1 ? ROASTS.length - 1 : upper) - 1)];
  const span = high.at - low.at || 1;
  const t = Math.min(1, Math.max(0, (v - low.at) / span));

  return {
    t,
    low,
    high,
    /** The stop whose label/notes are shown. */
    nearest: t < 0.5 ? low : high,
    acidity: lerp(low.acidity, high.acidity, t),
    body: lerp(low.body, high.body, t),
    sweetness: lerp(low.sweetness, high.sweetness, t),
    color: [
      lerp(low.color[0], high.color[0], t),
      lerp(low.color[1], high.color[1], t),
      lerp(low.color[2], high.color[2], t),
    ] as [number, number, number],
  };
}

/** Roast curve as an SVG path — hotter and longer as the dial moves right. */
export function roastCurve(value: number, width = 520, height = 200) {
  const v = Math.min(1, Math.max(0, value));
  const end = width * (0.68 + v * 0.3);
  const peak = height * (0.58 - v * 0.34);
  return [
    `M 0 ${height * 0.92}`,
    `C ${width * 0.1} ${height * 0.86}, ${width * 0.16} ${height * 0.5}, ${width * 0.34} ${height * 0.42}`,
    `S ${end * 0.72} ${peak + height * 0.12}, ${end} ${peak}`,
  ].join(" ");
}

/** Shared with the WebGL beans, which read it every frame. */
export const roastState = { value: 0.5, target: 0.5 };
