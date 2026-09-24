import { IMAGES } from "./data";

/** Hash links scroll the home page; "/order" opens the ordering screen. */
export const SHOP_NAV = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#coffee" },
  { label: "The Day", href: "#day-cadence" },
  { label: "The Space", href: "#sanctuary" },
  { label: "The Bar", href: "#barista-table" },
  { label: "Order", href: "/order" },
] as const;

/** Links that go to a page of their own rather than down the home page. */
export const isPageLink = (href: string) => !href.startsWith("#");

export interface Product {
  id: string;
  name: string;
  note: string;
  origin: string;
  price: number;
  image: string;
  accent: string;
}

/** The four cards that lean toward the pointer. */
export const PRODUCTS: Product[] = [
  {
    id: "espresso",
    name: "Espresso",
    note: "Dense, syrupy, cocoa-dark",
    origin: "Huila · Colombia",
    price: 2.5,
    image: IMAGES.espresso,
    accent: "#8a4526",
  },
  {
    id: "latte",
    name: "Latte",
    note: "Silk microfoam, soft sweetness",
    origin: "House Blend",
    price: 4,
    image: IMAGES.latte,
    accent: "#a9713c",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    note: "Steeped 24 hours, over cut ice",
    origin: "Guji · Ethiopia",
    price: 4.5,
    image: IMAGES.coldBrew,
    accent: "#5d3a22",
  },
  {
    id: "macchiato",
    name: "Caramel Macchiato",
    note: "Vanilla, milk, burnt-sugar drizzle",
    origin: "House Blend",
    price: 4.75,
    image: IMAGES.macchiato,
    accent: "#b9762f",
  },
];

/** The day on a dial — the iced latte turns through these as you scroll. */
export const HOURS = [
  {
    time: "07:00",
    label: "First Pour",
    drink: "Single Origin Espresso",
    copy: "Grinders on, cups warmed. The first shot of the day is pulled before the door unlocks.",
  },
  {
    time: "10:30",
    label: "Mid Morning",
    drink: "Flat White",
    copy: "Milk stretched to velvet. The room smells like caramel and wet stone.",
  },
  {
    time: "14:00",
    label: "Afternoon Lift",
    drink: "Iced Latte",
    copy: "Cold milk, two ristretto shots, one clear block of ice. The day turns.",
  },
  {
    time: "18:30",
    label: "Golden Hour",
    drink: "Cold Brew",
    copy: "Twenty-four hours of patience, poured slow while the light goes amber.",
  },
];
