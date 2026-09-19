"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { GALLERY } from "@/lib/data";
import { cn, EASE_SOFT } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Gallery() {
  return (
    <section id="gallery" aria-labelledby="gallery-title" className="bg-linen py-24 lg:py-32">
      <div className="container-page">
        <SectionHeading
          id="gallery-title"
          eyebrow="Gallery"
          title="Moments at L’AURA"
          description="Morning light, the hiss of the steam wand, and pastries still warm from the oven."
        />
        <ul className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] lg:auto-rows-[230px] lg:grid-cols-4 lg:gap-4">
          {GALLERY.map((photo, i) => (
            <motion.li
              key={photo.caption}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, ease: EASE_SOFT, delay: i * 0.07 }}
              className={cn("group relative overflow-hidden rounded-2xl bg-oat", photo.span)}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-espresso-900/70 via-espresso-900/0 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
              <p className="absolute bottom-4 left-4 translate-y-1 font-serif text-lg text-linen transition-transform duration-500 ease-soft group-hover:translate-y-0 lg:text-xl">
                {photo.caption}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
