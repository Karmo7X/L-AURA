import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "L’AURA — Café & Roastery",
  description:
    "Specialty coffee sculpted with unhurried devotion. Craft your signature cup, explore our menu, and visit our Arts District roastery.",
};

export const viewport: Viewport = {
  themeColor: "#170e09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // the script below marks this element before React hydrates it
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${jakarta.variable}`}>
      <head>
        {/* Runs before the first paint: anyone who already saw the loading
            screen this session, or who asked for less motion, never sees it. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('laura-intro-seen')||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.intro='seen'}}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
