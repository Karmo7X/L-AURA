import { cache } from "react";
import { supabaseServer } from "./server";
import { supabaseEnv } from "./env";
import { HOME_DEFAULTS, mergeHome, type HomeContent } from "@/lib/content";
import { STARTER_CATEGORIES, type Category } from "@/lib/products";

/**
 * The home page as the cafe wrote it (admin → Home). Anything they haven't
 * touched falls back to the copy the site ships with, so the page is always
 * complete — even before the migration has been run.
 */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  if (!supabaseEnv()) return HOME_DEFAULTS;
  const { data, error } = await supabaseServer().from("site_content").select("key, value");
  if (error) {
    console.warn(`Home content: using the built-in copy (${error.code}: ${error.message})`);
    return HOME_DEFAULTS;
  }
  return mergeHome(data as { key: string; value: unknown }[]);
});

/** The menu's sections (admin → Menu sections), in the cafe's order. */
export const getCategories = cache(async (): Promise<Category[]> => {
  if (!supabaseEnv()) return STARTER_CATEGORIES;
  const { data, error } = await supabaseServer()
    .from("categories")
    .select("id, label, sort_order, active")
    .eq("active", true)
    .order("sort_order")
    .order("label");
  if (error) {
    console.warn(`Categories: using the starter sections (${error.code}: ${error.message})`);
    return STARTER_CATEGORIES;
  }
  const rows = data as Category[];
  return rows.length ? rows : STARTER_CATEGORIES;
});

/** Every section, including hidden ones — for the admin screens. */
export async function getAllCategories(): Promise<Category[]> {
  if (!supabaseEnv()) return STARTER_CATEGORIES;
  const { data, error } = await supabaseServer()
    .from("categories")
    .select("id, label, sort_order, active")
    .order("sort_order")
    .order("label");
  if (error) {
    console.warn(`Categories: using the starter sections (${error.code}: ${error.message})`);
    return STARTER_CATEGORIES;
  }
  return data as Category[];
}
