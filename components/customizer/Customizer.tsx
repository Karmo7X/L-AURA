"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { Check, Plus, ShoppingBag, X } from "lucide-react";
import { BASE_DRINK, INGREDIENTS, type Ingredient } from "@/lib/data";
import { customTotal, formatPrice, useCafe } from "@/lib/store";
import { cn, EASE_SOFT } from "@/lib/cn";
import { IngredientIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FallbackCup } from "@/components/hero/FallbackCup";

function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 140, damping: 22 });
  const text = useTransform(spring, (v) => formatPrice(v));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return (
    <motion.span className={className} aria-live="polite">
      {text}
    </motion.span>
  );
}

function IngredientCard({ ingredient, active, onToggle }: { ingredient: Ingredient; active: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex w-[72%] shrink-0 snap-start items-start gap-3.5 rounded-xl border p-4 text-left transition-[border-color,box-shadow,background-color] duration-300 ease-soft sm:h-full sm:w-full",
        active
          ? "border-terracotta/70 bg-[#fff7f1] shadow-glow"
          : "border-espresso-800/10 bg-paper hover:border-terracotta/45 hover:shadow-[0_0_0_1px_rgba(200,109,81,0.2),0_14px_30px_-14px_rgba(200,109,81,0.55)]",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors duration-300",
          active ? "bg-terracotta text-paper" : "bg-oat text-espresso-800 group-hover:bg-[#f6e3d9]",
        )}
      >
        <IngredientIcon id={ingredient.id} className="h-5.5 w-5.5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] leading-6 font-semibold text-espresso-800">{ingredient.name}</span>
        <span className="text-[13px] leading-5 text-muted">{ingredient.description}</span>
        <span className="label-caps mt-2 text-amber-deep">+{formatPrice(ingredient.price)}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-300 ease-spring",
          active ? "scale-100 bg-amber text-paper" : "bg-oat text-subtle group-hover:scale-110",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={active ? "check" : "plus"}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ duration: 0.18 }}
          >
            {active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

const PROFILE_LABELS = ["Body", "Sweetness", "Intensity"];

function FlavorProfile() {
  const selected = useCafe((s) => s.selected);
  const values = BASE_DRINK.profile.map((base, i) =>
    Math.min(1, Math.max(0.05, selected.reduce((v, id) => v + (INGREDIENTS.find((x) => x.id === id)?.profile[i] ?? 0), base))),
  );

  return (
    <div className="rounded-xl border border-espresso-800/10 bg-paper/70 p-5">
      <p className="label-caps text-amber-deep">Flavor Profile</p>
      <dl className="mt-4 grid gap-3.5">
        {PROFILE_LABELS.map((label, i) => (
          <div key={label} className="grid grid-cols-[88px_1fr] items-center gap-4">
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="h-1.5 overflow-hidden rounded-full bg-oat-deep">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-gold to-terracotta"
                initial={false}
                animate={{ width: `${values[i] * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
              <span className="sr-only">{Math.round(values[i] * 100)}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Customizer() {
  const selected = useCafe((s) => s.selected);
  const toggle = useCafe((s) => s.toggleIngredient);
  const remove = useCafe((s) => s.removeIngredient);
  const addToCart = useCafe((s) => s.addToCart);
  const showToast = useCafe((s) => s.showToast);
  const webgl = useCafe((s) => s.webgl);

  const total = customTotal(selected);
  const chosen = INGREDIENTS.filter((i) => selected.includes(i.id));

  const addCustom = () => {
    const key = `custom:${[...selected].sort().join("+") || "plain"}`;
    addToCart({
      key,
      name: "Your Signature Cup",
      detail: chosen.length ? chosen.map((i) => i.name).join(", ") : BASE_DRINK.name,
      price: total,
    });
    showToast("Your signature cup was added to the order");
  };

  return (
    <section id="customize" aria-labelledby="customize-title" className="relative scroll-mt-10 pt-24 pb-24 lg:pt-32 lg:pb-32">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="customize-title"
            align="left"
            eyebrow="Craft Your Cup"
            title="Sculpt Your Signature Cup"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE_SOFT, delay: 0.1 }}
            className="max-w-md text-[15px] leading-6 text-muted"
          >
            Start with our house double espresso, then layer in milks, drizzles and dustings. Watch your cup change as
            you build it.
          </motion.p>
        </div>

        <div data-cup-grid className="mt-12 grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Showcase card — the 3D cup settles onto the pedestal here */}
          <div data-cup-card className="lg:sticky lg:top-24 lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-espresso-800/[0.08] bg-paper p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between">
                <span className="label-caps text-amber-deep">Your Creation</span>
                <span className="label-caps rounded-full bg-oat px-3 py-1 text-[10px] text-espresso-800">
                  Base · {BASE_DRINK.name}
                </span>
              </div>

              <div className="relative mt-2 h-[300px] sm:h-[340px]">
                {/* soft backdrop + blurred bokeh to push focus onto the cup */}
                <div aria-hidden className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,#f6e7da_0%,rgba(252,250,247,0)_70%)]" />
                  <div className="absolute top-[12%] left-[8%] h-16 w-16 rounded-full bg-gold/25 blur-2xl" />
                  <div className="absolute top-[20%] right-[10%] h-20 w-20 rounded-full bg-terracotta/15 blur-2xl" />
                </div>
                <div
                  aria-hidden
                  className="wood-grain absolute inset-x-[10%] bottom-[5%] h-[20%] rounded-[50%] shadow-[inset_0_-8px_14px_rgba(0,0,0,0.35),0_22px_30px_-14px_rgba(43,26,18,0.5)]"
                />
                <div data-cup-anchor="showcase" className="absolute inset-x-2 top-[2%] bottom-[13%]" />
                {webgl === "failed" && (
                  <div className="absolute inset-0 grid place-items-center pb-8">
                    <FallbackCup className="h-[70%] w-auto" />
                  </div>
                )}
              </div>

              <div className="mt-2">
                <p className="label-caps text-subtle">Selected</p>
                <ul className="mt-2 flex min-h-8 flex-wrap gap-1.5" aria-live="polite">
                  <AnimatePresence initial={false} mode="popLayout">
                    {chosen.length === 0 && (
                      <motion.li
                        key="empty"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-1 text-[13px] text-subtle"
                      >
                        Pure double espresso — add something below.
                      </motion.li>
                    )}
                    {chosen.map((ingredient) => (
                      <motion.li
                        key={ingredient.id}
                        layout
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                        className="inline-flex items-center gap-1 rounded-full bg-oat py-1 pr-1 pl-3 text-[13px] font-medium text-espresso-800"
                      >
                        {ingredient.name}
                        <button
                          type="button"
                          onClick={() => remove(ingredient.id)}
                          aria-label={`Remove ${ingredient.name}`}
                          className="grid h-6 w-6 place-items-center rounded-full text-subtle transition-colors hover:bg-espresso-800/10 hover:text-espresso-800"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4 border-t border-espresso-800/10 pt-5">
                <div className="flex flex-col">
                  <span className="label-caps text-subtle">Your Total</span>
                  <AnimatedPrice value={total} className="font-serif text-[32px] leading-10 text-espresso-800" />
                  <span className="text-xs text-subtle">
                    {formatPrice(BASE_DRINK.price)} base
                    {chosen.length > 0 && ` + ${chosen.length} extra${chosen.length > 1 ? "s" : ""}`}
                  </span>
                </div>
                <motion.button
                  type="button"
                  onClick={addCustom}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition-colors hover:bg-[#9c4d22]"
                >
                  Add to Order
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Ingredient picker */}
          <div className="lg:col-span-7">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-espresso-800">Choose Your Ingredients</h3>
              <span className="text-[13px] text-subtle">
                <span className="sm:hidden">Swipe · tap to add</span>
                <span className="hidden sm:inline">Tap to add or remove</span>
              </span>
            </div>
            <div className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
              {INGREDIENTS.map((ingredient, i) => (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: EASE_SOFT, delay: i * 0.05 }}
                  className="contents sm:block"
                >
                  <IngredientCard
                    ingredient={ingredient}
                    active={selected.includes(ingredient.id)}
                    onToggle={() => toggle(ingredient.id)}
                  />
                </motion.div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-subtle">Choose one milk — dairy and oat swap automatically.</p>
            <div className="mt-6">
              <FlavorProfile />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
