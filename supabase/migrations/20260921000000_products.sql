-- L’AURA products — the cafe's catalogue, managed from /admin/products
--
-- Run after 20260919000000_orders.sql, in the Supabase dashboard → SQL Editor
-- (or `supabase db push`). Safe to re-run: nothing here overwrites a product
-- the cafe has edited.
--
-- Who can do what
--   Everyone (the website)  reads products that are on the menu (active).
--   Cafe staff               add, edit, hide and delete products, and upload
--                            their photos. Staff are signed-in users listed in
--                            public.staff — see "Giving someone access" below.
--   Nobody else              can change anything: row-level security checks
--                            every write against public.staff.
--
-- Giving someone access to /admin
--   1. Dashboard → Authentication → Users → Add user → Create new user
--      (email + password, tick "Auto Confirm User").
--   2. Run, with their email:
--        insert into public.staff (user_id, display_name)
--        select id, 'Owner' from auth.users where email = 'you@example.com';
--   To remove someone:  delete from public.staff where user_id = '…';

-- ------------------------------------------------------------ products
do $$
begin
  -- an early version of the orders migration called this table menu_items
  if to_regclass('public.menu_items') is not null then
    if to_regclass('public.products') is null then
      alter table public.menu_items rename to products;
    else
      -- both exist: keep products, fold anything missing into it, retire menu_items
      insert into public.products (id, name, price, active)
      select id, name, price, active from public.menu_items
      on conflict (id) do nothing;
      alter table public.order_items drop constraint if exists order_items_item_id_fkey;
      drop table public.menu_items;
    end if;
  end if;
end $$;

create table if not exists public.products (
  id     text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  name   text not null,
  price  numeric(8, 2) not null check (price >= 0),
  active boolean not null default true
);

alter table public.products
  add column if not exists description text,
  add column if not exists origin      text,
  add column if not exists category    text not null default 'hot',
  add column if not exists image_url   text,
  add column if not exists accent      text not null default '#8a4526',
  add column if not exists featured    boolean not null default false,
  add column if not exists sort_order  int not null default 100,
  add column if not exists created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  add column if not exists created_at  timestamptz not null default now(),
  add column if not exists updated_at  timestamptz not null default now();

alter table public.products drop constraint if exists products_name_length;
alter table public.products add constraint products_name_length
  check (char_length(btrim(name)) between 1 and 60);
alter table public.products drop constraint if exists products_price_range;
alter table public.products add constraint products_price_range
  check (price between 0 and 999.99);
alter table public.products drop constraint if exists products_description_length;
alter table public.products add constraint products_description_length
  check (description is null or char_length(description) <= 240);
alter table public.products drop constraint if exists products_origin_length;
alter table public.products add constraint products_origin_length
  check (origin is null or char_length(origin) <= 60);
alter table public.products drop constraint if exists products_category;
alter table public.products add constraint products_category
  check (category in ('hot', 'iced', 'bakery', 'beans'));
alter table public.products drop constraint if exists products_accent;
alter table public.products add constraint products_accent
  check (accent ~ '^#[0-9a-fA-F]{6}$');
alter table public.products drop constraint if exists products_image_url;
alter table public.products add constraint products_image_url
  check (image_url is null or (char_length(image_url) <= 500 and image_url ~ '^(https?://|/)'));
alter table public.products drop constraint if exists products_sort_order;
alter table public.products add constraint products_sort_order
  check (sort_order between 0 and 9999);

create index if not exists products_menu_idx on public.products (active, sort_order, name);

-- order lines always point at products (re-pointed if the table was renamed)
do $$
begin
  if to_regclass('public.order_items') is not null then
    alter table public.order_items drop constraint if exists order_items_item_id_fkey;
    alter table public.order_items add constraint order_items_item_id_fkey
      foreign key (item_id) references public.products (id);
  end if;
end $$;

-- details for the starter products — only filled in if nobody has yet
insert into public.products (id, name, price, description, origin, category, accent, featured, sort_order) values
  ('espresso',   'Espresso',          2.50, 'Dense, syrupy, cocoa-dark',          'Huila · Colombia', 'hot',  '#8a4526', true,  10),
  ('latte',      'Latte',             4.00, 'Silk microfoam, soft sweetness',     'House Blend',      'hot',  '#a9713c', true,  20),
  ('cold-brew',  'Cold Brew',         4.50, 'Steeped 24 hours, over cut ice',     'Guji · Ethiopia',  'iced', '#5d3a22', true,  30),
  ('macchiato',  'Caramel Macchiato', 4.75, 'Vanilla, milk, burnt-sugar drizzle', 'House Blend',      'hot',  '#b9762f', true,  40),
  ('frappe',     'Frappé',            5.50, 'Blended with ice, caramel popcorn crown', 'Salted caramel', 'iced', '#c07a36', false, 50),
  ('iced-mocha', 'Iced Mocha',        5.25, 'Espresso and dark chocolate over ice', '72% chocolate',  'iced', '#6b3a22', false, 60)
