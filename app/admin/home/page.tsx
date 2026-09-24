import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { mergeHome } from "@/lib/content";
import { AdminShell } from "../AdminShell";
import { staffGate } from "../gate";
import { HomeEditor } from "./HomeEditor";

export default async function AdminHomePage() {
  const gate = await staffGate("/admin/home");
  if (gate.blocked) return gate.blocked;
  const { ctx, who } = gate;

  const { data, error } = await ctx.supabase.from("site_content").select("key, value");
  const content = mergeHome(data as { key: string; value: unknown }[] | null);

  return (
    <AdminShell who={who} section="home">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-amber-deep">The site</p>
          <h1 className="mt-1 font-serif text-[40px] leading-none font-medium text-espresso-800">Home page</h1>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-espresso-800 underline-offset-4 hover:underline"
        >
          See the page
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Every word and picture below is yours. Anything you leave empty falls back to the copy the site shipped with,
        and each block saves on its own. The hero slider is made from the drinks you mark “in hero” under Products.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-amber-deep">
          {error.code === "42P01" || error.code === "PGRST205"
            ? "The site content table isn’t there yet — run supabase/migrations/20260926000000_admin_content.sql in Supabase. You can still edit below; saving will need the table."
            : `Couldn’t load what’s saved: ${error.message}`}
        </p>
      )}

      <HomeEditor content={content} />
    </AdminShell>
  );
}
