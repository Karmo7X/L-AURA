-- L’AURA hero slider — which products star in the big scroll slider at the
-- top of the site, and how they're presented there.
--
-- Run after 20260921000000_products.sql (Dashboard → SQL Editor, or
-- `supabase db push`). Safe to re-run: the starter drinks are only set up
-- the first time, so staff changes are never undone.
--
-- Staff manage all of this from /admin/products:
--   in_hero         show this product in the hero slider (if it's also on the menu)
--   hero_image_url  a cut-out of the drink on a transparent background; without
--                   one, the slider shows the product photo in a frame instead
--   kicker          a short line above the name, e.g. "Pure · Intense"
--   strength        1–5 dots in the slider's details
--   milk, size      e.g. "Steamed", "12 oz"
-- The slider shows them in the menu's order (sort_order, then name).

alter table public.products
  add column if not exists in_hero        boolean not null default false,
  add column if not exists hero_image_url text,
  add column if not exists kicker         text,
  add column if not exists strength       smallint,
  add column if not exists milk           text,
  add column if not exists size           text;

alter table public.products drop constraint if exists products_hero_image_url;
alter table public.products add constraint products_hero_image_url
  check (hero_image_url is null or (char_length(hero_image_url) <= 500 and hero_image_url ~ '^(https?://|/)'));
alter table public.products drop constraint if exists products_kicker_length;
alter table public.products add constraint products_kicker_length
  check (kicker is null or char_length(kicker) <= 40);
alter table public.products drop constraint if exists products_strength;
alter table public.products add constraint products_strength
  check (strength is null or strength between 1 and 5);
alter table public.products drop constraint if exists products_milk_length;
alter table public.products add constraint products_milk_length
  check (milk is null or char_length(milk) <= 30);
alter table public.products drop constraint if exists products_size_length;
alter table public.products add constraint products_size_length
  check (size is null or char_length(size) <= 20);

-- staff can set the new fields (column grants add to the products migration's)
grant insert (in_hero, hero_image_url, kicker, strength, milk, size) on public.products to authenticated;
grant update (in_hero, hero_image_url, kicker, strength, milk, size) on public.products to authenticated;

create index if not exists products_hero_idx on public.products (sort_order, name) where in_hero and active;

-- The four drinks the slider launched with, with their cut-outs from
-- public/drinks. Only applied to a product nobody has set up for the hero yet.
update public.products p
   set in_hero        = true,
       hero_image_url = s.hero_image_url,
       kicker         = coalesce(p.kicker, s.kicker),
       strength       = coalesce(p.strength, s.strength),
       milk           = coalesce(p.milk, s.milk),
       size           = coalesce(p.size, s.size),
       -- the fuller hero copy, unless the cafe already rewrote the description
       description    = case when p.description = s.old_description then s.description else p.description end
  from (values
    ('espresso',   '/drinks/espresso.png',   'Pure · Intense',   5::smallint, 'None',    '2 oz',
     'Dense, syrupy, cocoa-dark',
     'A double shot pulled at nine bars. Dense tiger-striped crema, cocoa and dark plum.'),
    ('latte',      '/drinks/latte.png',      'Silky · Mellow',   3::smallint, 'Steamed', '8 oz',
     'Silk microfoam, soft sweetness',
     'Velvet microfoam over a double shot, free-poured into a rosetta. Silky, mellow and quietly sweet.'),
    ('frappe',     '/drinks/frappe.png',     'Iced · Caramel',   2::smallint, 'Whole',   '16 oz',
     'Blended with ice, caramel popcorn crown',
     'Espresso blended with milk and ice, crowned with caramel popcorn and a slow salted-caramel drip.'),
    ('iced-mocha', '/drinks/iced-mocha.png', 'Iced · Chocolate', 3::smallint, 'Cold',    '16 oz',
     'Espresso and dark chocolate over ice',
     'Espresso and dark chocolate over ice, finished with whipped cream and a cocoa crumble.')
  ) as s (id, hero_image_url, kicker, strength, milk, size, old_description, description)
 where p.id = s.id
   and p.hero_image_url is null
   and not p.in_hero;
