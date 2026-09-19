// Photography comes from the Stitch export. Replace with your own assets
// (and update `images.remotePatterns` in next.config.ts) before launch.
const IMG = {
  espresso:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC2oLRiyoXna61fhlQ2tAj6DWvOm1TmoSBgB01RItkBz7IkfxgoXNQ458FyiBkpspEp5WfhZ3EiUKdjVNsdc0gOE7jOytW3nCrUsIspoVue-R55hhDmyNYKQflPBv7lnSDYEY3ii546CWBtzlW6TKgiSXNTaraIp2z__yiXO48LI1u_EeqL32UQ0K11TUv8y49Kf-1z-0npeCpSUs7BmC9hbdBL3yWGsFoiLp-pY2amJFSqnyZ2dbEr",
  latte:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD1-KhUtS-lQ_7Vunc-bcytW3lnITtYg7a-a8MCUfe5ls_8aaUAIYdEhMD5fiCOngrxpMiU1tJ9ei-FbQgHO8T9QZ0fAkpkrp5pmuEF40wZ1Qjt69Wav5oP2zWcRGAiRmrf7BlQVIXshNDpIOU-I_nWj87Amv6yNLfiYhOhXVfOyAtWSlnIL_dq8CLTmEZi_a7mQI_D39fPELNYIp4tUO_WQ-UptrZG-q-rGPRZ5V4tUXtH_yHfcXus",
  cappuccino:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mDtqIrGiy5G5lQeyGjoO60vQkglxWe6Yg0M28isqdFLQbLNTFvxyymIBsGH_-1RF82pUlUi8Yq-cCZpu8kjN5BUr3HKuFGupuJQ6m4xu3-ogcDsuVtZIhlNsY_S0OgVOuemUBn4D7PkOtl6qH9_7EuBlG51jsYiU3O54OlP3GMD7e9qnxgIFCj9F0dKdnRI-ORAh__coB1t3wDy22HtQ0kE_7bWQ0l2e8l9Oh5D4LVAWI0F-98LI",
  mocha:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDK4NxblXLmzER6W6qMrDcRnAgwm9QhPs4zmljmJ6Pim0IAa4ex3yG58eXiD86AdKGpaFsYQFoOWUa-MaGjm9caHbU6WfkOj_i6HtNnETTPT_hXbkXtGDB6dU5OhK_vT99jYHuia6aL1gYcP3iVQRze1Nfhgc76IGVgDe42ONk6L8gzw9KZTPZ_cliw12CC35GVtPKNqcEd8oML8Os_Az2rOxslD_V8IgapGReTFcmzfU58w80pi4w4",
  americano:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDeQLD-K6O0k-DXXRkEwQ7Gh7bxKfIbNqTMQ-naeaCKo68cG_2vKUpNK06RRUDJZON1OoHpUaz9Yb7pEeUz4OqqEWmdm8nD1y5OhrSas1X6LDkJd0iBy2qT0FRC-sRqGIpw_WzzAaE4afEp937gFPaP9qU3yoLZrseccpcNhpyR3j68y38bWyH5DHnH-VNNTKkqOWL6ZehqdbSsCn07A-r-N9LWFQ3Wwp_rAGAeGIAw1oxT-iixhnL1",
  coldBrew:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD8z-NfsC7jyJmQh2_B0maRMjwHwkZEmWCjr91DFb9rrhSMAxCfxeqjoW3ZNsdnGpjk7HdgfmaugyVzmY38uJMyE1Q7oWPnlw5KeeOb0y21gfvk61XuoZwqEO1lbSh22SsH9jySyPDVHtSEuXgGMk1OuC4Kx02Xrgtax5NhwYnrFeKJVjHSRsnCUyhh1IleqIzca1zzIiaqpwY6iaJbt6k2o7oyvoGi8dYiGJPtaCQwGsfIrNoUe6lA",
  macchiato:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCL7Op0WjkLYJUIrGmFzUfrPYNK0oQAQbkiFXsfmh0r7WBh8fMK_qJtifsnv408VXic9P9PNLph3Yp7xn0DyLeiYSCZrInW8B0JOMyipqFLtmr758YBrCtuanDv9s5CT8X-lOafHoRTqAvhfkl80JBpXwiOETxaGeTVx6F1tlBrcAfAK1Yu0_ghqaOaYspkUUFDymzk4hJsihHjbU--it_PcQjXuZrO22cHLYC1PS6aOV4ivNcWDaCr",
  croissant:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCitQOnqYTB0b_RtLaELlnNUSixC41G0CHmDmD1y55NK_hBmXvADOoYsX6C7JXiQLWKe-Y2gFhgJOc7dhhgsFi6Ov5OvgzP0BOVXcWU12gx4wUftp2G4C6-7isIN5ivdLcdqUBeB38BRS32sQNIr6TK4otissPe6c8FSMwoRNyGGpQ07EXYe88DuYSEdVQ4nyTKXGLlhmqDv0SIWZWN6oEsK_t8dmuMdKDORxFeiyUefSTTUrBko83N",
  interior:
    "https://lh3.googleusercontent.com/aida/AEtjO1UpY7AiWT6cTaOAXdyHsBYtIOePoILGqmed0AYtvmRfeCZV3imwWiCEu5Xe4Tnl8s4AGxK2BqNWZpJA9ePm8F_V1xFwFOycOkcyewsQ3khaWNadNFVtce1-whPLk9mJ-uAg7pSFZR5sJm9EAVDHQ7ylhDXa6iS0jEFbincBhW53Y7q1Kx8wvTH3nTUG8Y4IMjqqEevSVEOWyNkf9LNEnJpzXJEV_AyrXtPtWVfJMKXiLn5iM4rBjTwM",
  roastery:
    "https://lh3.googleusercontent.com/aida/AEtjO1XSDUJQqDbj-ZC-Hg6HVUKBToFsXwsdtuIKc1oCWQ-Vrls-qHhd5-3CZc2IIZFASskvYcNIb_aeLPk5VdKYOo_5QMQnYsMe-PcebRW4ja8RfSoM-0ZJGdI016v2AM0ryswtwe9WnSwnhdPDsJfEJmAPTUp2mgygQ6kpUEfCxMKwy-t83H16qGjpNiV-TDYHnp0fOm2MTHIS1hWeRZ18O_pNbi7HtsNLshTNPljKe2x53Aucg0RXIBM-1g",
} as const;

