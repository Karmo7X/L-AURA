"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/** Prints the invoice. With `auto`, opens the print dialog once the page (and its fonts) are ready. */
export function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    // wait for the web fonts, or the printout is set in a fallback face
    document.fonts.ready.then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-paper shadow-[0_12px_26px_-12px_rgba(176,90,42,0.9)] transition duration-300 ease-soft hover:scale-[1.03] hover:bg-[#9c4d22] active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" aria-hidden />
      Print invoice
    </button>
  );
}
