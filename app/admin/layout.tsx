import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cafe admin — L’AURA",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-svh bg-oat text-ink">{children}</div>;
}
