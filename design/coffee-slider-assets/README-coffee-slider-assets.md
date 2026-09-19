# Coffee Slider Layer Asset Set

Stylized 3D-look illustrations for Espresso, Cappuccino, Latte, and Mocha, built as vector art (SVG) and exported to PNG. Transparent backgrounds throughout, so they drop straight into a slider/hero layer over any background image or color.

**A note on "3D-style":** these are hand-shaded vector illustrations (gradient-based lighting, soft shadows, glass/ceramic highlights) — not photoreal 3D renders and not native Blender/PSD files, since I can't operate 3D or Adobe software directly. If you need true photoreal renders or a .blend/.psd source, the SVGs here are a solid stand-in for a slider and a clean visual reference for a 3D artist to model from. I'm happy to iterate further on the illustrated style, or point you to how to brief a 3D artist using this spec.

---

## 1. Visual style & treatment

- Soft, directional top-left key light with warm ambient fill — consistent across all four drinks.
- Gradient-based shading on every vessel (cup, glass, mug) to imply cylindrical form and specular highlight.
- Semi-transparent "glass" rendering for the Latte (layered visible espresso/milk/foam).
- Soft radial ground shadow + a thin secondary contact shadow under each vessel for grounding.
- Rounded, friendly geometry — matches a modern, premium café UI rather than a literal photo.

## 2. Image specs

| Format | Use case |
|---|---|
| `.svg` | Infinitely scalable source — use directly in web builds, or hand to a designer/3D artist as a reference |
| `.png` @ 1920×1080 | Full-bleed hero/slider background layer |
| `.png` @ 1280×720 | Standard responsive breakpoint (tablet/laptop) |
| `.png` @ 640×360 | Mobile / thumbnail / lazy-load placeholder |

All PNGs are transparent-background, 32-bit RGBA, web-optimized. Subject is centered and sized to leave generous negative space for slider text/UI overlays (see Section 7).

## 3. Variations

Each drink currently ships as a **front, eye-level "hero" angle** — the standard slider-ready view. The build is layered (cup/glass, liquid, foam/crema, handle, shadow) as separate SVG groups, so producing the additional angles is straightforward from here:

| Suggested variant | Purpose |
|---|---|
| Front (delivered) | Primary slider frame |
| 3/4 turned (~30°) | Secondary slide / hover state |
| Top-down | Menu card / small thumbnail |
| Close crop on foam/crema | Detail inset or Instagram-style tile |

I can generate any of these next — just say which drinks/angles to prioritize, since hand-building all 4 drinks × 4 angles is a larger batch than fits in one pass.

## 4. Color & branding — palette

A single shared palette ties all four drinks together for brand consistency:

| Swatch | Hex | Role |
|---|---|---|
| Espresso Dark | `#3B2419` | Deepest coffee tone, text-safe dark |
| Espresso Mid | `#5C3A2E` | Mocha body, mid shadows |
| Caramel | `#A9714B` | Crema, mid-tone coffee |
| Latte Tan | `#D8B98C` / `#E4CBA8` | Milk-coffee blend, foam shadow |
| Cream | `#F5EDE4` | Foam, milk highlight |
| Ceramic White | `#FBF7F2` / `#FFFFFF` | Cup/mug body highlight |
| Gold Accent | `#C89B5C` | Crema highlight, premium accent line |
| Neutral Warm Grey | `#E3D9CC` | Shadow/ceramic mid-tone |

This is a warm, neutral, low-saturation palette — reads as "premium café" rather than novelty/candy coffee branding, and stays legible against both light and dark UI backgrounds.

## 5. Accessibility

Suggested `alt` text per asset (edit product names to match your menu copy):

- **Espresso:** "Small white ceramic espresso cup on a saucer, filled with dark espresso topped with golden crema."
- **Cappuccino:** "White ceramic cappuccino cup on a saucer, topped with thick milk foam dusted with cocoa."
- **Latte:** "Tall clear glass latte with layered espresso, steamed milk, and a heart-shaped latte-art top."
- **Mocha:** "Brown mocha mug topped with whipped cream and a chocolate drizzle swirl."

High-contrast notes:
- All four subjects sit on a transparent background — verify contrast against your actual site background (the palette above is mid-to-dark, so it holds up on both cream and dark UI themes).
- Keep slider text on a scrim or solid panel rather than directly over the drink art, since the busy foam/crema areas can reduce text legibility.
- Ground shadows are kept low-opacity (≤35%) so they don't create a harsh contrast band under a dark theme.

## 6. Deliverables & naming convention

```
coffee-assets/
├── espresso_front_1920x1080.svg
├── cappuccino_front_1920x1080.svg
├── latte_front_1920x1080.svg
├── mocha_front_1920x1080.svg
├── png/
│   ├── 1920x1080/  <drink>_front_1920x1080.png
│   ├── 1280x720/   <drink>_front_1280x720.png
│   └── 640x360/    <drink>_front_640x360.png
└── README-coffee-slider-assets.md
```

Naming pattern: `<drink>_<angle>_<width>x<height>.<ext>` — lowercase, underscore-separated, so future angle variants (e.g. `latte_3quarter_1920x1080.png`, `mocha_topdown_640x360.png`) slot in without renaming existing files.

**Not included (would need dedicated software I don't have access to):** native `.psd` layer files, `.blend` 3D project files, true photoreal renders. If you need those, this SVG set + the palette/lighting notes above is ready to hand to a 3D artist or Photoshop designer as a build reference.

## 7. Usage notes

- **Safe area for text/UI overlays:** each subject is centered with roughly the top 25% and bottom 20% of the 1920×1080 canvas kept clear — safe zones for headline text, CTA buttons, or slider dots.
- **Cropping:** for a square or portrait crop (e.g. mobile hero), crop from the horizontal center outward — all subjects are centered on the X-axis with symmetrical shadow, so off-center crops aren't needed.
- **Layering order in a slider:** background photo/color → ground shadow (already baked in) → drink PNG → text/UI layer. If compositing over a busy photo background, consider adding a subtle drop shadow filter in CSS for extra separation.
- **File organization:** keep the `png/<resolution>/` folders separate per breakpoint so a `<picture>`/`srcset` build can point directly at the matching folder.
