"use client";

import { motion } from "motion/react";
import { cn, EASE_SOFT } from "@/lib/cn";
import { BeanIcon } from "./icons";

export function BeanDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-12 bg-linear-to-r from-transparent to-terracotta/60" />
      <BeanIcon className="h-5 w-5 -rotate-12 text-terracotta" />
      <span className="h-px w-12 bg-linear-to-l from-transparent to-terracotta/60" />
    </div>
  );
}

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  divider?: boolean;
  tone?: "light" | "dark";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  divider = false,
  tone = "light",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, ease: EASE_SOFT }}
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "items-start",
        className,
      )}
    >
      <span className={cn("label-caps", dark ? "text-peach" : "text-amber-deep")}>{eyebrow}</span>
      <h2
        id={id}
        className={cn(
          "font-serif text-[32px] leading-10 font-medium tracking-[-0.01em] text-balance lg:text-[48px] lg:leading-[56px] lg:tracking-[-0.015em]",
          dark ? "text-linen" : "text-espresso-800",
        )}
      >
        {title}
      </h2>
      {divider && <BeanDivider className="my-1" />}
      {description && (
        <p className={cn("max-w-xl text-[15px] leading-6 text-pretty", dark ? "text-latte" : "text-muted")}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
