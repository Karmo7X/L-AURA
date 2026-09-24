/** The project URL and publishable key from .env.local, or null if they aren't set. */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export const MISSING_ENV =
  "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — add them to .env.local.";

/** Bucket the cafe's product photos live in (see the products migration). */
export const PRODUCT_IMAGES_BUCKET = "product-images";
