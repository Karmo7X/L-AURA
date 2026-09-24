-- L’AURA table service — order from the table, pay at the counter.
--
-- Run after 20260922000000_hero_products.sql (Dashboard → SQL Editor, or
-- `supabase db push`). Safe to re-run.
--
-- What this adds
--   orders.table_number  which table the order came from (from /order?table=5)
--   orders.note          anything the guest asked for
--   a queue staff work through at /admin/orders: they can see every order and
--   move it along (placed → preparing → ready → collected) — and nothing else.
--   Guests still can't read or write the orders table directly; they only get
--   their own order back from place_order / get_order.

alter table public.orders
  add column if not exists table_number text,
  add column if not exists note text;

alter table public.orders drop constraint if exists orders_table_number;
alter table public.orders add constraint orders_table_number
  check (table_number is null or (char_length(table_number) between 1 and 8 and table_number ~ '^[A-Za-z0-9 -]+$'));
alter table public.orders drop constraint if exists orders_note_length;
alter table public.orders add constraint orders_note_length
  check (note is null or char_length(note) <= 200);

-- the working queue, newest first
create index if not exists orders_open_idx on public.orders (created_at desc)
  where status in ('placed', 'preparing', 'ready');

-- ----------------------------------------------------------- the order
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
    'table_number',  o.table_number,
    'note',          o.note,
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

-- the older two-argument version is replaced by the one below
drop function if exists public.place_order(jsonb, text);

create or replace function public.place_order(
  p_items         jsonb,
  p_customer_name text default null,
  p_table         text default null,
  p_note          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name     text := nullif(btrim(p_customer_name), '');
  v_table    text := nullif(btrim(p_table), '');
  v_note     text := nullif(btrim(p_note), '');
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
  if v_table is not null and (char_length(v_table) > 8 or v_table !~ '^[A-Za-z0-9 -]+$') then
    raise exception 'That table number doesn’t look right.' using errcode = '22023';
  end if;
  if char_length(v_note) > 200 then
    raise exception 'Please keep the note under 200 characters.' using errcode = '22023';
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

  insert into public.orders (customer_name, table_number, note)
  values (v_name, v_table, v_note)
  returning id into v_order_id;

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

revoke execute on function public.place_order(jsonb, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text) to anon, authenticated;

-- ------------------------------------------------------- the staff queue
-- Staff read every order and may only change its status; guests (anon) still
-- have no access to these tables at all.
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "Staff see orders" on public.orders;
create policy "Staff see orders" on public.orders
  for select to authenticated using ((select public.is_staff()));

drop policy if exists "Staff move orders along" on public.orders;
create policy "Staff move orders along" on public.orders
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

drop policy if exists "Staff see order lines" on public.order_items;
create policy "Staff see order lines" on public.order_items
  for select to authenticated using ((select public.is_staff()));
