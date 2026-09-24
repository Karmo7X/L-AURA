"use server";

import { revalidatePath } from "next/cache";
import { staffContext } from "@/lib/supabase/session";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/env";
import { HOME_DEFAULTS, HOME_KEYS, type HomeSection } from "@/lib/content";

// The home page's words and pictures. Each section is saved as one JSON row
// in public.site_content; the site falls back to the copy it ships with for
// anything left empty, so a half-filled form can't break the page.

export interface HomeState {
  ok?: boolean;
  message?: string;
  error?: string;
  savedAt?: number;
}

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

const str = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
/** Free text that may run to a few lines — newlines are kept. */
const para = (form: FormData, name: string, max: number) =>
  String(form.get(name) ?? "")
    .trim()
    .slice(0, max);
const num = (form: FormData, name: string, min: number, max: number, fallback: number) => {
  const n = Number(String(form.get(name) ?? "").trim());
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
/** "07:30" → 7.5 */
const clockHours = (form: FormData, name: string, fallback: number) => {
  const [h, m] = String(form.get(name) ?? "").split(":");
  const hours = Number(h) + Number(m ?? 0) / 60;
  return Number.isFinite(hours) ? Math.min(24, Math.max(0, Math.round(hours * 100) / 100)) : fallback;
};
const clockLabel = (v: number) =>
  `${String(Math.floor(v)).padStart(2, "0")}:${String(Math.round((v % 1) * 60)).padStart(2, "0")}`;

export async function saveHomeSection(_: HomeState, form: FormData): Promise<HomeState> {
  const section = String(form.get("section") ?? "") as HomeSection;
  if (!(section in HOME_KEYS)) return { error: "That isn’t part of the home page." };

  const ctx = await staffContext();
  if (!ctx.user) return { error: "Your session has ended — sign in again." };
  if (!ctx.staff) return { error: "Only cafe staff can change the site." };

  /** Store a chosen file and hand back its public URL. */
  const upload = async (file: File, types: Record<string, string>, prefix: string) => {
    const ext = types[file.type];
    if (!ext) return { error: `That file type isn’t allowed here.` };
    if (file.size > MAX_BYTES) return { error: "Files can be up to 5 MB." };
    const path = `site/${prefix}-${Date.now()}.${ext}`;
    const { error } = await ctx.supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("site upload failed", error);
      return { error: "The file didn’t upload — try again." };
    }
    return { url: ctx.supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl };
  };

  /** A picture field: a new upload, or whatever was there before. */
  const picture = async (name: string, fallback: string) => {
    const file = form.get(name);
    if (file instanceof File && file.size > 0) {
      const r = await upload(file, IMAGE_TYPES, name);
      if (r.error) return { error: r.error };
      return { url: r.url! };
    }
    const current = String(form.get(`${name}_url`) ?? "").trim();
    return { url: current || fallback };
  };

  let value: Record<string, unknown>;

  if (section === "menu") {
    value = {
      eyebrow: str(form, "eyebrow", 40),
      title: str(form, "title", 80),
      description: para(form, "description", 300),
    };
  } else if (section === "day") {
    const cadences = HOME_DEFAULTS.day.cadences.map((base, i) => {
      const from = clockHours(form, `cadence.${i}.from`, base.from);
      const to = clockHours(form, `cadence.${i}.to`, base.to);
      return {
        id: base.id,
        from,
        to,
        hours: `${clockLabel(from)} — ${clockLabel(to)}`,
        glyph: str(form, `cadence.${i}.glyph`, 4) || base.glyph,
        title: str(form, `cadence.${i}.title`, 80),
        copy: para(form, `cadence.${i}.copy`, 400),
        mood: str(form, `cadence.${i}.mood`, 60),
        quote: para(form, `cadence.${i}.quote`, 400),
        tags: String(form.get(`cadence.${i}.tags`) ?? "")
          .split(",")
          .map((t) => t.trim().slice(0, 30))
          .filter(Boolean)
          .slice(0, 6),
      };
    });
    value = {
      eyebrow: str(form, "eyebrow", 40),
      title: str(form, "title", 60),
      italic: str(form, "italic", 60),
      intro: para(form, "intro", 400),
      cadences,
    };
  } else if (section === "space") {
    const photo = await picture("photo", HOME_DEFAULTS.space.photo);
    if (photo.error) return { error: photo.error };
    const zones = HOME_DEFAULTS.space.zones.map((base, i) => ({
      id: base.id,
      n: base.n,
      eyebrow: str(form, `zone.${i}.eyebrow`, 40),
      title: str(form, `zone.${i}.title`, 60),
      copy: para(form, `zone.${i}.copy`, 400),
      meta: str(form, `zone.${i}.meta`, 60),
      pin: str(form, `zone.${i}.pin`, 40),
      x: num(form, `zone.${i}.x`, 0, 100, base.x),
      y: num(form, `zone.${i}.y`, 0, 100, base.y),
    }));
    const materials = Array.from({ length: 8 }, (_, i) => ({
      label: str(form, `material.${i}.label`, 40),
      swatch: /^#[0-9a-f]{6}$/i.test(String(form.get(`material.${i}.swatch`) ?? ""))
        ? String(form.get(`material.${i}.swatch`))
        : "#d7ba97",
    })).filter((m) => m.label);
    value = {
      eyebrow: str(form, "eyebrow", 40),
      title: str(form, "title", 80),
      description: para(form, "description", 400),
      photo: photo.url,
      captionKicker: str(form, "captionKicker", 60),
      captionTitle: str(form, "captionTitle", 80),
      zones,
      materials,
    };
  } else {
    const photo = await picture("photo", HOME_DEFAULTS.bar.photo);
    if (photo.error) return { error: photo.error };

    value = {
      eyebrow: str(form, "eyebrow", 40),
      title: str(form, "title", 80),
      description: para(form, "description", 400),
      photo: photo.url,
      shift: str(form, "shift", 60),
      pour: str(form, "pour", 60),
      board: {
        origin: str(form, "board.origin", 80),
        grade: str(form, "board.grade", 40),
        accents: str(form, "board.accents", 80),
        ambient: str(form, "board.ambient", 80),
        quote: para(form, "board.quote", 400),
        barista: str(form, "board.barista", 80),
        calibrated: str(form, "board.calibrated", 40),
      },
    };
  }

  const key = HOME_KEYS[section];
  const stamp = { value, updated_at: new Date().toISOString(), updated_by: ctx.user.id };
  const { data: existing } = await ctx.supabase.from("site_content").select("key").eq("key", key).maybeSingle();
  const { error } = existing
    ? await ctx.supabase.from("site_content").update(stamp).eq("key", key)
    : await ctx.supabase.from("site_content").insert({ key, ...stamp });

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return { error: "The site content table isn’t there yet — run 20260926000000_admin_content.sql in Supabase." };
    }
    if (error.code === "42501") return { error: "Only cafe staff can change the site." };
    console.error("site content save failed", error);
    return { error: "That didn’t save — please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/home");
  return { ok: true, savedAt: Date.now(), message: "Saved — the home page has it now." };
}
