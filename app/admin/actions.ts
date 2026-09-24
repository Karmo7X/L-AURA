"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { staffContext, supabaseWithSession } from "@/lib/supabase/session";
import { PRODUCT_IMAGES_BUCKET, supabaseEnv } from "@/lib/supabase/env";
import { STARTER_CATEGORIES } from "@/lib/products";
import { ORDER_STATUS, UUID, type OrderStatus, type PaymentMethod } from "@/lib/orders";

// Every action here is reachable by a direct POST, so each one checks who is
// signed in; the database's row-level security is the final word either way.

export type ProductField =
  | "name"
  | "price"
  | "category"
  | "origin"
  | "description"
  | "accent"
  | "sort_order"
  | "image"
  | "hero_image"
  | "kicker"
  | "strength"
  | "milk"
  | "size";

export interface ProductFormState {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<ProductField, string>>;
  /** what was submitted, so a failed save doesn't clear the form */
  values?: Record<string, string>;
  /** changes on every successful add, to reset the form */
  savedAt?: number;
}

export interface LoginState {
  message?: string;
  email?: string;
}

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};
/** Hero cut-outs need transparency, which JPEG can't carry. */
const CUTOUT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** A chosen, valid photo from the form, or an error message. */
function readPhoto(form: FormData, name: string, types: Record<string, string>, typesText: string) {
  const file = form.get(name);
  if (!(file instanceof File) || file.size === 0) return { file: null };
  if (!types[file.type]) return { error: `Use a ${typesText} image.` };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Images can be up to 5 MB." };
  return { file, ext: types[file.type] };
}

// ------------------------------------------------------------ sign in/out

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { message: "Enter your email and password.", email };
  if (!supabaseEnv()) return { message: "Supabase isn’t configured — add the keys to .env.local.", email };

  const supabase = await supabaseWithSession();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      message: error.code === "invalid_credentials" ? "That email and password don’t match." : error.message,
      email,
    };
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await supabaseWithSession();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Only ever send someone back into the admin area — never to another site. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(\/|\?|$)/.test(next) && !next.startsWith("//") ? next : "/admin/products";
}

// --------------------------------------------------------------- products

