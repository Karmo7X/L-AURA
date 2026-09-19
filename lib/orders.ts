/** An order as saved in Supabase — the shape `place_order` / `get_order` return. */
export interface PlacedOrder {
  id: string;
  order_number: number;
  customer_name: string | null;
  status: "placed" | "preparing" | "ready" | "collected" | "cancelled";
  subtotal: number;
  tax: number;
  tax_rate: number;
  total: number;
  created_at: string;
  items: PlacedOrderItem[];
}

export interface PlacedOrderItem {
  item_id: string;
  name: string;
  unit_price: number;
  qty: number;
  line_total: number;
}

export interface OrderRequest {
  items: { id: string; qty: number }[];
  customerName?: string;
}

export type PlaceOrderResult = { ok: true; order: PlacedOrder } | { ok: false; error: string };

/** The shop is in LA — stamp every slip and invoice in its time, not the viewer's. */
const SHOP_TIME_ZONE = "America/Los_Angeles";

export function orderDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: SHOP_TIME_ZONE }).format(new Date(iso));
}

export function orderTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short", timeZone: SHOP_TIME_ZONE }).format(new Date(iso));
}

/** INV-001042 */
export function invoiceNumber(order: Pick<PlacedOrder, "order_number">) {
  return `INV-${String(order.order_number).padStart(6, "0")}`;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
