import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { CupLogo } from "@/components/ui/icons";
import { signOut } from "./actions";

/** Frame for signed-in admin pages: brand, a way back to the site, sign out. */
export type AdminSection = "orders" | "products" | "menu-sections" | "home";

export function AdminShell({
  who,
  section,
  children,
}: {
  who?: string | null;
  section?: AdminSection;
  children: ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-espresso-800/10 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin/products" className="flex items-center gap-2.5">
            <CupLogo className="h-8 w-8 text-terracotta" />
            <span className="leading-none">
              <span className="block font-serif text-xl font-semibold text-espresso-800">L’AURA</span>
              <span className="label-caps mt-0.5 block text-[9px] text-subtle">Cafe admin</span>
            </span>
          </Link>
          {who && (
            <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto">
              {[
                { href: "/admin/orders", label: "Orders", id: "orders" },
                { href: "/admin/products", label: "Products", id: "products" },
                { href: "/admin/menu-sections", label: "Sections", id: "menu-sections" },
                { href: "/admin/home", label: "Home page", id: "home" },
              ].map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={section === tab.id ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    section === tab.id
                      ? "bg-espresso-800 text-linen"
                      : "text-muted hover:bg-oat hover:text-espresso-800",
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-oat hover:text-espresso-800 sm:inline-flex"
            >
              View site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {who && (
              <form action={signOut} className="flex items-center gap-2">
                <span className="hidden max-w-[200px] truncate text-sm text-subtle md:inline">{who}</span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-espresso-800/15 px-3 py-2 text-sm font-semibold text-espresso-800 transition-colors hover:bg-oat"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </>
  );
}

/** A calm panel for "you can't do this yet, here's why". */
export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[620px] rounded-2xl border border-espresso-800/10 bg-paper p-6 shadow-card sm:p-8">
      <h1 className="font-serif text-2xl text-espresso-800">{title}</h1>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-muted">{children}</div>
    </div>
  );
}