export async function saveProduct(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  const values = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string") as [string, string][]);
  const ctx = await staffContext();
  if (!ctx.user) return { message: "Your session has ended — sign in again.", values };
  if (!ctx.staff) return { message: "Only cafe staff can change products.", values };

  // ---- read and check the fields
  const errors: ProductFormState["errors"] = {};
  const name = (values.name ?? "").trim().replace(/\s+/g, " ");
  if (!name) errors.name = "Give it a name.";
  else if (name.length > 60) errors.name = "Keep the name to 60 characters.";

  const price = Number((values.price ?? "").replace(",", "."));
  if (!values.price?.trim() || !Number.isFinite(price)) errors.price = "Enter a price, like 4.50.";
  else if (price < 0 || price > 999.99) errors.price = "Prices run from 0 to 999.99.";

  // the sections are the cafe's own now (admin → Sections)
  const { data: sections } = await ctx.supabase.from("categories").select("id");
  const known = (sections as { id: string }[] | null)?.map((c) => c.id) ?? STARTER_CATEGORIES.map((c) => c.id);
  const category = values.category ?? known[0] ?? "hot";
  if (!known.includes(category)) errors.category = "Pick a section.";

  const origin = (values.origin ?? "").trim();
  if (origin.length > 60) errors.origin = "Keep this to 60 characters.";

  const description = (values.description ?? "").trim();
  if (description.length > 240) errors.description = "Keep the description to 240 characters.";

  const accent = values.accent || "#8a4526";
  if (!/^#[0-9a-f]{6}$/i.test(accent)) errors.accent = "Pick a colour.";

  const sortOrder = values.sort_order?.trim() ? Number(values.sort_order) : 100;
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999)
    errors.sort_order = "Use a whole number from 0 to 9999.";

  const photo = readPhoto(form, "image", IMAGE_TYPES, "PNG, JPG, WebP or AVIF");
  if (photo.error) errors.image = photo.error;

  // ---- hero slider
  const inHero = values.in_hero === "on";
  const cutout = readPhoto(form, "hero_image", CUTOUT_TYPES, "PNG, WebP or AVIF (with a transparent background)");
  if (cutout.error) errors.hero_image = cutout.error;
  const removeCutout = values.remove_hero_image === "on" && !cutout.file;

  const kicker = (values.kicker ?? "").trim();
  if (kicker.length > 40) errors.kicker = "Keep this to 40 characters.";
  const strength = values.strength?.trim() ? Number(values.strength) : null;
  if (strength !== null && (!Number.isInteger(strength) || strength < 1 || strength > 5))
    errors.strength = "Pick 1 to 5.";
  const milk = (values.milk ?? "").trim();
  if (milk.length > 30) errors.milk = "Keep this to 30 characters.";
  const size = (values.size ?? "").trim();
  if (size.length > 20) errors.size = "Keep this to 20 characters.";

  if (Object.keys(errors).length) return { errors, values, message: "Check the highlighted fields." };

  const editingId = values.id?.trim() || null;
  const productId = editingId ?? newProductId(name);
  const fields: Record<string, unknown> = {
    name,
    price: Math.round(price * 100) / 100,
    category,
    origin: origin || null,
    description: description || null,
    accent,
    sort_order: sortOrder,
    active: values.active === "on",
    featured: values.featured === "on",
    in_hero: inHero,
    kicker: kicker || null,
    strength,
    milk: milk || null,
    size: size || null,
  };

  // ---- photos first, so a product never points at a missing file
  const uploaded: string[] = [];
  const upload = async (file: File, ext: string, prefix: string, field: ProductField) => {
    const path = `${productId}/${prefix}${Date.now()}.${ext}`;
    const { error } = await ctx.supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("product photo upload failed", error);
      return { error: { [field]: "The image didn’t upload — try again." } as ProductFormState["errors"] };
    }
    const url = ctx.supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
    uploaded.push(url);
    return { url };
  };
  if (photo.file) {
    const r = await upload(photo.file, photo.ext!, "", "image");
    if (r.error) return { values, errors: r.error };
    fields.image_url = r.url;
  }
  if (cutout.file) {
    const r = await upload(cutout.file, cutout.ext!, "hero-", "hero_image");
    if (r.error) {
      await removePhotos(ctx.supabase, uploaded);
      return { values, errors: r.error };
    }
    fields.hero_image_url = r.url;
  }
  if (removeCutout) fields.hero_image_url = null;

  // ---- save
  if (editingId) {
    const { data: before } = await ctx.supabase
      .from("products")
      .select("image_url, hero_image_url")
      .eq("id", editingId)
      .maybeSingle();
    const { data, error } = await ctx.supabase
      .from("products")
      .update(fields)
      .eq("id", editingId)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      await removePhotos(ctx.supabase, uploaded);
      return { values, message: error ? explain(error) : "That product no longer exists." };
    }
    // images that were replaced or removed are no longer used
    const stale = [
      "image_url" in fields ? before?.image_url : null,
      "hero_image_url" in fields ? before?.hero_image_url : null,
    ].filter(Boolean) as string[];
    await removePhotos(ctx.supabase, stale);
    refresh();
    redirect(`/admin/products?saved=${encodeURIComponent(editingId)}`);
  }

  const { error } = await ctx.supabase.from("products").insert({ id: productId, ...fields });
  if (error) {
    await removePhotos(ctx.supabase, uploaded);
    return { values, message: explain(error) };
  }
  refresh();
  return {
    ok: true,
    savedAt: Date.now(),
    message: fields.active ? `${name} is on the menu.` : `${name} is saved (hidden from the menu).`,
  };
}

export async function setProductFlag(id: string, flag: "active" | "featured" | "in_hero", on: boolean) {
  const ctx = await staffContext();
  if (!ctx.staff) return { ok: false, message: "Only cafe staff can change products." };
  const { data, error } = await ctx.supabase
    .from("products")
    .update({ [flag]: on })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, message: error ? explain(error) : "That product no longer exists." };
  refresh();
  return { ok: true };
}

// ----------------------------------------------------------------- orders

