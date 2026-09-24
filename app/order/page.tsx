import type { Metadata } from "next";
import { getMenu } from "@/lib/supabase/menu";
import { getCategories } from "@/lib/supabase/content";
import { TABLE_NUMBER } from "@/lib/orders";
import { TableOrder } from "./TableOrder";

export const metadata: Metadata = {
  title: "Order — L’AURA",
  description: "Order from your table. We'll bring it over; pay at the counter on your way out.",
};

/** Guests land here from the QR code on their table: /order?table=5 */
export default async function OrderPage({ searchParams }: PageProps<"/order">) {
  const [menu, categories, { table }] = await Promise.all([getMenu(), getCategories(), searchParams]);
  const at = typeof table === "string" && TABLE_NUMBER.test(table.trim()) ? table.trim() : null;

  return <TableOrder products={menu} table={at} categories={categories} />;
}
