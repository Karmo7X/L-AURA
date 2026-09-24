"use server";

import { revalidatePath } from "next/cache";
import { staffContext } from "@/lib/supabase/session";
import { CATEGORY_ID, categoryIdFrom } from "@/lib/products";

// The menu's own sections. Products point at these, so a section that is
// still in use can be hidden but not deleted — the database enforces that
// too, and we turn its complaint into something readable.

export interface SectionState {
  ok?: boolean;
  message?: string;
  error?: string;
  values?: Record<string, string>;
  savedAt?: number;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/order");
  revalidatePath("/admin/menu-sections");
  revalidatePath("/admin/products");
}

/** Add a section, or rename/reorder/hide one that exists. */
export async function saveCategory(_: SectionState, form: FormData): Promise<SectionState> {
  const values = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string") as [string, string][]);
  const ctx = await staffContext();
  if (!ctx.user) return { error: "Your session has ended — sign in again.", values };
  if (!ctx.staff) return { error: "Only cafe staff can change the menu sections.", values };

  const label = (values.label ?? "").trim().replace(/\s+/g, " ");
  if (!label) return { error: "Give the section a name.", values };
  if (label.length > 40) return { error: "Keep the name to 40 characters.", values };

  const order = values.sort_order?.trim() ? Number(values.sort_order) : 100;
  if (!Number.isInteger(order) || order < 0 || order > 9999)
    return { error: "Use a whole number from 0 to 9999.", values };

  const active = values.active === "on";
  const editing = values.id?.trim();

  if (editing) {
    const { data, error } = await ctx.supabase
      .from("categories")
      .update({ label, sort_order: order, active })
      .eq("id", editing)
      .select("id")
      .maybeSingle();
    if (error || !data) return { error: explain(error?.code), values };
    refresh();
    return { ok: true, message: `${label} saved.`, savedAt: Date.now() };
  }

  const id = categoryIdFrom(label);
  if (!CATEGORY_ID.test(id)) return { error: "Use a name with some letters or numbers in it.", values };
  const { error } = await ctx.supabase.from("categories").insert({ id, label, sort_order: order, active });
  if (error) {
    if (error.code === "23505") return { error: `There's already a section called “${label}”.`, values };
    return { error: explain(error.code), values };
  }
  refresh();
  return { ok: true, message: `${label} added.`, savedAt: Date.now() };
}

/** Remove a section. Anything still filed under it has to move first. */
export async function deleteCategory(id: string): Promise<SectionState> {
  const ctx = await staffContext();
  if (!ctx.staff) return { error: "Only cafe staff can change the menu sections." };

  const { count } = await ctx.supabase.from("products").select("id", { count: "exact", head: true }).eq("category", id);
  if (count) {
    return {
      error: `${count} product${count === 1 ? "" : "s"} still sit${count === 1 ? "s" : ""} in that section — move them first.`,
    };
  }

  const { error } = await ctx.supabase.from("categories").delete().eq("id", id);
  if (error) return { error: explain(error.code) };
  refresh();
  return { ok: true, message: "Section removed." };
}

function explain(code?: string) {
  switch (code) {
    case "42501":
      return "Only cafe staff can change the menu sections.";
    case "23503":
      return "Products are still filed under that section — move them first.";
    case "PGRST205":
    case "42P01":
      return "The sections table isn’t there yet — run 20260926000000_admin_content.sql in Supabase.";
    default:
      return "That didn’t save — please try again.";
  }
}
