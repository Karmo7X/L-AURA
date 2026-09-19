import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CupLogo } from "@/components/ui/icons";
import { getOrder } from "@/lib/supabase/orders";
import { invoiceNumber, money, orderDate, orderTime, type PlacedOrder } from "@/lib/orders";
import { PrintButton } from "./PrintButton";

export async function generateMetadata({ params }: PageProps<"/invoice/[id]">): Promise<Metadata> {
  const order = await getOrder((await params).id);
  return {
    title: order ? `${invoiceNumber(order)} — L’AURA` : "Invoice not found — L’AURA",
    // invoices are private links: keep them out of search results
    robots: { index: false, follow: false },
  };
}

const STATUS: Record<PlacedOrder["status"], string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready: "Ready at the bar",
  collected: "Collected",
  cancelled: "Cancelled",
};

export default async function InvoicePage({ params, searchParams }: PageProps<"/invoice/[id]">) {
  const [{ id }, { print }] = await Promise.all([params, searchParams]);
  const order = await getOrder(id);
  if (!order) notFound();

  const count = order.items.reduce((n, item) => n + item.qty, 0);

  return (
    <main className="min-h-svh bg-oat px-4 py-8 text-ink sm:px-6 sm:py-12 print:bg-white print:p-0">
      {/* toolbar — screen only */}
      <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 print:hidden">
        <Link
          href="/#order"
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-espresso-800 transition-colors hover:bg-oat-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to the shop
        </Link>
        <PrintButton auto={print === "1"} />
      </div>

      {/* the sheet */}
      <article
        aria-labelledby="invoice-title"
        className="mx-auto mt-6 max-w-[820px] rounded-2xl bg-paper p-6 shadow-card sm:p-12 print:mt-0 print:max-w-none print:rounded-none print:bg-white print:p-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <CupLogo className="h-11 w-11 text-terracotta" />
            <div className="leading-tight">
              <p className="font-serif text-[28px] font-semibold tracking-tight text-espresso-800">L’AURA</p>
              <p className="label-caps text-[10px] text-subtle">Specialty Coffee · Café &amp; Roastery</p>
            </div>
          </div>
          <div className="text-right">
            <h1 id="invoice-title" className="font-serif text-[40px] leading-none font-medium text-espresso-800">
              Invoice
            </h1>
            <p className="mt-2 font-mono text-sm text-muted">{invoiceNumber(order)}</p>
          </div>
        </header>

        <div className="mt-8 h-px bg-linear-to-r from-terracotta via-terracotta/40 to-transparent" />

        <dl className="mt-8 grid gap-6 text-[14px] sm:grid-cols-3">
          <div>
            <dt className="label-caps text-amber-deep">Billed to</dt>
            <dd className="mt-2 font-semibold text-espresso-800">{order.customer_name ?? "Walk-in guest"}</dd>
            <dd className="text-muted">Order #{order.order_number}</dd>
          </div>
          <div>
            <dt className="label-caps text-amber-deep">Issued</dt>
            <dd className="mt-2 font-semibold text-espresso-800">{orderDate(order.created_at)}</dd>
            <dd className="text-muted">{orderTime(order.created_at)} · Los Angeles</dd>
          </div>
          <div>
            <dt className="label-caps text-amber-deep">From</dt>
            <dd className="mt-2 font-semibold text-espresso-800">L’AURA Café &amp; Roastery</dd>
            <dd className="text-muted">742 Palmetto St, Arts District</dd>
            <dd className="text-muted">(213) 555-0142</dd>
          </div>
        </dl>

        {/* lines */}
        <table className="mt-10 w-full border-collapse text-[14px]">
          <caption className="sr-only">
            {count} item{count === 1 ? "" : "s"} on this order
          </caption>
          <thead>
            <tr className="border-b-2 border-espresso-800 text-left">
              <th scope="col" className="label-caps pb-3 font-semibold text-espresso-800">
                Item
              </th>
              <th scope="col" className="label-caps w-16 pb-3 text-right font-semibold text-espresso-800">
                Qty
              </th>
              <th scope="col" className="label-caps w-28 pb-3 text-right font-semibold text-espresso-800">
                Unit price
              </th>
              <th scope="col" className="label-caps w-28 pb-3 text-right font-semibold text-espresso-800">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.item_id} className="border-b border-espresso-800/10 break-inside-avoid">
                <td className="py-3.5 font-medium text-espresso-800">{item.name}</td>
                <td className="py-3.5 text-right tabular-nums">{item.qty}</td>
                <td className="py-3.5 text-right text-muted tabular-nums">{money(item.unit_price)}</td>
                <td className="py-3.5 text-right font-semibold tabular-nums">{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-[300px] text-[14px] tabular-nums">
            <div className="flex justify-between py-1.5">
              <dt className="text-muted">Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-muted">Sales tax ({(order.tax_rate * 100).toFixed(2)}%)</dt>
              <dd>{money(order.tax)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-espresso-800 pt-3">
              <dt className="label-caps text-espresso-800">Total due</dt>
              <dd className="font-serif text-[30px] font-semibold text-amber-deep">{money(order.total)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-12 grid gap-6 border-t border-dashed border-espresso-800/20 pt-6 text-[13px] text-muted sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-serif text-lg text-espresso-800 italic">Thank you — see you at the bar.</p>
            <p className="mt-1">
              Status: <span className="font-semibold text-espresso-800">{STATUS[order.status]}</span> · Payment is taken at
              the counter.
            </p>
          </div>
          <p className="font-mono text-[11px] break-all text-subtle sm:text-right">Ref {order.id}</p>
        </footer>
      </article>
    </main>
  );
}
