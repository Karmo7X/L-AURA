"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { OrderRequest, PlacedOrder, PlaceOrderResult } from "@/lib/orders";

const ITEM_ID = /^[a-z0-9-]{1,40}$/;

/**
 * Save an order to Supabase. Anyone can POST to a Server Action, so the input
 * is checked here and again inside `place_order`, which also prices every
 * line from the menu table — the client never decides what anything costs.
 */
export async function placeOrder(input: OrderRequest): Promise<PlaceOrderResult> {
  const items = Array.isArray(input?.items) ? input.items : [];
  if (items.length === 0) return { ok: false, error: "The order is empty." };
  if (items.length > 20) return { ok: false, error: "That’s a lot of lines for one order — please split it up." };
  for (const item of items) {
    if (typeof item?.id !== "string" || !ITEM_ID.test(item.id) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) {
      return { ok: false, error: "Something in the order doesn’t look right — please rebuild it." };
    }
  }
  const name = typeof input.customerName === "string" ? input.customerName.trim().slice(0, 80) : "";

  const { data, error } = await supabaseServer().rpc("place_order", {
    p_items: items.map(({ id, qty }) => ({ id, qty })),
    p_customer_name: name || null,
  });

  if (error) {
    // 22023: a message we wrote in place_order, safe to show as-is
    if (error.code === "22023") return { ok: false, error: error.message };
    console.error("place_order failed", error);
    // the migration hasn't been run yet (function or table missing)
    if (error.code === "PGRST202" || error.code === "42P01" || error.code === "42883") {
      return {
        ok: false,
        error:
          process.env.NODE_ENV === "production"
            ? "Ordering is offline for a moment — please order at the counter."
            : "Supabase isn’t set up yet: run supabase/migrations/20260919000000_orders.sql in the SQL Editor.",
      };
    }
    return { ok: false, error: "We couldn’t reach the bar — please try again." };
  }

  return { ok: true, order: data as PlacedOrder };
}
