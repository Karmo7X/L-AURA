"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { field, fieldLabel, primaryButton, quietButton } from "../styles";
import { deleteCategory, saveCategory, type SectionState } from "./actions";

interface Row {
  id: string;
  label: string;
  sort_order?: number;
  active?: boolean;
  count: number;
}

export function SectionsEditor({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const [addState, add, adding] = useActionState<SectionState, FormData>(saveCategory, {});
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [, startRemoving] = useTransition();

  useEffect(() => {
    if (addState.ok) router.refresh();
  }, [addState.savedAt, addState.ok, router]);

  const remove = (id: string, label: string, count: number) => {
    if (count > 0) {
      setRemoveError(`${label} still has ${count} product${count === 1 ? "" : "s"} in it — move them first.`);
      return;
    }
    setRemoveError(null);
    setRemoving(id);
    startRemoving(async () => {
      const result = await deleteCategory(id);
      setRemoving(null);
      if (result.error) setRemoveError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
      {/* add one */}
      <form action={add} className="rounded-2xl border border-espresso-800/10 bg-paper p-6 shadow-card lg:col-span-5">
        <h2 className="font-serif text-2xl text-espresso-800">Add a section</h2>
        <p className="mt-1 text-[13px] text-subtle">
          Pastries, bottles, beans to take home — whatever you want to group the menu by.
        </p>

        <label className="mt-5 grid gap-1.5">
          <span className={fieldLabel}>Name</span>
          <input name="label" maxLength={40} required placeholder="Pastries" className={field} />
        </label>
        <label className="mt-4 grid gap-1.5">
          <span className={fieldLabel}>Order</span>
          <input name="sort_order" type="number" min={0} max={9999} defaultValue={100} className={field} />
          <span className="text-[12px] text-subtle">Smaller numbers come first.</span>
        </label>
        <label className="mt-4 flex items-center gap-2 text-[15px] text-espresso-800">
          <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-[#b05a2a]" />
          Show it on the site
        </label>

        {addState.error && (
          <p role="alert" className="mt-4 rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep">
            {addState.error}
          </p>
        )}
        {addState.ok && addState.message && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 rounded-lg bg-[#7ee08a]/15 px-3 py-2 text-[13px] text-[#2f6b3a]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {addState.message}
          </p>
        )}

        <button type="submit" disabled={adding} className={cn(primaryButton, "mt-5 w-full")}>
          {adding ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Add section
        </button>
      </form>

      {/* the ones that exist */}
      <section aria-label="Menu sections" className="lg:col-span-7">
        {removeError && (
          <p role="alert" className="mb-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-amber-deep">
            {removeError}
          </p>
        )}
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-espresso-800/20 px-6 py-14 text-center text-muted">
            No sections yet — add the first one.
          </p>
        ) : (
          <ul className="grid gap-3">
            {categories.map((c) => (
              <SectionRow
                key={c.id}
                row={c}
                onRemove={() => remove(c.id, c.label, c.count)}
                removing={removing === c.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionRow({ row, onRemove, removing }: { row: Row; onRemove: () => void; removing: boolean }) {
  const router = useRouter();
  const [state, save, saving] = useActionState<SectionState, FormData>(saveCategory, {});

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.savedAt, state.ok, router]);

  return (
    <li
      className={cn(
        "rounded-2xl border bg-paper p-4 shadow-card",
        row.active ? "border-espresso-800/10" : "border-dashed border-espresso-800/20 bg-oat/40",
      )}
    >
      <form action={save} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={row.id} />
        <label className="grid min-w-[180px] flex-1 gap-1.5">
          <span className={fieldLabel}>Name</span>
          <input name="label" defaultValue={row.label} maxLength={40} required className={field} />
        </label>
        <label className="grid w-24 gap-1.5">
          <span className={fieldLabel}>Order</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            max={9999}
            defaultValue={row.sort_order ?? 100}
            className={field}
          />
        </label>
        <label className="flex h-11 items-center gap-2 text-[14px] text-espresso-800">
          <input
            type="checkbox"
            name="active"
            defaultChecked={row.active !== false}
            className="h-4 w-4 accent-[#b05a2a]"
          />
          Shown
        </label>
        <button type="submit" disabled={saving} className={quietButton}>
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Save
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${row.label}`}
          title={row.count ? "Move its products first" : "Remove"}
          className="grid h-11 w-11 place-items-center rounded-full text-subtle transition-colors hover:bg-terracotta/10 hover:text-amber-deep disabled:opacity-40"
        >
          {removing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </form>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-subtle">
        <code className="rounded bg-oat px-1.5 py-0.5 font-mono">{row.id}</code>
        {row.count} product{row.count === 1 ? "" : "s"}
        {state.error && <span className="text-amber-deep">· {state.error}</span>}
      </p>
    </li>
  );
}
