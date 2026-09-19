import { cache } from "react";
import { supabaseServer } from "./server";
import { UUID, type PlacedOrder } from "@/lib/orders";

/**
 * One order by id, or null. Cached per request so the invoice page and its
 * metadata share a single round-trip.
 */
export const getOrder = cache(async (id: string): Promise<PlacedOrder | null> => {
  if (!UUID.test(id)) return null;
  const { data, error } = await supabaseServer().rpc("get_order", { p_id: id });
  if (error) {
    console.error("get_order failed", error);
    throw new Error("Couldn’t load the order.");
  }
  return (data as PlacedOrder | null) ?? null;
});
