/** An order as saved in Supabase — the shape `place_order` / `get_order` return. */
export interface PlacedOrder {
  id: string;
  order_number: number;
  customer_name: string | null;
  /** Which table it was ordered from, if any. */
  table_number: string | null;
  note: string | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  tax_rate: number;
  total: number;
  created_at: string;
  /** When the counter took the money, and how. */
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  /** When the guest asked to settle, if they did. */
  payment_requested_at?: string | null;
  items: PlacedOrderItem[];
}

export type PaymentMethod = "cash" | "card";

export type OrderStatus = "placed" | "preparing" | "ready" | "collected" | "cancelled";

/** What each status means to a guest and to the counter. */
export const ORDER_STATUS: Record<OrderStatus, { label: string; guest: string }> = {
  placed: { label: "New", guest: "Sent to the bar" },
  preparing: { label: "Preparing", guest: "Being made now" },
  ready: { label: "Ready", guest: "Ready at the counter" },
  collected: { label: "Collected", guest: "Collected — enjoy" },
  cancelled: { label: "Cancelled", guest: "Cancelled" },
};

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
  /** The table the guest is sitting at, from /order?table=5. */
  table?: string;
  note?: string;
}

/** Table numbers come from a QR link, so keep them short and plain. */
export const TABLE_NUMBER = /^[A-Za-z0-9 -]{1,8}$/;

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
