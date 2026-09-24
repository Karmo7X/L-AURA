import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

/**
 * The site's own address, taken from the request (so it works on localhost,
 * on a phone on the same wifi, and in production without configuring
 * anything). NEXT_PUBLIC_SITE_URL wins if it's set.
 */
export async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const head = await headers();
  const host = head.get("x-forwarded-host") ?? head.get("host") ?? "localhost:3000";
  const protocol = head.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}

/** Where a scan of an invoice's QR code lands: the counter's payment screen. */
export async function payLink(orderId: string) {
  return `${await siteUrl()}/admin/pay/${orderId}`;
}

/**
 * A QR code as an inline SVG string. Generated here on the server, so the
 * browser downloads nothing extra and it prints crisply at any size.
 */
export async function qrSvg(data: string, { scale = 1 }: { scale?: number } = {}) {
  return QRCode.toString(data, {
    type: "svg",
    margin: 0,
    scale,
    errorCorrectionLevel: "M",
    color: { dark: "#1c1c18", light: "#00000000" },
  });
}
