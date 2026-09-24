import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { BrandIntro } from "@/components/intro/BrandIntro";
import { TopBar } from "@/components/layout/TopBar";
import { CoffeeSlider } from "@/components/hero/CoffeeSlider";
import { ProductCards } from "@/components/products/ProductCards";
import { DayCadence } from "@/components/home/DayCadence";
import { TheSpace } from "@/components/home/TheSpace";
import { BaristaTable } from "@/components/home/BaristaTable";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/cart/Toaster";
import { getHeroSlides, getMenu } from "@/lib/supabase/menu";
import { getCategories, getHomeContent } from "@/lib/supabase/content";

// The menu comes from Supabase. Staff changes refresh this page straight away
// (see app/admin/actions.ts); this is only a safety net.
export const revalidate = 300;

export default async function Home() {
  const [menu, heroSlides, content, categories] = await Promise.all([
    getMenu(),
    getHeroSlides(),
    getHomeContent(),
    getCategories(),
  ]);
  const featured = menu.filter((p) => p.featured).slice(0, 4);

  return (
    <SmoothScroll>
      {/* 1. the name sets itself while the page loads, then lifts away */}
      <BrandIntro />
      <TopBar />
      <main>
        {/* 2. hero: a lit room you scroll through, one drink at a time (admin → Products) */}
        <CoffeeSlider slides={heroSlides} />
        {/* 3. what's on the bar today — cards that lean toward your hand */}
        <ProductCards
          products={featured.length ? featured : menu.slice(0, 4)}
          content={content.menu}
          categories={categories}
        />
        {/* 4. the day's three tempos, with the sun where the cafe's clock has it */}
        <DayCadence content={content.day} />
        {/* 5. the room, with markers you can poke at */}
        <TheSpace content={content.space} />
        {/* 6. the front bar: today's chalkboard, the record turning, Saturday cupping */}
        <BaristaTable content={content.bar} />
      </main>
      <Footer />
      <Toaster />
    </SmoothScroll>
  );
}
