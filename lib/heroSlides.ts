import { categoryLabel, productImage, type ProductRow } from "./products";

/** One screen of the hero slider. */
export interface HeroSlide {
  /** product id — also what "Add to order" puts in the cart */
  id: string;
  name: string;
  kicker: string;
  copy: string;
  /** 1–5, or null to leave the dots out */
  strength: number | null;
  milk: string | null;
  size: string | null;
  price: number;
  /** Hot drinks steam and have beans in the air; iced ones get ice. */
  serve: "hot" | "iced";
  /** Section background while this slide is showing. */
  tone: string;
  /** Ambient light colour behind the drink. */
  glow: string;
  image: string;
  /** true for a transparent cut-out that floats; false for a photo, shown framed */
  cutout: boolean;
  /** Pixel size of `image` if known; otherwise it's measured when it loads. */
  imageSize: [number, number] | null;
  /** How big the drink stands in its box — an espresso cup is smaller than a frappé glass. */
  scale: number;
  alt: string;
  /** Short labels that float beside the drink; the second is optional. */
  chips: [string, string | null];
  /** Point the close-up loupe magnifies, as % of the image: [x, y]. */
  focus: [number, number];
  /** Where steam rises from, as % of the image: [x, y]. Hot drinks only. */
  steam?: [number, number];
}

/** Input/output ranges for a blend across slides — motion needs at least two stops. */
export function stopsFor<T>(values: T[]): [number[], T[]] {
  return values.length > 1 ? [values.map((_, i) => i), values] : [[0, 1], [values[0], values[0]]];
}

/** The columns the slider reads from public.products. */
export const HERO_COLUMNS =
  "id, name, price, description, origin, category, image_url, accent, hero_image_url, kicker, strength, milk, size";

export type HeroProductRow = Pick<
  ProductRow,
  | "id"
  | "name"
  | "price"
  | "description"
  | "origin"
  | "category"
  | "image_url"
  | "accent"
  | "hero_image_url"
  | "kicker"
  | "strength"
  | "milk"
  | "size"
>;

/**
 * Art direction for the cut-outs the site shipped with (public/drinks) —
 * measured by hand so the steam sits on the rim and the loupe on the crema.
 * Only used while a product still shows that exact image.
 */
const PRESETS: Record<string, Pick<HeroSlide, "image" | "imageSize" | "scale" | "focus" | "steam" | "tone" | "glow" | "alt" | "chips">> = {
  espresso: {
    image: "/drinks/espresso.png",
    imageSize: [662, 584],
    scale: 0.74,
    focus: [48, 20],
    steam: [48, 12],
    tone: "#170d08",
    glow: "#c86d51",
    alt: "An espresso in a clear glass cup on a glass saucer, a thick layer of crema on top.",
    chips: ["Huila · Colombia", "Pulled at 9 bar"],
  },
  latte: {
    image: "/drinks/latte.png",
    imageSize: [1100, 871],
    scale: 0.96,
    focus: [51, 22],
    steam: [50, 6],
    tone: "#241710",
    glow: "#e0b48a",
    alt: "A latte in a white cup with a rosetta poured into the foam, coffee beans resting on the saucer.",
    chips: ["Guji · Ethiopia", "Free-poured rosetta"],
  },
  frappe: {
    image: "/drinks/frappe.png",
    imageSize: [379, 717],
    scale: 1,
    focus: [54, 20],
    tone: "#22150b",
    glow: "#e0a35c",
    alt: "A caramel frappé in a tall glass, crowned with caramel popcorn and dripping caramel sauce, with a black straw.",
    chips: ["Salted caramel", "Popcorn crown"],
  },
  "iced-mocha": {
    image: "/drinks/iced-mocha.png",
    imageSize: [372, 636],
    scale: 0.96,
    focus: [49, 17],
    tone: "#1b0f09",
    glow: "#b5794d",
    alt: "An iced mocha in a clear cup, topped with whipped cream, chocolate crumble and a chocolate drizzle.",
    chips: ["72% chocolate", "Cocoa crumble"],
  },
};

/** A deep, dark version of the product's accent colour for the section background. */
function toneFrom(accent: string) {
  const hex = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#8a4526";
  const mix = (i: number, base: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.16 + base * 0.84);
  const [r, g, b] = [mix(1, 0x0f), mix(3, 0x08), mix(5, 0x05)];
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Turn a product the cafe put in the hero into a slide. */
export function heroSlideFromProduct(p: HeroProductRow): HeroSlide {
  const image = p.hero_image_url || productImage(p) || "/drinks/espresso.png";
  const cutout = Boolean(p.hero_image_url);
  const preset = PRESETS[p.id];
  const tuned = preset && preset.image === image ? preset : null;
  const hot = p.category !== "iced";
  const label = categoryLabel(p.category);

  return {
    id: p.id,
    name: p.name,
    kicker: p.kicker || p.origin || label,
    copy: p.description ?? "",
    strength: p.strength ?? null,
    milk: p.milk || null,
    size: p.size || null,
    price: Number(p.price),
    serve: hot ? "hot" : "iced",
    tone: preset?.tone ?? toneFrom(p.accent),
    glow: preset?.glow ?? p.accent,
    image,
    cutout,
    imageSize: tuned?.imageSize ?? null,
    scale: tuned?.scale ?? (cutout ? 0.92 : 0.9),
    alt: tuned?.alt ?? p.name,
    // never repeat the same words twice
    chips: preset?.chips ?? [p.origin || label, p.size || p.milk || (p.origin ? label : null)],
    // cut-outs usually have the cup's top near the top of the image; a framed
    // photo is cropped to fill, so its middle is the safest bet
    focus: tuned?.focus ?? (cutout ? [50, 16] : [50, 40]),
    steam: hot ? (tuned?.steam ?? [50, cutout ? 6 : 2]) : undefined,
  };
}

/** The slider as it shipped — used until the hero migration has been run. */
export const STARTER_HERO: HeroSlide[] = (
  [
    {
      id: "espresso",
      name: "Espresso",
      description: "A double shot pulled at nine bars. Dense tiger-striped crema, cocoa and dark plum.",
      price: 2.5,
      origin: "Huila · Colombia",
      category: "hot",
      accent: "#8a4526",
      kicker: "Pure · Intense",
      strength: 5,
      milk: "None",
      size: "2 oz",
    },
    {
      id: "latte",
      name: "Latte",
      description: "Velvet microfoam over a double shot, free-poured into a rosetta. Silky, mellow and quietly sweet.",
      price: 4,
      origin: "House Blend",
      category: "hot",
      accent: "#a9713c",
      kicker: "Silky · Mellow",
      strength: 3,
      milk: "Steamed",
      size: "8 oz",
    },
    {
      id: "frappe",
      name: "Frappé",
      description: "Espresso blended with milk and ice, crowned with caramel popcorn and a slow salted-caramel drip.",
      price: 5.5,
      origin: "Salted caramel",
      category: "iced",
      accent: "#c07a36",
      kicker: "Iced · Caramel",
      strength: 2,
      milk: "Whole",
      size: "16 oz",
    },
    {
      id: "iced-mocha",
      name: "Iced Mocha",
      description: "Espresso and dark chocolate over ice, finished with whipped cream and a cocoa crumble.",
      price: 5.25,
      origin: "72% chocolate",
      category: "iced",
      accent: "#6b3a22",
      kicker: "Iced · Chocolate",
      strength: 3,
      milk: "Cold",
      size: "16 oz",
    },
  ] as const
).map((p) =>
  heroSlideFromProduct({ ...p, image_url: null, hero_image_url: PRESETS[p.id].image } as HeroProductRow),
);
