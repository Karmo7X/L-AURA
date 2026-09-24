-- L’AURA orders
--
-- Run once in the Supabase dashboard → SQL Editor (or `supabase db push`),
-- then 20260921000000_products.sql. Safe to re-run: tables are created if
-- missing and functions are replaced; the starter products are only created
-- the first time, so re-running never undoes changes made by cafe staff.
--
-- Security model
--   The site talks to Supabase with the publishable (anon) key, so nothing
--   in the browser can be trusted. Orders and their lines are therefore
--   locked behind row-level security with no policies at all: the public can
--   neither read nor write them directly. The only way in is two functions:
--     place_order(items, name) — prices every line from products, never
--                                from the client, and saves the order
--     get_order(id)            — returns one order by its random UUID, which
--                                is what the invoice link carries
--   Staff see every order in the dashboard's Table Editor.

-- -------------------------------------------------------------- products
-- A minimal product list so orders work on their own; the products
-- migration grows it into the full catalogue the cafe manages.
do $$
begin
  -- an earlier version of this file called the table menu_items
  if to_regclass('public.menu_items') is not null and to_regclass('public.products') is null then
    alter table public.menu_items rename to products;
  end if;

  if to_regclass('public.products') is null then
    create table public.products (
      id     text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
      name   text not null,
      price  numeric(8, 2) not null check (price >= 0),
      active boolean not null default true
    );

    insert into public.products (id, name, price) values
      ('espresso',   'Espresso',          2.50),
      ('latte',      'Latte',             4.00),
      ('frappe',     'Frappé',            5.50),
      ('iced-mocha', 'Iced Mocha',        5.25),
      ('cold-brew',  'Cold Brew',         4.50),
      ('macchiato',  'Caramel Macchiato', 4.75);

    -- the menu is readable by anyone; changing it is the products migration's job
    alter table public.products enable row level security;
    revoke all on public.products from anon, authenticated;
    grant select on public.products to anon, authenticated;
    create policy "Products on the menu are public" on public.products
      for select to anon, authenticated using (active);
  end if;
end $$;

-- ---------------------------------------------------------------- orders
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  bigint generated always as identity (start with 1001) unique,
  customer_name text check (char_length(customer_name) <= 80),
  status        text not null default 'placed'
                check (status in ('placed', 'preparing', 'ready', 'collected', 'cancelled')),
  subtotal      numeric(10, 2) not null default 0,
  tax           numeric(10, 2) not null default 0,
  total         numeric(10, 2) not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.order_items (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  item_id    text not null references public.products (id),
  name       text not null,
  unit_price numeric(8, 2) not null,
  qty        int not null check (qty between 1 and 20),
  line_total numeric(10, 2) not null
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- no policies on purpose: only the functions below can touch these
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.orders, public.order_items from anon, authenticated;

-- ------------------------------------------------------------- functions
create or replace function public.get_order(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id',            o.id,
    'order_number',  o.order_number,
    'customer_name', o.customer_name,
    'status',        o.status,
    'subtotal',      o.subtotal,
    'tax',           o.tax,
    'tax_rate',      0.0925,
    'total',         o.total,
    'created_at',    o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'item_id',    i.item_id,
               'name',       i.name,
               'unit_price', i.unit_price,
               'qty',        i.qty,
               'line_total', i.line_total
             ) order by i.id)
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_id;
$$;

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

  -- each line: a menu id and 1–20 of it (repeated ids are merged below)
  if exists (
    select 1
    from jsonb_to_recordset(p_items) as x (id text, qty int)
    group by x.id
    having x.id is null or bool_or(x.qty is null or x.qty < 1) or sum(x.qty) > 20
  ) then
    raise exception 'Each item needs a quantity from 1 to 20.' using errcode = '22023';
  end if;

  select x.id into v_unknown
  from jsonb_to_recordset(p_items) as x (id text, qty int)
  left join public.products m on m.id = x.id and m.active
  where m.id is null
  limit 1;
  if v_unknown is not null then
    raise exception 'We don’t serve “%” right now.', v_unknown using errcode = '22023';
  end if;

  insert into public.orders (customer_name) values (v_name) returning id into v_order_id;

  -- prices come from the products table, never from the request
  insert into public.order_items (order_id, item_id, name, unit_price, qty, line_total)
  select v_order_id, m.id, m.name, m.price, sum((e.el ->> 'qty')::int)::int, m.price * sum((e.el ->> 'qty')::int)
  from jsonb_array_elements(p_items) with ordinality as e (el, n)
  join public.products m on m.id = e.el ->> 'id'
  group by m.id, m.name, m.price
  order by min(e.n);

  select sum(line_total) into v_subtotal from public.order_items where order_id = v_order_id;
  v_tax := round(v_subtotal * 0.0925, 2);
  update public.orders
     set subtotal = v_subtotal, tax = v_tax, total = v_subtotal + v_tax
   where id = v_order_id;

  return public.get_order(v_order_id);
end;
$$;

revoke execute on function public.get_order(uuid) from public;
revoke execute on function public.place_order(jsonb, text) from public;
grant execute on function public.get_order(uuid) to anon, authenticated;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;
