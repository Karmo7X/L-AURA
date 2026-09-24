"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import type { HomeContent, HomeSection } from "@/lib/content";
import { cn } from "@/lib/cn";
import { field, fieldLabel, primaryButton } from "../styles";
import { saveHomeSection, type HomeState } from "./actions";

/** 7.5 → "07:30", for the time inputs. */
const clock = (v: number) =>
  `${String(Math.floor(v)).padStart(2, "0")}:${String(Math.round((v % 1) * 60)).padStart(2, "0")}`;

export function HomeEditor({ content }: { content: HomeContent }) {
  return (
    <div className="mt-8 grid gap-8">
      <Block section="menu" title="Menu heading" hint="The line above the four cards on the home page.">
        <Text name="eyebrow" label="Eyebrow" value={content.menu.eyebrow} max={40} />
        <Text
          name="title"
          label="Title"
          value={content.menu.title}
          max={80}
          hint="Leave empty to count the cards — “Four ways to drink it”."
        />
        <Area name="description" label="Description" value={content.menu.description} max={300} />
      </Block>

      <Block
        section="day"
        title="A Day at L’AURA"
        hint="The three tempos of the day, and the sun that rides over them."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="eyebrow" label="Eyebrow" value={content.day.eyebrow} max={40} />
          <Text name="title" label="Title" value={content.day.title} max={60} />
          <Text name="italic" label="Second line (italic)" value={content.day.italic} max={60} />
        </div>
        <Area name="intro" label="Intro" value={content.day.intro} max={400} />

        {content.day.cadences.map((c, i) => (
          <Fieldset key={c.id} legend={`Cadence ${i + 1}`}>
            <div className="grid gap-4 sm:grid-cols-4">
              <Text name={`cadence.${i}.from`} label="From" value={clock(c.from)} type="time" />
              <Text name={`cadence.${i}.to`} label="To" value={clock(c.to)} type="time" />
              <Text name={`cadence.${i}.glyph`} label="Glyph" value={c.glyph} max={4} />
              <Text name={`cadence.${i}.mood`} label="Mood" value={c.mood} max={60} />
            </div>
            <Text name={`cadence.${i}.title`} label="Title" value={c.title} max={80} />
            <Area name={`cadence.${i}.copy`} label="Card text" value={c.copy} max={400} />
            <Area name={`cadence.${i}.quote`} label="Quote in the panel" value={c.quote} max={400} />
            <Text name={`cadence.${i}.tags`} label="On the bar (comma separated)" value={c.tags.join(", ")} max={200} />
          </Fieldset>
        ))}
      </Block>

      <Block
        section="space"
        title="The Space"
        hint="The photograph of the room, the markers on it, and the three zone cards."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="eyebrow" label="Eyebrow" value={content.space.eyebrow} max={40} />
          <Text name="title" label="Title" value={content.space.title} max={80} />
        </div>
        <Area name="description" label="Description" value={content.space.description} max={400} />
        <Picture name="photo" label="Photograph of the room" value={content.space.photo} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="captionKicker" label="Caption kicker" value={content.space.captionKicker} max={60} />
          <Text name="captionTitle" label="Caption" value={content.space.captionTitle} max={80} />
        </div>

        {content.space.zones.map((z, i) => (
          <Fieldset key={z.id} legend={`Zone ${z.n}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Text name={`zone.${i}.eyebrow`} label="Eyebrow" value={z.eyebrow} max={40} />
              <Text name={`zone.${i}.title`} label="Title" value={z.title} max={60} />
            </div>
            <Area name={`zone.${i}.copy`} label="Text" value={z.copy} max={400} />
            <div className="grid gap-4 sm:grid-cols-4">
              <Text name={`zone.${i}.meta`} label="Footnote" value={z.meta} max={60} />
              <Text name={`zone.${i}.pin`} label="Marker label" value={z.pin} max={40} />
              <Text name={`zone.${i}.x`} label="Marker across (%)" value={String(z.x)} type="number" />
              <Text name={`zone.${i}.y`} label="Marker down (%)" value={String(z.y)} type="number" />
            </div>
          </Fieldset>
        ))}

        <Fieldset legend="Materials">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => {
              const m = content.space.materials[i];
              return (
                <div key={i} className="flex items-end gap-2">
                  <label className="grid flex-1 gap-1.5">
                    <span className={fieldLabel}>Material {i + 1}</span>
                    <input
                      name={`material.${i}.label`}
                      defaultValue={m?.label ?? ""}
                      maxLength={40}
                      className={field}
                    />
                  </label>
                  <input
                    type="color"
                    name={`material.${i}.swatch`}
                    defaultValue={m?.swatch ?? "#d7ba97"}
                    aria-label={`Colour for material ${i + 1}`}
                    className="h-11 w-12 cursor-pointer rounded-lg border border-espresso-800/15 bg-linen p-1"
                  />
                </div>
              );
            })}
          </div>
        </Fieldset>
      </Block>

      <Block section="bar" title="The Barista Table" hint="The counter photo and today's chalkboard.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="eyebrow" label="Eyebrow" value={content.bar.eyebrow} max={40} />
          <Text name="title" label="Title" value={content.bar.title} max={80} />
        </div>
        <Area name="description" label="Description" value={content.bar.description} max={400} />
        <Picture name="photo" label="Photograph of the counter" value={content.bar.photo} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="shift" label="Who’s on shift" value={content.bar.shift} max={60} />
          <Text name="pour" label="What’s on pour" value={content.bar.pour} max={60} />
        </div>

        <Fieldset legend="Today’s chalkboard">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="board.origin" label="Featured origin" value={content.bar.board.origin} max={80} />
            <Text name="board.grade" label="Grade" value={content.bar.board.grade} max={40} />
            <Text name="board.accents" label="Tasting accents" value={content.bar.board.accents} max={80} />
            <Text name="board.ambient" label="Bar ambient" value={content.bar.board.ambient} max={80} />
          </div>
          <Area name="board.quote" label="Barista’s note" value={content.bar.board.quote} max={400} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="board.barista" label="Signed" value={content.bar.board.barista} max={80} />
            <Text name="board.calibrated" label="Calibrated stamp" value={content.bar.board.calibrated} max={40} />
          </div>
        </Fieldset>
      </Block>
    </div>
  );
}

/** One saveable part of the page. */
function Block({
  section,
  title,
  hint,
  children,
}: {
  section: HomeSection;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, save, saving] = useActionState<HomeState, FormData>(saveHomeSection, {});

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.savedAt, state.ok, router]);

  return (
    <form action={save} className="rounded-2xl border border-espresso-800/10 bg-paper p-6 shadow-card sm:p-8">
      <input type="hidden" name="section" value={section} />
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-espresso-800/8 pb-5">
        <div>
          <h2 className="font-serif text-2xl text-espresso-800">{title}</h2>
          <p className="mt-1 text-[13px] text-subtle">{hint}</p>
        </div>
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Save
        </button>
      </div>

      <div className="mt-6 grid gap-5">{children}</div>

      {(state.error || state.message) && (
        <p
          role={state.error ? "alert" : "status"}
          className={cn(
            "mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]",
            state.error ? "bg-terracotta/10 text-amber-deep" : "bg-[#7ee08a]/15 text-[#2f6b3a]",
          )}
        >
          {!state.error && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />}
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-espresso-800/10 p-4 sm:p-5">
      <legend className="label-caps px-2 text-amber-deep">{legend}</legend>
      <div className="grid gap-4">{children}</div>
    </fieldset>
  );
}

function Text({
  name,
  label,
  value,
  max,
  type = "text",
  step,
  hint,
}: {
  name: string;
  label: string;
  value: string;
  max?: number;
  type?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={fieldLabel}>{label}</span>
      <input name={name} defaultValue={value} maxLength={max} type={type} step={step} className={field} />
      {hint && <span className="text-[12px] text-subtle">{hint}</span>}
    </label>
  );
}

function Area({ name, label, value, max }: { name: string; label: string; value: string; max: number }) {
  return (
    <label className="grid gap-1.5">
      <span className={fieldLabel}>{label}</span>
      <textarea name={name} defaultValue={value} maxLength={max} rows={3} className={cn(field, "resize-y")} />
    </label>
  );
}

function Picture({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <span className={fieldLabel}>{label}</span>
      <input type="hidden" name={`${name}_url`} value={value} />
      <div className="flex flex-wrap items-center gap-4">
        {value && (
          <Image
            src={value}
            alt=""
            width={160}
            height={96}
            className="h-24 w-40 rounded-xl border border-espresso-800/10 object-cover"
          />
        )}
        <input
          type="file"
          name={name}
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="text-[13px] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-oat file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-espresso-800"
        />
      </div>
      <span className="text-[12px] text-subtle">Up to 5 MB. Leave it empty to keep the picture that’s there.</span>
    </div>
  );
}