/** Move an order along the counter: placed → preparing → ready → collected. */
export async function setOrderStatus(id: string, status: OrderStatus) {
  const ctx = await staffContext();
  if (!ctx.staff) return { ok: false, message: "Only cafe staff can change orders." };
  if (!UUID.test(id) || !(status in ORDER_STATUS)) return { ok: false, message: "That’s not a status we use." };

  const { data, error } = await ctx.supabase.from("orders").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error || !data) {
    if (error) console.error("order status change failed", error);
    return {
      ok: false,
      message: error
        ? error.code === "42501"
          ? "Only cafe staff can change orders."
          : error.code === "42703" || error.code === "PGRST204"
            ? "Run supabase/migrations/20260923000000_table_orders.sql in Supabase."
            : "That didn’t save — please try again."
        : "That order no longer exists.",
    };
  }
  revalidatePath("/admin/orders");
  return { ok: true };
}

/**
 * Take payment for an order — what the QR code on the invoice leads to.
 * The database stamps who took it and when; settling twice is harmless.
 */
export async function settleOrder(id: string, method: PaymentMethod) {
  const ctx = await staffContext();
  if (!ctx.staff) return { ok: false, message: "Only cafe staff can take payment." };
  if (!UUID.test(id)) return { ok: false, message: "That order code doesn’t look right." };

  const { error } = await ctx.supabase.rpc("settle_order", { p_id: id, p_method: method });
  if (error) {
    console.error("settle_order failed", error);
    return {
      ok: false,
      message:
        error.code === "22023" || error.code === "42501"
          ? error.message
          : error.code === "PGRST202"
            ? "Run supabase/migrations/20260924000000_payments.sql in Supabase."
            : "That didn’t save — please try again.",
    };
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/pay/${id}`);
  revalidatePath(`/invoice/${id}`);
  return { ok: true };
}

/** Find an order by the number printed on the slip, for the counter. */
export async function findOrderByNumber(orderNumber: number) {
  const ctx = await staffContext();
  if (!ctx.staff) return { ok: false as const, message: "Only cafe staff can look orders up." };
  if (!Number.isInteger(orderNumber) || orderNumber < 1)
    return { ok: false as const, message: "Enter an order number." };

  const { data, error } = await ctx.supabase.from("orders").select("id").eq("order_number", orderNumber).maybeSingle();
  if (error) {
    console.error("order lookup failed", error);
    return { ok: false as const, message: "That didn’t work — please try again." };
  }
  if (!data) return { ok: false as const, message: `No order #${orderNumber}.` };
  return { ok: true as const, id: data.id as string };
}

export async function deleteProduct(id: string) {
  const ctx = await staffContext();
  if (!ctx.staff) return { ok: false, message: "Only cafe staff can change products." };
  const { data, error } = await ctx.supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("image_url, hero_image_url")
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      message:
        error.code === "23503"
          ? "This product is on past orders, so it can’t be deleted — hide it from the menu instead."
          : explain(error),
    };
  }
  if (!data) return { ok: false, message: "That product no longer exists." };
  await removePhotos(ctx.supabase, [data.image_url, data.hero_image_url].filter(Boolean) as string[]);
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- helpers

/** The menu shows on the home page — rebuild it along with the admin list. */
function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/products");
}

/** "Hazelnut Latte" → "hazelnut-latte-3f9a" (matches the id rule in the migration). */
function newProductId(name: string) {
  const slug =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32)
      .replace(/-+$/, "") || "item";
  return `${slug}-${crypto.randomUUID().slice(0, 4)}`;
}

/** Remove photos we stored ourselves; anything else (starter photos) is left alone. */
async function removePhotos(supabase: Awaited<ReturnType<typeof supabaseWithSession>>, urls: string[]) {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const paths = urls
    .map((u) => (u.includes(marker) ? decodeURIComponent(u.split(marker)[1]) : null))
    .filter(Boolean) as string[];
  if (!paths.length) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) console.warn("couldn’t remove old product photo", error.message);
}

function explain(error: PostgrestError) {
  switch (error.code) {
    case "42501":
      return "Only cafe staff can change products.";
    case "23514":
      return "Something is out of range — check the fields and try again.";
    case "23505":
      return "A product with that id already exists — try again.";
    case "PGRST205":
    case "42P01":
      return "The products table isn’t set up yet — run the products migration in Supabase.";
    case "PGRST204":
    case "42703":
      return "The database is missing the hero slider columns — run 20260922000000_hero_products.sql in Supabase.";
    default:
      console.error("product change failed", error);
      return "That didn’t save — please try again.";
  }
}
