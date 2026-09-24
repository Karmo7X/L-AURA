"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, LoaderCircle } from "lucide-react";
import { settleOrder } from "../../actions";
import type { PaymentMethod } from "@/lib/orders";

/** Cash or card — one tap records the payment against this order. */
export function SettleButtons({ id, total }: { id: string; total: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settle = (how: PaymentMethod) => {
    setMethod(how);
    setError(null);
    startTransition(async () => {
      const result = await settleOrder(id, how);
      if (!result.ok) {
        setError(result.message ?? "That didn’t save — try again.");
        setMethod(null);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-6">
      <p className="label-caps text-amber-deep">Take {total}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(
          [
            { how: "cash", label: "Paid cash", Icon: Banknote },
            { how: "card", label: "Paid by card", Icon: CreditCard },
          ] as const
        ).map(({ how, label, Icon }) => (
          <button
            key={how}
            type="button"
            disabled={pending}
            onClick={() => settle(how)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber py-4 text-sm font-semibold text-paper shadow-[0_14px_30px_-12px_rgba(176,90,42,0.85)] transition hover:bg-[#9c4d22] disabled:opacity-50"
          >
            {pending && method === how ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Icon className="h-4 w-4" aria-hidden />
            )}
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep">
          {error}
        </p>
      )}
    </div>
  );
}
