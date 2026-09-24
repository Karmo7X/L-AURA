"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ExternalLink, FileText } from "lucide-react";
import { invoiceNumber, money, orderTime, type PlacedOrder } from "@/lib/orders";
import { cn, EASE_SOFT } from "@/lib/cn";

/** What the terminal is doing — it drives the lamp and the little label. */
export type PrinterState = "ready" | "sending" | "printing" | "error";

const LAMP: Record<PrinterState, { dot: string; label: string }> = {
  ready: { dot: "bg-[#7ee08a]/40", label: "Ready" },
  sending: { dot: "animate-pulse bg-[#ffc56b]", label: "Sending" },
  printing: { dot: "bg-[#7ee08a]", label: "Printing" },
  error: { dot: "bg-[#ff7a6b]", label: "Error" },
};

/**
 * The bar terminal with a slip rolling out of the slot — the same piece on the
 * home page and on the ordering screen, so an order looks the same wherever
 * the guest placed it.
 */
export function SlipPrinter({
  order,
  qr,
  state,
  screen,
  empty,
  className,
}: {
  order: PlacedOrder | null;
  qr: string | null;
  state: PrinterState;
  screen: string;
  /** Shown under the printer while there is nothing to print. */
  empty?: ReactNode;
  className?: string;
}) {
  const lamp = LAMP[state];

  return (
    <div className={cn("relative mx-auto max-w-[460px]", className)}>
      {/* body */}
      <div className="relative z-20 rounded-t-[26px] rounded-b-lg bg-[linear-gradient(180deg,#3d3833_0%,#272220_55%,#191513_100%)] px-6 pt-6 pb-4 shadow-[0_28px_60px_-24px_rgba(20,10,4,0.7)]">
        <div className="flex items-center justify-between">
          <span className="label-caps text-[10px] text-white/45">L’AURA · Bar Terminal</span>
          <span className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full transition-colors duration-300", lamp.dot)} />
            <span className="label-caps text-[10px] text-white/40">{lamp.label}</span>
          </span>
        </div>

        <div className="mt-5 h-14 rounded-lg bg-black/45 p-3 ring-1 ring-white/5" aria-live="polite">
          <p className="font-mono text-[11px] leading-4 text-[#9fe8ae]/80">{screen}</p>
          <p className="font-mono text-[11px] leading-4 text-[#9fe8ae]/50">
            {order ? `TOTAL ${money(order.total)}` : "TOTAL —"}
          </p>
        </div>

        {/* the slot */}
        <div className="relative mt-5">
          <div className="h-3 rounded-full bg-black shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]" />
          <div className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-white/10" />
        </div>
      </div>

      {/* paper */}
      <div className="relative z-10 -mt-1 flex justify-center overflow-hidden px-6 pb-2">
        {order && (
          // a changed order rolls a fresh slip out rather than editing this one
          <div
            key={`${order.id}:${order.items.length}:${order.total}`}
            className="slip-feed w-full max-w-[300px] origin-top"
          >
            <ReceiptSlip order={order} qr={qr} />
          </div>
        )}
      </div>

      {order ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/invoice/${order.id}?print=1`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-espresso-800 px-5 py-2.5 text-sm font-semibold text-linen transition duration-300 ease-soft hover:scale-[1.03] hover:bg-espresso-700"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Print invoice
          </Link>
          <Link
            href={`/invoice/${order.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full border border-espresso-800/20 px-5 py-2.5 text-sm font-semibold text-espresso-800 transition-colors hover:bg-oat"
          >
            View {invoiceNumber(order)}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        empty
      )}
    </div>
  );
}

/** The paper itself — what the thermal head lays down, torn edge and all. */
export function ReceiptSlip({ order, qr }: { order: PlacedOrder; qr: string | null }) {
  return (
    <div
      className="relative bg-[#fbfaf6] px-5 pt-6 pb-8 font-mono text-[12px] leading-[19px] text-[#2f2a26] shadow-[0_20px_40px_-18px_rgba(43,26,18,0.55)]"
      style={{
        // torn edge along the bottom
        maskImage:
          "linear-gradient(#000 calc(100% - 12px), transparent calc(100% - 12px)), repeating-conic-gradient(from -45deg at 6px calc(100% - 6px), #000 0deg 90deg, transparent 90deg 180deg)",
        WebkitMaskImage:
          "linear-gradient(#000 calc(100% - 12px), transparent calc(100% - 12px)), repeating-conic-gradient(from -45deg at 6px calc(100% - 6px), #000 0deg 90deg, transparent 90deg 180deg)",
      }}
    >
      <PrintLines>
        <p className="text-center font-sans text-[15px] font-bold tracking-[0.3em]">L’AURA</p>
        <p className="mt-1 text-center text-[11px] text-[#6b625b]">742 Palmetto St · Arts District</p>
        <p className="text-center text-[11px] text-[#6b625b]">(213) 555-0142</p>
        <p className="my-3 text-center text-[#b6aca3]">* * * * * * * * * * * * * * * *</p>
        <div className="flex justify-between text-[11px] text-[#6b625b]">
          <span>ORDER #{order.order_number}</span>
          <span>{orderTime(order.created_at)}</span>
        </div>
        {order.table_number ? <p className="text-[11px] text-[#6b625b]">TABLE {order.table_number}</p> : null}
        {order.customer_name ? (
          <p className="truncate text-[11px] text-[#6b625b]">FOR {order.customer_name.toUpperCase()}</p>
        ) : null}
        <p className="my-3 border-t border-dashed border-[#c9c0b6]" />
        {order.items.map((item) => (
          <div key={item.item_id} className="flex justify-between gap-3">
            <span className="truncate">
              {item.qty} × {item.name.toUpperCase()}
            </span>
            <span>{money(item.line_total)}</span>
          </div>
        ))}
        <p className="my-3 border-t border-dashed border-[#c9c0b6]" />
        <div className="flex justify-between text-[#6b625b]">
          <span>SUBTOTAL</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#6b625b]">
          <span>TAX {(order.tax_rate * 100).toFixed(2)}%</span>
          <span>{money(order.tax)}</span>
        </div>
        <div className="mt-2 flex justify-between text-[14px] font-bold">
          <span>TOTAL</span>
          <span>{money(order.total)}</span>
        </div>
        <p className="my-3 border-t border-dashed border-[#c9c0b6]" />
        <p className="text-center text-[11px] text-[#6b625b]">THANK YOU — SEE YOU AT THE BAR</p>
        {/* the counter scans this to bring the order up and take payment */}
        {order.paid_at ? (
          <p className="mt-4 text-center text-[11px] font-bold text-[#2f6b3a]">
            PAID BY {order.payment_method === "card" ? "CARD" : "CASH"}
          </p>
        ) : qr ? (
          <div className="mt-4 flex flex-col items-center">
            <span
              aria-label="Payment code for the counter"
              className="[&>svg]:h-[104px] [&>svg]:w-[104px]"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p className="mt-2 text-center text-[10px] text-[#6b625b]">SCAN AT THE COUNTER TO PAY</p>
          </div>
        ) : (
          <div className="mt-4 h-[104px]" aria-hidden />
        )}
        <p className="mt-2 text-center text-[10px] tracking-[0.35em] text-[#6b625b]">{invoiceNumber(order)}</p>
      </PrintLines>
    </div>
  );
}

/** Reveals children line by line, the way a thermal head lays down each row. */
function PrintLines({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: 0.35 } } }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, filter: "blur(2px)" }, show: { opacity: 1, filter: "blur(0px)" } }}
              transition={{ duration: 0.18, ease: EASE_SOFT }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
