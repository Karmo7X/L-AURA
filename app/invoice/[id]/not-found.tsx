import Link from "next/link";
import { CupLogo } from "@/components/ui/icons";

export default function InvoiceNotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-oat px-6 text-center">
      <div>
        <CupLogo className="mx-auto h-12 w-12 text-terracotta" />
        <h1 className="mt-4 font-serif text-3xl text-espresso-800">We can’t find that invoice</h1>
        <p className="mt-2 text-muted">The link may be incomplete. Check it, or place a new order.</p>
        <Link
          href="/order"
          className="mt-6 inline-flex rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-[#9c4d22]"
        >
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
