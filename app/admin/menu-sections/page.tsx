import { AdminShell } from "../AdminShell";
import { staffGate } from "../gate";
import { SectionsEditor } from "./SectionsEditor";
import type { Category } from "@/lib/products";

export default async function MenuSectionsPage() {
  const gate = await staffGate("/admin/menu-sections");
  if (gate.blocked) return gate.blocked;
  const { ctx, who } = gate;

  const [{ data: rows, error }, { data: products }] = await Promise.all([
    ctx.supabase.from("categories").select("id, label, sort_order, active").order("sort_order").order("label"),
    ctx.supabase.from("products").select("category"),
  ]);

  const counts = new Map<string, number>();
  for (const p of (products ?? []) as { category: string }[]) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }

  return (
    <AdminShell who={who} section="menu-sections">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-amber-deep">Menu</p>
          <h1 className="mt-1 font-serif text-[40px] leading-none font-medium text-espresso-800">Sections</h1>
        </div>
        <p className="max-w-md text-sm text-subtle">
          The tabs guests tap on the ordering screen, and the headings on the home page menu. Order them the way you
          want them read.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-amber-deep">
          {error.code === "42P01" || error.code === "PGRST205"
            ? "The sections table isn’t there yet — run supabase/migrations/20260926000000_admin_content.sql in Supabase."
            : `Couldn’t load the sections: ${error.message}`}
        </p>
      )}

      <SectionsEditor categories={((rows ?? []) as Category[]).map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))} />
    </AdminShell>
  );
}
