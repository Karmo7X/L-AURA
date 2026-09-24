"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Search, X } from "lucide-react";
import { money } from "@/lib/orders";
import { STARTER_CATEGORIES, type Category, type MenuProduct } from "@/lib/products";
import { useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { CupLogo } from "@/components/ui/icons";

/**
 * The menu a guest scrolls at the table: search, a shelf of favourites, then
 * the rest grouped by kind. Tapping a drink puts it in the basket at the
 * bottom of the screen — nothing is sent until they say so.
 */
export function MenuList({
  products,
  table,
  categories = STARTER_CATEGORIES,
}: {
  products: MenuProduct[];
  table: string | null;
  categories?: Category[];
}) {
  const cart = useCafe((s) => s.cart);
  const addToCart = useCafe((s) => s.addToCart);
  const changeQty = useCafe((s) => s.changeQty);

  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const qtyOf = (id: string) => cart.find((c) => c.key === id)?.qty ?? 0;
  const add = (product: MenuProduct) =>
    addToCart({ key: product.id, name: product.name, price: product.price, image: product.image ?? undefined });

  const search = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      search ? products.filter((p) => `${p.name} ${p.note} ${p.origin}`.toLowerCase().includes(search)) : products,
    [products, search],
  );
  const shown = category === "all" ? matches : matches.filter((p) => p.category === category);
  const used = categories.filter((c) => products.some((p) => p.category === c.id));
  const favourites = products.filter((p) => p.featured);
  // the plain list is for one category or a search; otherwise it reads as a menu
  const grouped = category === "all" && !search;

  return (
    <>
      {/* search and categories, always within thumb's reach */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-espresso-800/8 bg-linen/95 px-4 pt-4 pb-3 backdrop-blur-md lg:flex lg:items-center lg:gap-4">
        <label className="relative block lg:min-w-[260px] lg:flex-1">
          <span className="sr-only">Search the menu</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            name="menu_search"
            placeholder="Flat white, croissant, something iced…"
            className="w-full rounded-full border border-espresso-800/12 bg-paper py-3 pr-11 pl-11 text-[15px] text-espresso-800 outline-none transition-colors placeholder:text-subtle/80 focus:border-terracotta"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear the search"
              className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-subtle hover:bg-oat hover:text-espresso-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:mt-0 lg:px-0">
          {[{ id: "all", label: "Everything" }, ...used].map((c) => {
            const n = c.id === "all" ? matches.length : matches.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={cn(
                  "label-caps flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 transition-colors",
                  category === c.id
                    ? "border-espresso-800 bg-espresso-800 text-linen"
                    : "border-espresso-800/15 bg-paper text-muted hover:border-terracotta hover:text-espresso-800",
                )}
              >
                {c.label}
                <span className={cn("tabular-nums", category === c.id ? "text-linen/60" : "text-subtle")}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <h1 id="menu" className="mt-7 scroll-mt-32 font-serif text-[34px] leading-none font-medium text-espresso-800">
        Menu
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {table
          ? `Tap what you’d like and send it from table ${table} — we’ll bring it over. Pay at the counter on your way out.`
          : "Tap what you’d like, send it to the bar, and collect it at the counter."}
      </p>

      {/* the shelf of favourites */}
      {grouped && favourites.length > 0 && (
        <section aria-labelledby="favourites" className="mt-7">
          <h2 id="favourites" className="label-caps text-amber-deep">
            Popular right now
          </h2>
          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
            {favourites.map((product) => {
              const qty = qtyOf(product.id);
              return (
                <li key={product.id} className="w-[168px] shrink-0 snap-start lg:w-[210px]">
                  <button
                    type="button"
                    onClick={() => add(product)}
                    aria-label={`Add ${product.name}`}
                    className="group relative block h-[204px] w-full overflow-hidden rounded-2xl bg-espresso-900 text-left shadow-card transition-shadow duration-500 hover:shadow-card-hover lg:h-[240px]"
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 210px, 168px"
                        className="object-cover transition-transform duration-700 ease-soft group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full place-items-center">
                        <CupLogo className="h-10 w-10" style={{ color: product.accent }} />
                      </span>
                    )}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,14,8,0)_38%,rgba(24,14,8,0.88)_100%)]"
                    />
                    <span className="absolute inset-x-3 bottom-3 block text-linen">
                      <span className="block truncate font-semibold">{product.name}</span>
                      <span className="block text-[13px] tabular-nums text-latte/85">{money(product.price)}</span>
                    </span>
                    <span
                      className={cn(
                        "absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full font-semibold shadow-[0_8px_18px_-8px_rgba(20,10,4,0.8)] transition-colors",
                        qty > 0
                          ? "bg-amber text-paper"
                          : "bg-paper/90 text-espresso-800 group-hover:bg-amber group-hover:text-paper",
                      )}
                    >
                      {qty > 0 ? <span className="text-[13px] tabular-nums">{qty}</span> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* everything else */}
      {grouped ? (
        used.map((c) => {
          const items = matches.filter((p) => p.category === c.id);
          if (items.length === 0) return null;
          return (
            <section key={c.id} aria-labelledby={`menu-${c.id}`} className="mt-9">
              <div className="flex items-baseline justify-between gap-3 border-b border-espresso-800/10 pb-2">
                <h2 id={`menu-${c.id}`} className="font-serif text-[26px] leading-none text-espresso-800">
                  {c.label}
                </h2>
                <span className="text-[12px] text-subtle tabular-nums">{items.length}</span>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((product) => (
                  <MenuCard
                    key={product.id}
                    product={product}
                    qty={qtyOf(product.id)}
                    onAdd={() => add(product)}
                    onStep={(by) => changeQty(product.id, by)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {shown.map((product) => (
            <MenuCard
              key={product.id}
              product={product}
              qty={qtyOf(product.id)}
              onAdd={() => add(product)}
              onStep={(by) => changeQty(product.id, by)}
            />
          ))}
        </ul>
      )}

      {shown.length === 0 && (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-espresso-800/20 px-6 py-14 text-center">
          <CupLogo className="h-8 w-8 text-subtle" aria-hidden />
          <p className="mt-3 font-serif text-xl text-espresso-800">
            {search ? `Nothing matches “${query.trim()}”` : "Nothing in this part of the menu yet"}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="mt-3 rounded-full border border-espresso-800/20 px-4 py-2 text-sm font-semibold text-espresso-800 transition-colors hover:bg-oat"
            >
              Show the whole menu
            </button>
          )}
        </div>
      )}
    </>
  );
}

/** One drink: photo, what it is, and the only two taps that matter. */
function MenuCard({
  product,
  qty,
  onAdd,
  onStep,
}: {
  product: MenuProduct;
  qty: number;
  onAdd: () => void;
  onStep: (by: number) => void;
}) {
  return (
    <motion.li
      layout
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-paper p-3.5 shadow-card transition-[border-color,transform,box-shadow] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-card-hover",
        qty > 0 ? "border-terracotta/60" : "border-espresso-800/10",
      )}
    >
      <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-oat ring-1 ring-espresso-800/5">
        {product.image ? (
          <Image src={product.image} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <CupLogo className="h-8 w-8" style={{ color: product.accent }} />
        )}
        <AnimatePresence>
          {qty > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center bg-espresso-950/50 font-serif text-xl text-linen tabular-nums"
            >
              ×{qty}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-espresso-800">{product.name}</p>
        {product.note && <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-subtle">{product.note}</p>}
        <p
          className="mt-2 inline-flex items-center rounded-full bg-oat px-2.5 py-1 text-[13px] font-semibold tabular-nums"
          style={{ color: product.accent }}
        >
          {money(product.price)}
        </p>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {qty > 0 ? (
          <motion.span
            key="stepper"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: EASE_SOFT }}
            className="flex shrink-0 items-center gap-1 rounded-full border border-espresso-800/15 bg-linen p-1"
          >
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label={`One fewer ${product.name}`}
              className="grid h-9 w-9 place-items-center rounded-full text-espresso-800 hover:bg-oat"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label={`One more ${product.name}`}
              className="grid h-9 w-9 place-items-center rounded-full text-espresso-800 hover:bg-oat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </motion.span>
        ) : (
          <motion.button
            key="add"
            layout
            type="button"
            onClick={onAdd}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: EASE_SOFT }}
            aria-label={`Add ${product.name}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber text-paper shadow-[0_10px_20px_-10px_rgba(176,90,42,0.9)] transition hover:scale-105 hover:bg-[#9c4d22] active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
