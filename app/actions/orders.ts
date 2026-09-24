"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { payLink, qrSvg } from "@/lib/qr";
import { TABLE_NUMBER, UUID, type OrderRequest, type PlacedOrder, type PlaceOrderResult } from "@/lib/orders";

const ITEM_ID = /^[a-z0-9-]{1,40}$/;

/** The same shape `place_order` and `add_to_order` both take. */
function cleanItems(items: unknown): { ok: true; items: { id: string; qty: number }[] } | { ok: false; error: string } {
  const list = Array.isArray(items) ? (items as { id: string; qty: number }[]) : [];
  if (list.length === 0) return { ok: false, error: "The order is empty." };
  if (list.length > 20) return { ok: false, error: "That’s a lot of lines for one order — please split it up." };
  for (const item of list) {
    if (
      typeof item?.id !== "string" ||
      !ITEM_ID.test(item.id) ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 20
    ) {
      return { ok: false, error: "Something in the order doesn’t look right — please rebuild it." };
    }
  }
  return { ok: true, items: list.map(({ id, qty }) => ({ id, qty })) };
}

/** Turn a Postgres error from one of our order functions into something to read. */
function orderError(error: { code?: string; message: string }, where: string): string {
  // 22023: a message we wrote in the function itself, safe to show as-is
  if (error.code === "22023") return error.message;
  console.error(`${where} failed`, error);
  // the migration hasn't been run yet (function or table missing)
  if (error.code === "PGRST202" || error.code === "42P01" || error.code === "42883") {
    return process.env.NODE_ENV === "production"
      ? "Ordering is offline for a moment — please order at the counter."
      : `Supabase isn’t set up yet: run the migrations in supabase/migrations (${where} is missing).`;
  }
  return "We couldn’t reach the bar — please try again.";
}

/**
 * Save an order to Supabase. Anyone can POST to a Server Action, so the input
 * is checked here and again inside `place_order`, which also prices every
 * line from the menu table — the client never decides what anything costs.
 */
export async function placeOrder(input: OrderRequest): Promise<PlaceOrderResult> {
  const checked = cleanItems(input?.items);
  if (!checked.ok) return checked;
  const items = checked.items;
  const name = typeof input.customerName === "string" ? input.customerName.trim().slice(0, 80) : "";
  const table = typeof input.table === "string" ? input.table.trim() : "";
  if (table && !TABLE_NUMBER.test(table)) return { ok: false, error: "That table number doesn’t look right." };
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 200) : "";

  const { data, error } = await supabaseServer().rpc("place_order", {
    p_items: items,
    p_customer_name: name || null,
    p_table: table || null,
    p_note: note || null,
  });

  if (error) return { ok: false, error: orderError(error, "place_order") };
  return { ok: true, order: data as PlacedOrder };
}

/**
 * Put more on an order the guest already placed, so a second round doesn't
 * become a second bill. `add_to_order` re-prices the whole order from the
 * menu and refuses anything already paid or closed.
 */
export async function addToOrder(id: string, items: OrderRequest["items"]): Promise<PlaceOrderResult> {
  if (!UUID.test(id)) return { ok: false, error: "We can’t find that order." };
  const checked = cleanItems(items);
  if (!checked.ok) return checked;

  const { data, error } = await supabaseServer().rpc("add_to_order", { p_id: id, p_items: checked.items });
  if (error) return { ok: false, error: orderError(error, "add_to_order") };
  return { ok: true, order: data as PlacedOrder };
}

/**
 * Change one line of an order — a different quantity, or 0 to take it off.
 * Only while the bar hasn't started on it; `amend_order_item` decides that.
 */
export async function amendOrderItem(id: string, itemId: string, qty: number): Promise<PlaceOrderResult> {
  if (!UUID.test(id)) return { ok: false, error: "We can’t find that order." };
  if (typeof itemId !== "string" || !ITEM_ID.test(itemId)) return { ok: false, error: "That isn’t on the order." };
  if (!Number.isInteger(qty) || qty < 0 || qty > 20) return { ok: false, error: "Choose a quantity from 0 to 20." };

  const { data, error } = await supabaseServer().rpc("amend_order_item", { p_id: id, p_item_id: itemId, p_qty: qty });
  if (error) return { ok: false, error: orderError(error, "amend_order_item") };
  return { ok: true, order: data as PlacedOrder };
}

/**
 * A guest saying they'd like to settle now, before the drinks are finished.
 * Nothing is charged here — it flags the order so the counter can bring the
 * card machine over; the money is still taken at the till.
 */
export async function requestBill(id: string): Promise<PlaceOrderResult> {
  if (!UUID.test(id)) return { ok: false, error: "We can’t find that order." };
  const { data, error } = await supabaseServer().rpc("request_bill", { p_id: id });
  if (error) return { ok: false, error: orderError(error, "request_bill") };
  return { ok: true, order: data as PlacedOrder };
}

/**
 * The orders this phone remembers, newest first. The ids come from the
 * guest's own device — `get_order` still only ever returns one order at a
 * time, and only to someone holding its id.
 */
export async function ordersByIds(ids: string[]): Promise<PlacedOrder[]> {
  const wanted = (Array.isArray(ids) ? ids : []).filter((id) => UUID.test(id)).slice(0, 20);
  if (!wanted.length) return [];
  const supabase = supabaseServer();
  const found = await Promise.all(
    wanted.map(async (id) => {
      const { data, error } = await supabase.rpc("get_order", { p_id: id });
      if (error) {
        console.error("get_order failed", error);
        return null;
      }
      return (data as PlacedOrder | null) ?? null;
    }),
  );
  return found
    .filter((o): o is PlacedOrder => !!o)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * The QR code for an order, as an inline SVG, plus the link it carries. The
 * counter scans it to bring the order up and settle it; it's the same code
 * that prints on the invoice.
 */
export async function orderQr(id: string): Promise<{ svg: string; link: string } | null> {
  if (!UUID.test(id)) return null;
  const link = await payLink(id);
  return { svg: await qrSvg(link), link };
}

/**
 * One order by id, for the guest watching their own order move along. The id
 * is the unguessable one from their own confirmation, and `get_order` only
 * ever returns that single order.
 */
export async function orderStatus(id: string): Promise<PlacedOrder | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await supabaseServer().rpc("get_order", { p_id: id });
  if (error) {
    console.error("get_order failed", error);
    return null;
  }
  return (data as PlacedOrder | null) ?? null;
}