on conflict (id) do update
  set description = excluded.description,
      origin      = excluded.origin,
      category    = excluded.category,
      accent      = excluded.accent,
      featured    = excluded.featured,
      sort_order  = excluded.sort_order
  where public.products.description is null;

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- staff
create table if not exists public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 60),
  created_at   timestamptz not null default now()
);

-- staff are added in the dashboard (see the top of this file), never by the site
alter table public.staff enable row level security;
revoke all on public.staff from anon, authenticated;
grant select on public.staff to authenticated;
drop policy if exists "Staff can see their own entry" on public.staff;
create policy "Staff can see their own entry" on public.staff
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- ------------------------------------------------------ product access
alter table public.products enable row level security;

drop policy if exists "Menu is public" on public.products;
drop policy if exists "Products on the menu are public" on public.products;
create policy "Products on the menu are public" on public.products
  for select to anon, authenticated using (active);

drop policy if exists "Staff see every product" on public.products;
create policy "Staff see every product" on public.products
  for select to authenticated using ((select public.is_staff()));

drop policy if exists "Staff add products" on public.products;
create policy "Staff add products" on public.products
  for insert to authenticated with check ((select public.is_staff()));

drop policy if exists "Staff edit products" on public.products;
create policy "Staff edit products" on public.products
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

drop policy if exists "Staff remove products" on public.products;
create policy "Staff remove products" on public.products
  for delete to authenticated using ((select public.is_staff()));

-- column by column: ids, authorship and timestamps can't be set from outside
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert (id, name, price, active, description, origin, category, image_url, accent, featured, sort_order)
  on public.products to authenticated;
grant update (name, price, active, description, origin, category, image_url, accent, featured, sort_order)
  on public.products to authenticated;
grant delete on public.products to authenticated;

-- ------------------------------------------------------- product photos
-- A public bucket: anyone can view a photo by its URL, only staff can
-- upload, replace or remove one.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff upload product images" on storage.objects;
create policy "Staff upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_staff()));

drop policy if exists "Staff see product images" on storage.objects;
create policy "Staff see product images" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));

drop policy if exists "Staff replace product images" on storage.objects;
create policy "Staff replace product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));

drop policy if exists "Staff remove product images" on storage.objects;
create policy "Staff remove product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_staff()));

-- ------------------------------------------------------------- ordering
-- (re)defined against products, in case this database still had the old
-- menu_items version of place_order
create or replace function public.place_order(p_items jsonb, p_customer_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name     text := nullif(btrim(p_customer_name), '');
  v_order_id uuid;
  v_unknown  text;
  v_subtotal numeric(10, 2);
  v_tax      numeric(10, 2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The order is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'That’s a lot of lines for one order — please split it up.' using errcode = '22023';
  end if;
  if char_length(v_name) > 80 then
    raise exception 'Please keep the name under 80 characters.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as x (id text, qty int)
    group by x.id
    having x.id is null or bool_or(x.qty is null or x.qty < 1) or sum(x.qty) > 20
  ) then
    raise exception 'Each item needs a quantity from 1 to 20.' using errcode = '22023';
  end if;

  -- hidden products can't be ordered
  select x.id into v_unknown
  from jsonb_to_recordset(p_items) as x (id text, qty int)
  left join public.products p on p.id = x.id and p.active
  where p.id is null
  limit 1;
  if v_unknown is not null then
    raise exception 'We don’t serve “%” right now.', v_unknown using errcode = '22023';
  end if;

  insert into public.orders (customer_name) values (v_name) returning id into v_order_id;

  -- prices come from the products table, never from the request
  insert into public.order_items (order_id, item_id, name, unit_price, qty, line_total)
  select v_order_id, p.id, p.name, p.price, sum((e.el ->> 'qty')::int)::int, p.price * sum((e.el ->> 'qty')::int)
  from jsonb_array_elements(p_items) with ordinality as e (el, n)
  join public.products p on p.id = e.el ->> 'id'
  group by p.id, p.name, p.price
  order by min(e.n);

  select sum(line_total) into v_subtotal from public.order_items where order_id = v_order_id;
  v_tax := round(v_subtotal * 0.0925, 2);
  update public.orders
     set subtotal = v_subtotal, tax = v_tax, total = v_subtotal + v_tax
   where id = v_order_id;

  return public.get_order(v_order_id);
end;
$$;

revoke execute on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;
