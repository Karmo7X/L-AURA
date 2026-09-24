-- L’AURA — one bill per table.
--
-- Run after 20260924000000_payments.sql (Dashboard → SQL Editor, or
-- `supabase db push`). Safe to re-run.
--
-- What this adds
--   orders.updated_at                   when the order last changed
--   add_to_order(id, items)             puts more drinks on an order the guest
--                                       already placed, so they still leave
--                                       with a single invoice
--   amend_order_item(id, item_id, qty)  change or drop a line — only while the
--                                       order is still waiting to be made
--
-- Both price every line from the products table, never from the request, and
-- both refuse an order that is paid, collected, cancelled or more than half a
-- day old. Like get_order, they are reached by the order's random UUID: the
-- guest has it on their phone and on the invoice, and nobody else does.

alter table public.orders add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------- shared pricing
-- Internal: totals always come from the lines, never from the client.
create or replace function public.reprice_order(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subtotal numeric(10, 2);
  v_tax      numeric(10, 2);
begin
  select coalesce(sum(line_total), 0) into v_subtotal from public.order_items where order_id = p_id;
  v_tax := round(v_subtotal * 0.0925, 2);
  update public.orders
     set subtotal = v_subtotal, tax = v_tax, total = v_subtotal + v_tax, updated_at = now()
   where id = p_id;
end;
$$;

revoke execute on function public.reprice_order(uuid) from public, anon, authenticated;

-- Internal: the checks both amendments share. Raises if the order is closed.
create or replace function public.assert_order_open(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status  text;
  v_paid    timestamptz;
  v_created timestamptz;
begin
  select status, paid_at, created_at into v_status, v_paid, v_created
    from public.orders where id = p_id for update;
  if not found then
    raise exception 'We can’t find that order.' using errcode = '22023';
  end if;
  if v_paid is not null then
    raise exception 'That order is already paid — please start a new one.' using errcode = '22023';
  end if;
  if v_status in ('collected', 'cancelled') then
    raise exception 'That order is closed — please start a new one.' using errcode = '22023';
  end if;
  if v_created < now() - interval '12 hours' then
    raise exception 'That order is from a while back — please start a new one.' using errcode = '22023';
  end if;
  return v_status;
end;
$$;

revoke execute on function public.assert_order_open(uuid) from public, anon, authenticated;

-- ------------------------------------------------------ add to an order
create or replace function public.add_to_order(p_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status  text;
  v_unknown text;
  v_over    text;
  v_lines   int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'There’s nothing to add.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'That’s a lot of lines at once — please split it up.' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_items) as x (id text, qty int)
    group by x.id
    having x.id is null or bool_or(x.qty is null or x.qty < 1) or sum(x.qty) > 20
  ) then
    raise exception 'Each item needs a quantity from 1 to 20.' using errcode = '22023';
  end if;

  v_status := public.assert_order_open(p_id);

  -- hidden products can't be ordered
  select x.id into v_unknown
  from jsonb_to_recordset(p_items) as x (id text, qty int)
  left join public.products p on p.id = x.id and p.active
  where p.id is null
  limit 1;
  if v_unknown is not null then
    raise exception 'We don’t serve “%” right now.', v_unknown using errcode = '22023';
  end if;

  -- a line can only hold 20 of the same drink
  select oi.name into v_over
  from public.order_items oi
  join (
    select x.id, sum(x.qty)::int as qty
    from jsonb_to_recordset(p_items) as x (id text, qty int)
    group by x.id
  ) a on a.id = oi.item_id
  where oi.order_id = p_id and oi.qty + a.qty > 20
  limit 1;
  if v_over is not null then
    raise exception 'That would be more than 20 × %, which is our limit per line.', v_over using errcode = '22023';
  end if;

  select count(*) into v_lines
  from (
    select oi.item_id from public.order_items oi where oi.order_id = p_id
    union
    select x.id from jsonb_to_recordset(p_items) as x (id text, qty int)
  ) lines;
  if v_lines > 20 then
    raise exception 'That’s a lot of lines for one order — please start a second one.' using errcode = '22023';
  end if;

  -- more of something already on the order
  update public.order_items oi
     set qty = oi.qty + a.qty, line_total = oi.unit_price * (oi.qty + a.qty)
    from (
      select x.id, sum(x.qty)::int as qty
      from jsonb_to_recordset(p_items) as x (id text, qty int)
      group by x.id
    ) a
   where oi.order_id = p_id and oi.item_id = a.id;

  -- and the drinks that weren't on it yet, priced from the menu
  insert into public.order_items (order_id, item_id, name, unit_price, qty, line_total)
  select p_id, p.id, p.name, p.price, a.qty, p.price * a.qty
  from (
    select x.id, sum(x.qty)::int as qty
    from jsonb_to_recordset(p_items) as x (id text, qty int)
    group by x.id
  ) a
  join public.products p on p.id = a.id
  where not exists (select 1 from public.order_items oi where oi.order_id = p_id and oi.item_id = a.id)
  order by p.name;

  -- the bar had finished; there's something to make again
  if v_status = 'ready' then
    update public.orders set status = 'preparing' where id = p_id;
  end if;

  perform public.reprice_order(p_id);
  return public.get_order(p_id);
end;
$$;

revoke execute on function public.add_to_order(uuid, jsonb) from public;
grant execute on function public.add_to_order(uuid, jsonb) to anon, authenticated;

-- ----------------------------------------------------- change one line
create or replace function public.amend_order_item(p_id uuid, p_item_id text, p_qty int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_qty is null or p_qty < 0 or p_qty > 20 then
    raise exception 'Choose a quantity from 0 to 20.' using errcode = '22023';
  end if;

  v_status := public.assert_order_open(p_id);
  if v_status <> 'placed' then
    raise exception 'The bar has already started this one — ask at the counter to change it.' using errcode = '22023';
  end if;

  if p_qty = 0 then
    delete from public.order_items where order_id = p_id and item_id = p_item_id;
  else
    update public.order_items
       set qty = p_qty, line_total = unit_price * p_qty
     where order_id = p_id and item_id = p_item_id;
  end if;
  if not found then
    raise exception 'That isn’t on the order.' using errcode = '22023';
  end if;

  -- an order with nothing left on it is simply called off
  if not exists (select 1 from public.order_items where order_id = p_id) then
    update public.orders set status = 'cancelled' where id = p_id;
  end if;

  perform public.reprice_order(p_id);
  return public.get_order(p_id);
end;
$$;

revoke execute on function public.amend_order_item(uuid, text, int) from public;
grant execute on function public.amend_order_item(uuid, text, int) to anon, authenticated;
