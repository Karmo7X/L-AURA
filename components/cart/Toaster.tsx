"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { useCafe } from "@/lib/store";

export function Toaster() {
  const toast = useCafe((s) => s.toast);
  const setCartOpen = useCafe((s) => s.setCartOpen);
  const cartOpen = useCafe((s) => s.cartOpen);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-espresso-800 py-2.5 pr-2.5 pl-4 text-sm text-paper shadow-2xl"
          >
            <CheckCircle2 className="h-4.5 w-4.5 text-peach" aria-hidden />
            <span>{toast.message}</span>
            {!cartOpen && (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20"
              >
                View order
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
