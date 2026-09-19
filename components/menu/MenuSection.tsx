"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { MENU_FILTERS, MENU_ITEMS, type MenuItem } from "@/lib/data";
import { formatPrice, useCafe } from "@/lib/store";
import { cn } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Filter = (typeof MENU_FILTERS)[number]["id"];

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const addToCart = useCafe((s) => s.addToCart);
  const showToast = useCafe((s) => s.showToast);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 220, damping: 28, delay: Math.min(index, 6) * 0.04 }}
    >
      <article className="group flex h-full flex-col rounded-2xl border border-espresso-800/[0.06] bg-paper p-4 shadow-card transition-[transform,box-shadow] duration-500 ease-soft hover:-translate-y-2 hover:shadow-card-hover sm:p-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-oat">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 92vw"
            className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.07]"
          />
          <span className="label-caps absolute top-3 left-3 rounded-full bg-espresso-800/80 px-2.5 py-1 text-[10px] text-paper backdrop-blur-sm">
            {item.tag}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-1 pt-5">
          <h3 className="font-serif text-2xl leading-8 font-semibold text-espresso-800">{item.name}</h3>
          <p className="mt-1.5 text-[14px] leading-[22px] text-subtle">{item.description}</p>
          <div className="mt-auto flex items-center justify-between pt-5">
            <span className="label-caps text-subtle/80">{item.meta}</span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-amber-deep">{formatPrice(item.price)}</span>
              <button
                type="button"
                onClick={() => {
                  addToCart({ key: item.id, name: item.name, price: item.price, image: item.image });
                  showToast(`${item.name} added to your order`);
                }}
                aria-label={`Add ${item.name} to order`}
                className="grid h-10 w-10 place-items-center rounded-full bg-amber text-paper shadow-[0_8px_18px_-8px_rgba(176,90,42,0.9)] transition duration-300 ease-spring hover:scale-115 hover:bg-[#9c4d22] active:scale-95"
              >
                <Plus className="h-5 w-5" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

export function MenuSection() {
  const [filter, setFilter] = useState<Filter>("all");
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const patternY = useTransform(scrollYProgress, [0, 1], ["0px", "-180px"]);

  const items = filter === "all" ? MENU_ITEMS : MENU_ITEMS.filter((item) => item.category === filter);

  return (
    <section
      ref={section}
      id="menu"
      aria-labelledby="menu-title"
      className="relative isolate overflow-hidden bg-parchment py-24 lg:py-32"
    >
      <motion.div
        aria-hidden
        style={{ backgroundPositionY: patternY }}
        className="bean-pattern pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
      />
      <div className="container-page">
        <SectionHeading
          id="menu-title"
          eyebrow="Our Artisanal Offerings"
          title="Our Menu"
          divider
          description="Crafted with passion, extracted with uncompromising precision."
        />

        <div
          role="tablist"
          aria-label="Filter menu"
          className="no-scrollbar mx-auto mt-10 mb-12 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-espresso-800/10 bg-paper/80 p-1.5 shadow-card backdrop-blur"
        >
          {MENU_FILTERS.map((f) => {
            const selected = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300",
                  selected ? "text-paper" : "text-muted hover:text-espresso-800",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="menu-filter-pill"
                    className="absolute inset-0 rounded-full bg-espresso-800"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </div>

        <motion.ul layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}