export const IMAGES = IMG;

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
] as const;

/* ------------------------------------------------------------------ */
/* Menu                                                               */
/* ------------------------------------------------------------------ */
export type MenuCategory = "hot" | "cold" | "pastry";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  tag: string;
  meta: string;
}

export const MENU_FILTERS: { id: MenuCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot Coffee" },
  { id: "cold", label: "Cold Coffee" },
  { id: "pastry", label: "Pastries" },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "espresso",
    name: "Espresso",
    description: "Rich, intense shot of pure coffee.",
    price: 2.5,
    category: "hot",
    image: IMG.espresso,
    tag: "Double Shot",
    meta: "Hot · 2 oz",
  },
  {
    id: "latte",
    name: "Latte",
    description: "Espresso with steamed milk and light foam.",
    price: 4,
    category: "hot",
    image: IMG.latte,
    tag: "Signature",
    meta: "Hot · 12 oz",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Equal parts espresso, steamed milk, and foam.",
    price: 4,
    category: "hot",
    image: IMG.cappuccino,
    tag: "Classic",
    meta: "Hot · 6 oz",
  },
  {
    id: "mocha",
    name: "Mocha",
    description: "Espresso with chocolate and steamed milk, topped with whipped cream.",
    price: 4.5,
    category: "hot",
    image: IMG.mocha,
    tag: "Indulgent",
    meta: "Hot · 12 oz",
  },
  {
    id: "americano",
    name: "Americano",
    description: "Espresso diluted with hot water.",
    price: 3,
    category: "hot",
    image: IMG.americano,
    tag: "Pure",
    meta: "Hot · 10 oz",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    description: "Slow-steeped, smooth and bold, served over ice.",
    price: 4.5,
    category: "cold",
    image: IMG.coldBrew,
    tag: "24-Hr Steep",
    meta: "Iced · 14 oz",
  },
  {
    id: "caramel-macchiato",
    name: "Caramel Macchiato",
    description: "Espresso with vanilla, steamed milk, and caramel drizzle.",
    price: 4.75,
    category: "hot",
    image: IMG.macchiato,
    tag: "Layered",
    meta: "Hot · 12 oz",
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    description: "Freshly baked, flaky pastry.",
    price: 3.5,
    category: "pastry",
    image: IMG.croissant,
    tag: "Baked Daily",
    meta: "Pastry · Warm",
  },
];

