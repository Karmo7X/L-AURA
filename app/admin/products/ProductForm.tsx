"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ImagePlus, LoaderCircle } from "lucide-react";
import { productImage, STARTER_CATEGORIES, type Category, type ProductRow } from "@/lib/products";
import { saveProduct, type ProductField, type ProductFormState } from "../actions";
import { field, fieldLabel, primaryButton, quietButton } from "../styles";
import { cn } from "@/lib/cn";

/**
 * Add a product, or edit one when `product` is given. The form is submitted
 * by hand (not React's automatic form action) so a failed save keeps
 * everything — including the chosen photo — exactly as the person left it.
 */
export function ProductForm({
  product,
  categories = STARTER_CATEGORIES,
}: {
  product: ProductRow | null;
  categories?: Category[];
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="rounded-2xl border border-espresso-800/10 bg-paper p-5 shadow-card sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-espresso-800">{product ? `Edit ${product.name}` : "Add a product"}</h2>
        {product && (
          <Link href="/admin/products" className="text-sm font-semibold text-amber-deep hover:underline">
            Cancel
          </Link>
        )}
      </div>

      {state.ok && state.message && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#7ee08a]/15 px-3 py-2 text-[13px] text-[#2f6b3a]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
      {!state.ok && state.message && (
        <p role="alert" className="mt-4 rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep">
          {state.message}
        </p>
      )}

      {/* re-mounted after each successful add, which clears it for the next one */}
      <Fields
        key={`${product?.id ?? "new"}-${state.savedAt ?? 0}`}
        product={product}
        errors={state.errors ?? {}}
        categories={categories}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={cn(primaryButton, "min-w-[150px]")}>
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
        {product && (
          <Link href="/admin/products" className={quietButton}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

/**
 * An image picker with a live preview. `transparent` shows the preview on a
 * checkerboard, so a cut-out's transparency is visible before saving.
 */
function PhotoPicker({
  name,
  current,
  accept,
  title,
  hint,
  error,
  transparent = false,
}: {
  name: ProductField;
  current: string | null;
  accept: string;
  title: [string, string, string]; // [nothing yet, replace, new chosen]
  hint: string;
  error?: string;
  transparent?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  // free the preview's memory when it's replaced or the form goes away
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <>
      <label
        className={cn(
          "group relative flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-espresso-800/20 bg-linen p-3 transition-colors hover:border-terracotta hover:bg-paper",
          error && "border-terracotta bg-terracotta/5",
        )}
      >
        <span
          className={cn(
            "relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg",
            transparent
              ? "bg-[repeating-conic-gradient(#e5e2dc_0%_25%,#fcfaf7_0%_50%)] bg-[length:14px_14px]"
              : "bg-oat",
          )}
        >
          {preview ? (
            // a local blob: next/image can't optimise it, and doesn't need to
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className={cn("h-full w-full", transparent ? "object-contain" : "object-cover")}
            />
          ) : current ? (
            <Image src={current} alt="" fill sizes="80px" className={transparent ? "object-contain" : "object-cover"} />
          ) : (
            <ImagePlus className="h-6 w-6 text-subtle" aria-hidden />
          )}
        </span>
        <span className="min-w-0 text-[13px] leading-5">
          <span className="block font-semibold text-espresso-800">
            {preview ? title[2] : current ? title[1] : title[0]}
          </span>
          <span className="block text-subtle">{hint}</span>
        </span>
        <input
          name={name}
          type="file"
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          {...(error ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {})}
        />
      </label>
      {error && (
        <span id={`${name}-error`} className="text-[12px] text-amber-deep">
          {error}
        </span>
      )}
    </>
  );
}

function Fields({
  product,
  errors,
  categories,
}: {
  product: ProductRow | null;
  errors: Partial<Record<ProductField, string>>;
  categories: Category[];
}) {
  const [descLength, setDescLength] = useState(product?.description?.length ?? 0);
  const current = product ? productImage(product) : null;

  const err = (name: ProductField) =>
    errors[name] ? (
      <span id={`${name}-error`} className="text-[12px] text-amber-deep">
        {errors[name]}
      </span>
    ) : null;
  const invalid = (name: ProductField) =>
    errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <div className="mt-5 grid gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Name</span>
          <input
            name="name"
            required
            maxLength={60}
            defaultValue={product?.name}
            placeholder="Hazelnut Latte"
            className={field}
            {...invalid("name")}
          />
          {err("name")}
        </label>
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Price</span>
          <span className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle">$</span>
            <input
              name="price"
              required
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="999.99"
              defaultValue={product ? Number(product.price).toFixed(2) : undefined}
              placeholder="4.50"
              className={cn(field, "pl-7 tabular-nums")}
              {...invalid("price")}
            />
          </span>
          {err("price")}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Section</span>
          <select
            name="category"
            defaultValue={product?.category ?? categories[0]?.id ?? "hot"}
            className={field}
            {...invalid("category")}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {err("category")}
        </label>
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Origin or tagline</span>
          <input
            name="origin"
            maxLength={60}
            defaultValue={product?.origin ?? ""}
            placeholder="Huila · Colombia"
            className={field}
            {...invalid("origin")}
          />
          {err("origin")}
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="flex items-baseline justify-between">
          <span className={fieldLabel}>Description</span>
          <span className="text-[11px] text-subtle tabular-nums">{descLength}/240</span>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={240}
          defaultValue={product?.description ?? ""}
          onInput={(e) => setDescLength(e.currentTarget.value.length)}
          placeholder="Toasted hazelnut, steamed milk, a double shot."
          className={cn(field, "resize-none")}
          {...invalid("description")}
        />
        {err("description")}
      </label>

      <div className="grid gap-1.5">
        <span className={fieldLabel}>Photo</span>
        <PhotoPicker
          name="image"
          current={current}
          accept="image/png,image/jpeg,image/webp,image/avif"
          title={["Add a photo", "Replace the photo", "New photo chosen"]}
          hint="PNG, JPG, WebP or AVIF, up to 5 MB. Square or portrait looks best."
          error={errors.image}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Accent colour</span>
          <span className="flex items-center gap-3">
            <input
              name="accent"
              type="color"
              defaultValue={product?.accent ?? "#8a4526"}
              className="h-11 w-14 cursor-pointer rounded-lg border border-espresso-800/15 bg-linen p-1"
              {...invalid("accent")}
            />
            <span className="text-[12px] leading-4 text-subtle">Used for the price and card glow.</span>
          </span>
          {err("accent")}
        </label>
        <label className="grid gap-1.5">
          <span className={fieldLabel}>Position</span>
          <input
            name="sort_order"
            type="number"
            min="0"
            max="9999"
            step="1"
            defaultValue={product?.sort_order ?? 100}
            className={cn(field, "tabular-nums")}
            {...invalid("sort_order")}
          />
          <span className="text-[12px] text-subtle">Lower numbers come first on the menu.</span>
          {err("sort_order")}
        </label>
      </div>

      <fieldset className="grid gap-2.5 rounded-xl bg-linen p-3.5">
        <legend className="sr-only">Visibility</legend>
        <label className="flex items-start gap-3 text-[14px]">
          <input
            name="active"
            type="checkbox"
            defaultChecked={product?.active ?? true}
            className="mt-0.5 h-4 w-4 accent-amber"
          />
          <span>
            <span className="font-semibold text-espresso-800">On the menu</span>
            <span className="block text-[12px] text-subtle">Customers can see and order it.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-[14px]">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={product?.featured ?? false}
            className="mt-0.5 h-4 w-4 accent-amber"
          />
          <span>
            <span className="font-semibold text-espresso-800">Feature it</span>
            <span className="block text-[12px] text-subtle">Shows in the leaning cards near the top (up to four).</span>
          </span>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-espresso-800/10 p-4">
        <legend className="label-caps px-1 text-amber-deep">Hero slider</legend>
        <label className="flex items-start gap-3 text-[14px]">
          <input
            name="in_hero"
            type="checkbox"
            defaultChecked={product?.in_hero ?? false}
            className="mt-0.5 h-4 w-4 accent-amber"
          />
          <span>
            <span className="font-semibold text-espresso-800">Show in the hero slider</span>
            <span className="block text-[12px] text-subtle">
              The big scrolling slider at the top of the site — while the product is on the menu.
            </span>
          </span>
        </label>

        <div className="grid gap-1.5">
          <span className={fieldLabel}>Cut-out image</span>
          <PhotoPicker
            name="hero_image"
            current={product?.hero_image_url ?? null}
            accept="image/png,image/webp,image/avif"
            title={["Add a cut-out", "Replace the cut-out", "New cut-out chosen"]}
            hint="The drink on a transparent background (PNG or WebP) floats in the slider. Without one, the photo is shown in a frame."
            error={errors.hero_image}
            transparent
          />
          {product?.hero_image_url && (
            <label className="flex items-center gap-2 text-[13px] text-muted">
              <input name="remove_hero_image" type="checkbox" className="h-3.5 w-3.5 accent-amber" />
              Remove the cut-out (use the framed photo instead)
            </label>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Tagline</span>
            <input
              name="kicker"
              maxLength={40}
              defaultValue={product?.kicker ?? ""}
              placeholder="Pure · Intense"
              className={field}
              {...invalid("kicker")}
            />
            {err("kicker")}
          </label>
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Strength</span>
            <select name="strength" defaultValue={product?.strength ?? ""} className={field} {...invalid("strength")}>
              <option value="">Don’t show</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"●".repeat(n)}
                  {"○".repeat(5 - n)} ({n})
                </option>
              ))}
            </select>
            {err("strength")}
          </label>
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Milk</span>
            <input
              name="milk"
              maxLength={30}
              defaultValue={product?.milk ?? ""}
              placeholder="Steamed"
              className={field}
              {...invalid("milk")}
            />
            {err("milk")}
          </label>
          <label className="grid gap-1.5">
            <span className={fieldLabel}>Size</span>
            <input
              name="size"
              maxLength={20}
              defaultValue={product?.size ?? ""}
              placeholder="12 oz"
              className={field}
              {...invalid("size")}
            />
            {err("size")}
          </label>
        </div>
      </fieldset>
    </div>
  );
}
