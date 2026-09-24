-- L’AURA payments — the cashier scans the QR on the invoice and settles it.
--
-- Run after 20260923000000_table_orders.sql (Dashboard → SQL Editor, or
-- `supabase db push`). Safe to re-run.
--
-- Every invoice carries a QR code pointing at /admin/pay/<order id>. A member
-- of staff opens it, taps Cash or Card, and settle_order() stamps the order:
-- who took the money, when, and how. Guests can't reach that function, and
-- staff can't backdate it or change the amount — the function fills those in.

alter table public.orders
  add column if not exists paid_at        timestamptz,
  add column if not exists paid_by        uuid references auth.users (id) on delete set null,
  add column if not exists payment_method text;

alter table public.orders drop constraint if exists orders_payment_method;
alter table public.orders add constraint orders_payment_method
  check (payment_method is null or payment_method in ('cash', 'card'));

create index if not exists orders_paid_idx on public.orders (paid_at desc) where paid_at is not null;

/**
 * Settle an order at the counter. Returns the order, or raises if the caller
 * isn't staff. Settling twice keeps the first payment and simply returns it,
 * so a double scan can't double-charge anyone.
 */
create or replace function public.settle_order(p_id uuid, p_method text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_paid timestamptz;
begin
  if not public.is_staff() then
    raise exception 'Only cafe staff can take payment.' using errcode = '42501';
  end if;
  if p_method not in ('cash', 'card') then
    raise exception 'Pay by cash or card.' using errcode = '22023';
  end if;

  select paid_at into v_paid from public.orders where id = p_id;
  if not found then
    raise exception 'That order no longer exists.' using errcode = '22023';
  end if;

  if v_paid is null then
    update public.orders
       set status = 'collected',
           paid_at = now(),
           paid_by = (select auth.uid()),
           payment_method = p_method
     where id = p_id;
  end if;

  return public.get_order(p_id);
end;
$$;

revoke execute on function public.settle_order(uuid, text) from public;
grant execute on function public.settle_order(uuid, text) to authenticated;

-- the invoice and the counter screen show how it was paid
create or replace function public.get_order(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id',             o.id,
    'order_number',   o.order_number,
    'customer_name',  o.customer_name,
    'table_number',   o.table_number,
    'note',           o.note,
    'status',         o.status,
    'subtotal',       o.subtotal,
    'tax',            o.tax,
    'tax_rate',       0.0925,
    'total',          o.total,
    'created_at',     o.created_at,
    'paid_at',        o.paid_at,
    'payment_method', o.payment_method,
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
