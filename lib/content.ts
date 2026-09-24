/**
 * Everything on the home page that the cafe writes itself.
 *
 * Each block is one row of `public.site_content` (a JSON value under a key
 * like "home.day"). The site ships with the copy below and falls back to it
 * field by field, so a half-filled block — or an empty table — still renders
 * a complete page.
 */

export interface Cadence {
  id: string;
  hours: string;
  /** decimal hours in the shop's own time, e.g. 7.5 for 07:30 */
  from: number;
  to: number;
  glyph: string;
  title: string;
  copy: string;
  mood: string;
  quote: string;
  tags: string[];
}

export interface DayContent {
  eyebrow: string;
  title: string;
  italic: string;
  intro: string;
  cadences: Cadence[];
}

export interface SpaceZone {
  id: string;
  n: string;
  eyebrow: string;
  title: string;
  copy: string;
  meta: string;
  pin: string;
  /** where the marker sits on the photo, in % */
  x: number;
  y: number;
}

export interface SpaceContent {
  eyebrow: string;
  title: string;
  description: string;
  photo: string;
  captionKicker: string;
  captionTitle: string;
  zones: SpaceZone[];
  materials: { label: string; swatch: string }[];
}

export interface BarContent {
  eyebrow: string;
  title: string;
  description: string;
  photo: string;
  shift: string;
  pour: string;
  board: {
    origin: string;
    grade: string;
    accents: string;
    ambient: string;
    quote: string;
    barista: string;
    calibrated: string;
  };
}

export interface MenuContent {
  eyebrow: string;
  title: string;
  description: string;
}

export interface HomeContent {
  menu: MenuContent;
  day: DayContent;
  space: SpaceContent;
  bar: BarContent;
}

/** The keys these blocks live under in `site_content`. */
export const HOME_KEYS = {
  menu: "home.menu",
  day: "home.day",
  space: "home.space",
  bar: "home.bar",
} as const;

export type HomeSection = keyof typeof HOME_KEYS;

