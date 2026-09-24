"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, GalleryHorizontalEnd, LoaderCircle, Pencil, Star, Trash2 } from "lucide-react";
import { deleteProduct, setProductFlag } from "../actions";
import { cn } from "@/lib/cn";

const iconButton =
  "grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-oat hover:text-espresso-800 disabled:opacity-40";

/** Edit, hero, feature, show/hide and delete for one product in the list. */
export function ProductRowActions({
  id,
  name,
  active,
  featured,
  inHero,
}: {
  id: string;
  name: string;
  active: boolean;
  featured: boolean;
  inHero: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (task: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      setError(null);
      const result = await task();
      if (!result.ok) setError(result.message ?? "That didn’t work — try again.");
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-0.5">
        {pending && <LoaderCircle className="mr-1 h-4 w-4 animate-spin text-subtle" aria-label="Saving" />}
        <Link
          href={`/admin/products?edit=${encodeURIComponent(id)}`}
          className={iconButton}
          aria-label={`Edit ${name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setProductFlag(id, "in_hero", !inHero))}
          className={cn(iconButton, inHero && "text-terracotta hover:text-terracotta")}
          aria-pressed={inHero}
          aria-label={inHero ? `Take ${name} out of the hero slider` : `Put ${name} in the hero slider`}
          title={inHero ? "In the hero slider — click to remove" : "Put in the hero slider"}
        >
          <GalleryHorizontalEnd className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setProductFlag(id, "featured", !featured))}
          className={cn(iconButton, featured && "text-gold hover:text-gold")}
          aria-pressed={featured}
          aria-label={featured ? `Stop featuring ${name}` : `Feature ${name}`}
          title={featured ? "Featured — click to unfeature" : "Feature in the cards"}
        >
          <Star className="h-4 w-4" fill={featured ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setProductFlag(id, "active", !active))}
          className={iconButton}
          aria-label={active ? `Hide ${name} from the menu` : `Put ${name} back on the menu`}
          title={active ? "Hide from the menu" : "Put back on the menu"}
        >
          {active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete ${name}? This can’t be undone.`)) run(() => deleteProduct(id));
          }}
          className={cn(iconButton, "hover:bg-terracotta/10 hover:text-amber-deep")}
          aria-label={`Delete ${name}`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="max-w-[260px] text-right text-[12px] leading-4 text-amber-deep">
          {error}
        </p>
      )}
    </div>
  );
}
