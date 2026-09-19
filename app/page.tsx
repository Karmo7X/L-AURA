import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { PourIntro } from "@/components/intro/PourIntro";
import { TopBar } from "@/components/layout/TopBar";
import { CoffeeSlider } from "@/components/hero/CoffeeSlider";
import { ProductCards } from "@/components/products/ProductCards";
import { ClockSection } from "@/components/clock/ClockSection";
import { RoastSection } from "@/components/roast/RoastSection";
import { ReceiptPrinter } from "@/components/receipt/ReceiptPrinter";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/cart/Toaster";

export default function Home() {
  return (
    <SmoothScroll>
      {/* 1. a drawn cup fills and pours the page open */}
      <PourIntro />
      <TopBar />
      <main>
        {/* 2. hero: a scroll-driven slider through four drinks, real photos with depth parallax */}
        <CoffeeSlider />
        {/* 3. four product cards that lean toward your hand */}
        <ProductCards />
        {/* 4. an iced latte turning on a clock face as you scroll */}
        <ClockSection />
        {/* 5. roast dial — drag it and the beans roast in real time */}
        <RoastSection />
        {/* 6. a thermal printer feeding out your receipt */}
        <ReceiptPrinter />
      </main>
      <Footer />
      <Toaster />
    </SmoothScroll>
  );
}