/* ------------------------------------------------------------------ */
/* Customizer                                                         */
/* ------------------------------------------------------------------ */
export type IngredientId =
  | "milk"
  | "oat"
  | "caramel"
  | "cinnamon"
  | "chocolate"
  | "cream"
  | "shot";

export interface Ingredient {
  id: IngredientId;
  name: string;
  description: string;
  price: number;
  /** Flavor profile deltas: body, sweetness, intensity (−1…1). */
  profile: [number, number, number];
}

export const BASE_DRINK = {
  name: "Double Espresso",
  price: 4,
  profile: [0.45, 0.15, 0.8] as [number, number, number],
};

export const MILK_IDS: IngredientId[] = ["milk", "oat"];

export const INGREDIENTS: Ingredient[] = [
  {
    id: "milk",
    name: "Steamed Milk",
    description: "Velvety whole-milk microfoam",
    price: 0.5,
    profile: [0.35, 0.15, -0.35],
  },
  {
    id: "oat",
    name: "Oat Milk",
    description: "Silky, naturally sweet plant milk",
    price: 0.75,
    profile: [0.25, 0.2, -0.35],
  },
  {
    id: "caramel",
    name: "Caramel",
    description: "Copper-kettle salted caramel drizzle",
    price: 0.9,
    profile: [0.05, 0.4, -0.05],
  },
  {
    id: "cinnamon",
    name: "Cinnamon",
    description: "Stoneground Ceylon bark dusting",
    price: 0.4,
    profile: [0, 0.1, 0.1],
  },
  {
    id: "chocolate",
    name: "Chocolate",
    description: "72% single-origin drizzle & shavings",
    price: 0.75,
    profile: [0.15, 0.3, 0.05],
  },
  {
    id: "cream",
    name: "Whipped Cream",
    description: "Hand-whipped vanilla dollop",
    price: 0.85,
    profile: [0.3, 0.3, -0.15],
  },
  {
    id: "shot",
    name: "Extra Shot",
    description: "A syrupy ristretto for more depth",
    price: 1.2,
    profile: [0.15, -0.05, 0.3],
  },
];

/* ------------------------------------------------------------------ */
/* Social proof & gallery                                             */
/* ------------------------------------------------------------------ */
export const TESTIMONIALS = [
  {
    quote:
      "The aroma when you step through the door feels like coming home. Hands down the most nuanced pour-over on the west coast.",
    author: "Elena Rostova",
    role: "Design Critic",
  },
  {
    quote:
      "I built my own cup on the website, walked in twenty minutes later, and it tasted exactly like I imagined. Caramel, oat milk, pure joy.",
    author: "Marcus Vance",
    role: "Regular since 2021",
  },
  {
    quote:
      "L’AURA respects the science of roasting as deeply as the ritual of drinking. Unrivaled consistency, and warmth in every detail.",
    author: "Chloé Dubois",
    role: "Author, Slow Spaces",
  },
  {
    quote:
      "Their cold brew is dangerously smooth. The croissants sell out by ten, so I’ve learned to set an alarm.",
    author: "Priya Natarajan",
    role: "Neighborhood Local",
  },
];

export const GALLERY = [
  { src: IMG.interior, alt: "Sunlit café interior with guests at the bar", caption: "The Atelier", span: "col-span-2 row-span-2" },
  { src: IMG.latte, alt: "Latte with tulip art in a terracotta cup", caption: "Morning Latte", span: "" },
  { src: IMG.roastery, alt: "Warm roastery corner with shelves of beans", caption: "The Roastery", span: "row-span-2" },
  { src: IMG.croissant, alt: "Golden butter croissant on a ceramic plate", caption: "Baked at Dawn", span: "" },
  { src: IMG.coldBrew, alt: "Cold brew over a large clear ice cube", caption: "24-Hour Cold Brew", span: "col-span-2 lg:col-span-1" },
  { src: IMG.cappuccino, alt: "Cappuccino with cocoa-dusted foam", caption: "Classic Cappuccino", span: "hidden lg:block" },
];
