import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2, Coffee } from "lucide-react";
import { staffContext } from "@/lib/supabase/session";
import { supabaseEnv } from "@/lib/supabase/env";
import { categoryLabel, productImage, STARTER_CATEGORIES, type Category, type ProductRow } from "@/lib/products";
import { money } from "@/lib/orders";
import { cn } from "@/lib/cn";
import { AdminShell, Notice } from "../AdminShell";
import { ProductForm } from "./ProductForm";
import { ProductRowActions } from "./ProductRowActions";

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  if (!supabaseEnv()) {
    return (
      <AdminShell>
        <Notice title="Supabase isn’t connected">
          <p>
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the dev
            server.
          </p>
        </Notice>
      </AdminShell>
    );
  }

  const { edit, saved } = await searchParams;
  const ctx = await staffContext();
  if (!ctx.user) redirect("/admin/login?next=/admin/products");
  const who = ctx.staff?.name || ctx.user.email;

  if (ctx.setup) {
    return (
      <AdminShell who={who}>
        <Notice title="One more setup step">
          <p>{ctx.setup}</p>
        </Notice>
      </AdminShell>
    );
  }

  if (!ctx.staff) {
    return (
      <AdminShell who={who}>
        <Notice title="This account isn’t on the staff list">
          <p>
            You’re signed in as <strong className="text-espresso-800">{ctx.user.email}</strong>, but only cafe staff can
            manage products. Ask the owner to add you — in the Supabase SQL Editor:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-espresso-900 p-3 font-mono text-[12px] leading-5 text-latte">
            {`insert into public.staff (user_id, display_name)\nvalues ('${ctx.user.id}', 'Your name');`}
          </pre>
        </Notice>
      </AdminShell>
    );
  }

  const [{ data, error }, { data: sectionRows }] = await Promise.all([
    ctx.supabase.from("products").select("*").order("sort_order").order("name"),
    ctx.supabase.from("categories").select("id, label, sort_order, active").order("sort_order").order("label"),
  ]);
  const sections = ((sectionRows ?? []) as Category[]).length ? (sectionRows as Category[]) : STARTER_CATEGORIES;
  const products = (data ?? []) as ProductRow[];
  const editing = typeof edit === "string" ? (products.find((p) => p.id === edit) ?? null) : null;
  const justSaved = typeof saved === "string" ? products.find((p) => p.id === saved) : undefined;
  const onMenu = products.filter((p) => p.active).length;
  const featured = products.filter((p) => p.active && p.featured).length;
  const inHero = products.filter((p) => p.active && p.in_hero).length;

  return (
    <AdminShell who={who} section="products">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-amber-deep">Menu</p>
          <h1 className="mt-1 font-serif text-[40px] leading-none font-medium text-espresso-800">Products</h1>
        </div>
        <p className="text-sm text-subtle">
          {onMenu} on the menu · {products.length - onMenu} hidden · {featured} featured · {inHero} in the hero
        </p>
      </div>

      {justSaved && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-xl bg-[#7ee08a]/15 px-4 py-3 text-sm text-[#2f6b3a]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Saved {justSaved.name}.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-amber-deep">
          Couldn’t load the products: {error.message}
        </p>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-5">
          <ProductForm key={editing?.id ?? "new"} product={editing} categories={sections} />
        </div>

        <section aria-labelledby="list-title" className="lg:col-span-7">
          <h2 id="list-title" className="sr-only">
            All products
          </h2>
          {products.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-espresso-800/20 bg-paper px-6 py-16 text-center">
              <Coffee className="h-8 w-8 text-subtle" aria-hidden />
              <p className="mt-3 font-serif text-xl text-espresso-800">No products yet</p>
              <p className="mt-1 text-sm text-subtle">Add the first one with the form.</p>
            </div>
          ) : (
            <ul className="divide-y divide-espresso-800/8 overflow-hidden rounded-2xl border border-espresso-800/10 bg-paper shadow-card">
              {products.map((p) => {
                const image = productImage(p);
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 sm:px-5",
                      editing?.id === p.id && "bg-peach/10",
                      !p.active && "bg-oat/50",
                    )}
                  >
                    <span
                      className={cn(
                        "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-oat",
                        !p.active && "opacity-50 grayscale",
                      )}
                    >
                      {image ? (
                        <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: p.accent }} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className={cn("truncate font-semibold text-espresso-800", !p.active && "text-subtle")}>
                          {p.name}
                        </span>
                        {!p.active && (
                          <span className="label-caps rounded-full bg-espresso-800/8 px-2 py-0.5 text-[9px] text-muted">
                            Hidden
                          </span>
                        )}
                        {p.in_hero && p.active && (
                          <span className="label-caps rounded-full bg-terracotta/15 px-2 py-0.5 text-[9px] text-amber-deep">
                            In hero
                          </span>
                        )}
                        {p.featured && p.active && (
                          <span className="label-caps rounded-full bg-gold/20 px-2 py-0.5 text-[9px] text-amber-deep">
                            Featured
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[13px] text-subtle">
                        {categoryLabel(p.category, sections)}
                        {p.origin ? ` · ${p.origin}` : ""}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums" style={{ color: p.accent }}>
                      {money(Number(p.price))}
                    </span>
                    <ProductRowActions
                      id={p.id}
                      name={p.name}
                      active={p.active}
                      featured={p.featured}
                      inHero={Boolean(p.in_hero)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
