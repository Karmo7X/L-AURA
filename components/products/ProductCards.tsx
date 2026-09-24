"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { categoryLabel, STARTER_CATEGORIES, type Category, type MenuProduct } from "@/lib/products";
import { CupLogo } from "@/components/ui/icons";
import { formatPrice, useCafe } from "@/lib/store";
import { EASE_SOFT } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { MenuContent } from "@/lib/content";

const MAX_LEAN = 13; // degrees

function ProductCard({ product, index, categories }: { product: MenuProduct; index: number; categories: Category[] }) {
  const card = useRef<HTMLDivElement>(null);
  const addToCart = useCafe((s) => s.addToCart);
  const showToast = useCafe((s) => s.showToast);

  // Where the pointer sits relative to this card's centre, −1…1.
  const towardX = useMotionValue(0);
  const towardY = useMotionValue(0);
  const near = useMotionValue(0);

  const springs = { stiffness: 150, damping: 18, mass: 0.6 };
  const leanY = useSpring(
    useTransform(towardX, (v) => v * MAX_LEAN),
    springs,
  );
  const leanX = useSpring(
    useTransform(towardY, (v) => -v * MAX_LEAN),
    springs,
  );
  const lift = useSpring(
    useTransform(near, (v) => v * -14),
    springs,
  );
  const glare = useSpring(near, springs);
  const glareX = useSpring(
    useTransform(towardX, (v) => 50 + v * 46),
    springs,
  );
  const glareY = useSpring(
    useTransform(towardY, (v) => 50 + v * 46),
    springs,
  );
  const shine = useTransform(
    [glareX, glareY, glare],
    ([x, y, strength]: number[]) =>
      `radial-gradient(52% 52% at ${x}% ${y}%, rgba(255,240,224,${0.42 * strength}) 0%, rgba(255,226,198,${
        0.14 * strength
      }) 38%, transparent 72%)`,
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = card.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalise by a reach a bit larger than the card, so cards start
      // leaning before the pointer actually arrives.
      const reachX = rect.width * 1.5;
      const reachY = rect.height * 1.1;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / reachX));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / reachY));
      const distance = Math.hypot(dx, dy);
      towardX.set(dx);
      towardY.set(dy);
      near.set(Math.max(0, 1 - distance * 1.15));
    };
    const onLeave = () => {
      towardX.set(0);
      towardY.set(0);
      near.set(0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [towardX, towardY, near]);

  return (
    <motion.li
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE_SOFT, delay: index * 0.08 }}
      style={{ perspective: 1000 }}
    >
      <motion.article
        ref={card}
        style={{ rotateX: leanX, rotateY: leanY, y: lift, transformStyle: "preserve-3d" }}
        className="group relative flex h-full flex-col rounded-2xl border border-espresso-800/[0.07] bg-paper p-4 shadow-card transition-shadow duration-500 hover:shadow-card-hover sm:p-5"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-oat">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 88vw"
              className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.06]"
            />
          ) : (
            // no photo yet: a warm plate in the product's own colour
            <div
              className="absolute inset-0 grid place-items-center"
              style={{
                background: `radial-gradient(80% 70% at 50% 40%, ${product.accent}33, ${product.accent}10 60%, transparent)`,
              }}
            >
              <CupLogo className="h-20 w-20 opacity-70" style={{ color: product.accent }} />
            </div>
          )}
          <motion.span aria-hidden style={{ background: shine }} className="pointer-events-none absolute inset-0" />
          <span className="label-caps absolute top-3 left-3 rounded-full bg-espresso-900/75 px-2.5 py-1 text-[10px] text-paper backdrop-blur-sm">
            {product.origin || categoryLabel(product.category, categories)}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-1 pt-5" style={{ transform: "translateZ(24px)" }}>
          <h3 className="font-serif text-[26px] leading-8 font-semibold text-espresso-800">{product.name}</h3>
          <p className="mt-1.5 text-[14px] leading-[22px] text-subtle">{product.note}</p>
          <div className="mt-auto flex items-center justify-between pt-5">
            <span className="text-lg font-bold" style={{ color: product.accent }}>
              {formatPrice(product.price)}
            </span>
            <button
              type="button"
              onClick={() => {
                addToCart({
                  key: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image ?? undefined,
                });
                showToast(`${product.name} added — check the printer`);
              }}
              aria-label={`Add ${product.name} to your order`}
              className="grid h-10 w-10 place-items-center rounded-full bg-amber text-paper shadow-[0_8px_18px_-8px_rgba(176,90,42,0.9)] transition duration-300 ease-spring hover:scale-115 hover:bg-[#9c4d22] active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four"];

/** The featured products — the cafe picks which ones in /admin/products. */
export function ProductCards({
  products,
  content,
  categories = STARTER_CATEGORIES,
}: {
  products: MenuProduct[];
  content: MenuContent;
  categories?: Category[];
}) {
  // the cafe can write their own heading; left empty we count the cards
  const title =
    content.title ||
    `${COUNT_WORDS[products.length] ?? products.length} way${products.length === 1 ? "" : "s"} to drink it`;

  return (
    <section
      id="coffee"
      aria-labelledby="coffee-title"
      className="linen-pattern relative overflow-hidden border-y border-espresso-800/8 py-24 lg:py-32"
    >
      <div className="container-page relative">
        <SectionHeading
          id="coffee-title"
          eyebrow={content.eyebrow}
          title={title}
          divider
          description={content.description}
        />
        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} categories={categories} />
          ))}
        </ul>
      </div>
    </section>
  );
}