export const HOME_DEFAULTS: HomeContent = {
  menu: {
    eyebrow: "On the bar today",
    title: "",
    description: "Everything is pulled to order. Reach toward a card and it will lean your way.",
  },
  day: {
    eyebrow: "Rhythm of the roastery",
    title: "A Day at L’AURA",
    italic: "from first light to dusk",
    intro:
      "The room keeps three tempos. Come for the one you need — the quiet of the first pour, the hum of the long table, or the last amber hour with a record on.",
    cadences: [
      {
        id: "morning",
        hours: "07:30 — 11:00",
        from: 7.5,
        to: 11,
        glyph: "☀",
        title: "The First Pour & Morning Light",
        copy: "Dawn quiet, linen-filtered sunbeams, warm cardamom buns out of the oven, and the smell of the first extractions.",
        mood: "Serene & contemplative",
        quote:
          "The bar wakes up with hand-ground coffee blooming in paper filters. Sheer linen spreads the early light across the oak, and nobody is in a hurry.",
        tags: ["Filter Gesha", "Cardamom knot", "74°C steam"],
      },
      {
        id: "midday",
        hours: "11:00 — 15:00",
        from: 11,
        to: 15,
        glyph: "❦",
        title: "The Communal Table & Slow Work",
        copy: "Soft keyboards, easy talk across the long oak bench, iced matcha lattes and slow carafes of pour-over.",
        mood: "Creative focus & connection",
        quote:
          "The long table fills up: laptops at one end, a sketchbook at the other, and a carafe of pour-over passed along between them.",
        tags: ["Iced matcha", "Long oak bench", "1:16 pour-over"],
      },
      {
        id: "golden",
        hours: "15:00 — 18:00",
        from: 15,
        to: 19,
        glyph: "✦",
        title: "Golden Hour Flights & Vinyl",
        copy: "Amber light sliding down the plaster, comparative cupping flights, and Japanese jazz turning quietly behind the bar.",
        mood: "Ambient leisure & tasting",
        quote:
          "Late sun lands on the plaster wall, a flight of three micro-lots goes out on a wooden board, and the record gets turned over.",
        tags: ["Cupping flight", "Japanese jazz", "Amber light"],
      },
    ],
  },
  space: {
    eyebrow: "Architectural sanctuary",
    title: "The Space & Craft Environment",
    description:
      "Scandinavian calm with a wabi-sabi hand: lime-washed walls, acoustic timber, paper lanterns and one very tall window doing most of the work.",
    photo: "/space/room.webp",
    captionKicker: "Arts District · 742 Palmetto St",
    captionTitle: "Quiet textures, sacred natural daylight",
    zones: [
      {
        id: "bar",
        n: "01",
        eyebrow: "The guest interface",
        title: "The Brew Bar",
        copy: "Honed travertine over solid white-oak joinery, a matte black lever machine, and a row of ceramic drippers with their own water tower.",
        meta: "White oak & travertine",
        pin: "The Brew Bar",
        x: 62,
        y: 66,
      },
      {
        id: "nook",
        n: "02",
        eyebrow: "Meditative retreat",
        title: "The Sunlit Reading Nook",
        copy: "Sheer Belgian linen softens the north light. Low oak banquettes, paper lanterns and a shelf of borrowed books set an unhurried pace.",
        meta: "Northern diffused light",
        pin: "Sunlit banquette",
        x: 31,
        y: 60,
      },
      {
        id: "hearth",
        n: "03",
        eyebrow: "The sensory engine",
        title: "Fluid-Bed Roasting Hearth",
        copy: "An open 12 kg drum where green seed turns caramel and fragrant. Cuppings and origin classes happen right beside it, while it is still warm.",
        meta: "12 kg air roasting",
        pin: "12 kg roasting hearth",
        x: 72,
        y: 45,
      },
    ],
    materials: [
      { label: "Solid white oak", swatch: "#d7ba97" },
      { label: "Lime-washed plaster", swatch: "#e5dfd4" },
      { label: "Cast stoneware", swatch: "#8e7e74" },
      { label: "Raw Belgian linen", swatch: "#f3efe6" },
    ],
  },
  bar: {
    eyebrow: "Front bar & culture",
    title: "The Barista Table & Community Notes",
    description:
      "Step up to the oak counter: jasmine in the air, Gesha in the grinder, and whatever the barista chalked up this morning.",
    photo: "/space/bar-counter.webp",
    shift: "On shift: Sarah, head barista",
    pour: "Huila & Yirgacheffe on pour",
    board: {
      origin: "Ethiopia Yirgacheffe Gedeb",
      grade: "Grade 1",
      accents: "Jasmine · Blueberry · Bergamot",
      ambient: "93.2 °C water · 52% humidity",
      quote: "A floral extraction today, with honey underneath it. Hand-poured through the origami cone at 1:16.",
      barista: "Sarah, head barista · on shift until 15:00",
      calibrated: "Calibrated today · 07:15",
    },
  },
};

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** Stored fields win, but only when they actually carry something. */
function merge<T>(fallback: T, stored: unknown): T {
  if (!isObject(stored)) return fallback;
  const out = { ...(fallback as unknown as Json) };
  for (const [key, value] of Object.entries(stored)) {
    const base = out[key];
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out[key] = Array.isArray(base)
        ? value.map((item, i) => (isObject(item) && isObject(base[i]) ? merge(base[i], item) : item))
        : value;
    } else if (isObject(value) && isObject(base)) {
      out[key] = merge(base, value);
    } else if (typeof value === "string") {
      if (value.trim() !== "") out[key] = value;
    } else if (value !== null && value !== undefined) {
      out[key] = value;
    }
  }
  return out as unknown as T;
}

/** Turn the rows of `site_content` into a complete home page. */
export function mergeHome(rows: { key: string; value: unknown }[] | null | undefined): HomeContent {
  const by = new Map((rows ?? []).map((r) => [r.key, r.value]));
  return {
    menu: merge(HOME_DEFAULTS.menu, by.get(HOME_KEYS.menu)),
    day: merge(HOME_DEFAULTS.day, by.get(HOME_KEYS.day)),
    space: merge(HOME_DEFAULTS.space, by.get(HOME_KEYS.space)),
    bar: merge(HOME_DEFAULTS.bar, by.get(HOME_KEYS.bar)),
  };
}
