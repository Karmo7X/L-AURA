import { cache } from "react";
import { supabaseServer } from "./server";
import { supabaseEnv } from "./env";
import { MENU_COLUMNS, STARTER_MENU, toMenuProduct, type MenuProduct, type ProductRow } from "@/lib/products";
import { HERO_COLUMNS, STARTER_HERO, heroSlideFromProduct, type HeroProductRow, type HeroSlide } from "@/lib/heroSlides";

/**
 * Everything on the menu (active products), in the cafe's order. Falls back
 * to the starter menu if Supabase isn't configured or the products migration
 * hasn't been run yet, so the site never breaks over it.
 */
export const getMenu = cache(async (): Promise<MenuProduct[]> => {
  if (!supabaseEnv()) return STARTER_MENU;
  const { data, error } = await supabaseServer()
    .from("products")
    .select(MENU_COLUMNS)
    .eq("active", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.warn(`Menu: using the starter menu (${error.code}: ${error.message})`);
    return STARTER_MENU;
  }
  return (data as unknown as ProductRow[]).map(toMenuProduct);
});

/**
 * The products the cafe put in the hero slider (on the menu and marked
 * "in hero"), in menu order. Falls back to the slider the site shipped with
 * until the hero migration has been run, or if none are marked.
 */
export const getHeroSlides = cache(async (): Promise<HeroSlide[]> => {
  if (!supabaseEnv()) return STARTER_HERO;
  const { data, error } = await supabaseServer()
    .from("products")
    .select(HERO_COLUMNS)
    .eq("active", true)
    .eq("in_hero", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.warn(`Hero: using the starter slides (${error.code}: ${error.message})`);
    return STARTER_HERO;
  }
  const rows = data as unknown as HeroProductRow[];
  return rows.length ? rows.map(heroSlideFromProduct) : STARTER_HERO;
});
