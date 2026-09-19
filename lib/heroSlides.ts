export type DrinkKind = "espresso" | "latte" | "frappe" | "iced-mocha";

export interface HeroSlide {
  id: DrinkKind;
  name: string;
  kicker: string;
  copy: string;
  /** 1–5 */
  strength: number;
  milk: string;
  size: string;
  price: number;
  /** Hot drinks steam and have beans in the air; iced ones get ice. */
  serve: "hot" | "iced";
  /** Section background while this slide is showing. */
  tone: string;
  /** Ambient light colour behind the drink. */
  glow: string;
  /** Transparent cut-out of the drink (public/drinks). */
  image: string;
  /** Pixel size of `image`, so overlays can be placed on it. */
  imageSize: [number, number];
  /** How big the drink stands in its box — an espresso cup is smaller than a frappé glass. */
  scale: number;
  alt: string;
  /** Two short labels that float beside the drink. */
  chips: [string, string];
  /** Point the close-up loupe magnifies, as % of the image: [x, y]. */
  focus: [number, number];
  /** Where steam rises from, as % of the image: [x, y]. Hot drinks only. */
  steam?: [number, number];
}

/** The hero slides through these as you scroll. */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "espresso",
    name: "Espresso",
    kicker: "Pure · Intense",
    copy: "A double shot pulled at nine bars into warm glass. Dense tiger-striped crema, cocoa and dark plum.",
    strength: 5,
    milk: "None",
    size: "2 oz",
    price: 2.5,
    serve: "hot",
    tone: "#170d08",
    glow: "#c86d51",
    image: "/drinks/espresso.png",
    imageSize: [662, 584],
    scale: 0.74,
    alt: "An espresso in a clear glass cup on a glass saucer, a thick layer of crema on top.",
    chips: ["Huila · Colombia", "Pulled at 9 bar"],
    focus: [48, 20],
    steam: [48, 12],
  },
  {
    id: "latte",
    name: "Latte",
    kicker: "Silky · Mellow",
    copy: "Velvet microfoam over a double shot, free-poured into a rosetta. Silky, mellow and quietly sweet.",
    strength: 3,
    milk: "Steamed",
    size: "8 oz",
    price: 4,
    serve: "hot",
    tone: "#241710",
    glow: "#e0b48a",
    image: "/drinks/latte.png",
    imageSize: [1100, 871],
    scale: 0.96,
    alt: "A latte in a white cup with a rosetta poured into the foam, coffee beans resting on the saucer.",
    chips: ["Guji · Ethiopia", "Free-poured rosetta"],
    focus: [51, 22],
    steam: [50, 6],
  },
  {
    id: "frappe",
    name: "Frappé",
    kicker: "Iced · Caramel",
    copy: "Espresso blended with milk and ice, crowned with caramel popcorn and a slow salted-caramel drip.",
    strength: 2,
    milk: "Whole",
    size: "16 oz",
    price: 5.5,
    serve: "iced",
    tone: "#22150b",
    glow: "#e0a35c",
    image: "/drinks/frappe.png",
    imageSize: [379, 717],
    scale: 1,
    alt: "A caramel frappé in a tall glass, crowned with caramel popcorn and dripping caramel sauce, with a black straw.",
    chips: ["Salted caramel", "Popcorn crown"],
    focus: [54, 20],
  },
  {
    id: "iced-mocha",
    name: "Iced Mocha",
    kicker: "Iced · Chocolate",
    copy: "Espresso and dark chocolate over ice, finished with whipped cream and a cocoa crumble.",
    strength: 3,
    milk: "Cold",
    size: "16 oz",
    price: 5.25,
    serve: "iced",
    tone: "#1b0f09",
    glow: "#b5794d",
    image: "/drinks/iced-mocha.png",
    imageSize: [372, 636],
    scale: 0.96,
    alt: "An iced mocha in a clear cup, topped with whipped cream, chocolate crumble and a chocolate drizzle.",
    chips: ["72% chocolate", "Cocoa crumble"],
    focus: [49, 17],
  },
];
