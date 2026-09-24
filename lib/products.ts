import { IMAGES } from "./data";
import { PRODUCTS } from "./shop";

/** A section of the menu. The cafe adds and renames these in /admin/menu-sections. */
export interface Category {
  id: string;
  label: string;
  sort_order?: number;
  active?: boolean;
}

/** The sections the site shipped with, used until the database has its own. */
export const STARTER_CATEGORIES: Category[] = [
  { id: "hot", label: "Hot drinks", sort_order: 10, active: true },
  { id: "iced", label: "Iced drinks", sort_order: 20, active: true },
  { id: "bakery", label: "Bakery", sort_order: 30, active: true },
  { id: "beans", label: "Beans", sort_order: 40, active: true },
];

/** Names a section, falling back to the id so nothing ever renders blank. */
export function categoryLabel(id: string, categories: Category[] = STARTER_CATEGORIES) {
  return categories.find((c) => c.id === id)?.label ?? id;
}

/** How a section id has to look: lowercase, no spaces. */
export const CATEGORY_ID = /^[a-z0-9-]{1,30}$/;

/** Turn a label into an id: "Cold brew flights" → "cold-brew-flights". */
export function categoryIdFrom(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/** A row of public.products, as Supabase returns it. */
export interface ProductRow {
  id: string;
  name: string;
  price: number;
  active: boolean;
  description: string | null;
  origin: string | null;
  /** the section it sits in — an id from public.categories */
  category: string;
  image_url: string | null;
  accent: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  /* hero slider (20260922000000_hero_products.sql) */
  in_hero: boolean;
  hero_image_url: string | null;
  kicker: string | null;
  strength: number | null;
  milk: string | null;
  size: string | null;
}

/** What the website needs to show and sell a product. */
export interface MenuProduct {
  id: string;
  name: string;
  note: string;
  origin: string;
  price: number;
  /** null when the cafe hasn't added a photo yet */
  image: string | null;
  accent: string;
  category: string;
  featured: boolean;
}

export const MENU_COLUMNS = "id, name, price, description, origin, category, image_url, accent, featured";

/** Photos for the starter products, which ship with the site rather than in storage. */
const STARTER_IMAGES: Record<string, string> = {
  espresso: IMAGES.espresso,
  latte: IMAGES.latte,
  "cold-brew": IMAGES.coldBrew,
  macchiato: IMAGES.macchiato,
  frappe: "/drinks/frappe.png",
  "iced-mocha": "/drinks/iced-mocha.png",
};

export function productImage(row: Pick<ProductRow, "id" | "image_url">) {
  return row.image_url || STARTER_IMAGES[row.id] || null;
}

export function toMenuProduct(
  row: Pick<
    ProductRow,
    "id" | "name" | "price" | "description" | "origin" | "category" | "image_url" | "accent" | "featured"
  >,
): MenuProduct {
  return {
    id: row.id,
    name: row.name,
    note: row.description ?? "",
    origin: row.origin ?? "",
    price: Number(row.price),
    image: productImage(row),
    accent: row.accent,
    category: row.category,
    featured: row.featured,
  };
}

/**
 * The menu as it shipped, used when Supabase isn't reachable or the products
 * migration hasn't been run — the site keeps working either way.
 */
export const STARTER_MENU: MenuProduct[] = [
  ...PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    note: p.note,
    origin: p.origin,
    price: p.price,
    image: p.image,
    accent: p.accent,
    category: p.id === "cold-brew" ? "iced" : "hot",
    featured: true,
  })),
  {
    id: "frappe",
    name: "Frappé",
    note: "Blended with ice, caramel popcorn crown",
    origin: "Salted caramel",
    price: 5.5,
    image: STARTER_IMAGES.frappe,
    accent: "#c07a36",
    category: "iced",
    featured: false,
  },
  {
    id: "iced-mocha",
    name: "Iced Mocha",
    note: "Espresso and dark chocolate over ice",
    origin: "72% chocolate",
    price: 5.25,
    image: STARTER_IMAGES["iced-mocha"],
    accent: "#6b3a22",
    category: "iced",
    featured: false,
  },
];
