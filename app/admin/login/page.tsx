import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CupLogo } from "@/components/ui/icons";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-svh place-items-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <CupLogo className="h-12 w-12 text-terracotta" />
          <p className="mt-3 font-serif text-3xl font-semibold text-espresso-800">L’AURA</p>
          <p className="label-caps mt-1 text-[10px] text-subtle">Cafe admin</p>
        </div>

        <div className="mt-8 rounded-2xl border border-espresso-800/10 bg-paper p-6 shadow-card sm:p-8">
          <h1 className="font-serif text-2xl text-espresso-800">Sign in</h1>
          <p className="mt-1 text-[14px] text-subtle">For cafe staff — add and update what’s on the menu.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>

        <Link
          href="/"
          className="mx-auto mt-6 flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-espresso-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to the cafe
        </Link>
      </div>
    </main>
  );
}
