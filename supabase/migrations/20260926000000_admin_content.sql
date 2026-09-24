-- L’AURA — the cafe runs its own site.
--
-- Run after 20260925000000_amend_orders.sql (Dashboard → SQL Editor, or
-- `supabase db push`). Safe to re-run.
--
-- What this adds
--   categories                 the menu's own sections, editable in /admin/menu-sections
--   site_content               every word and picture on the home page, as JSON
--                              blocks staff edit in /admin/home
--   orders.payment_requested_at  a guest asking to settle before their order
--                              is finished; request_bill() sets it and the
--                              counter sees it in the queue

-- --------------------------------------------------------- menu sections
create table if not exists public.categories (
  id         text primary key check (id ~ '^[a-z0-9-]{1,30}$'),
  label      text not null check (char_length(btrim(label)) between 1 and 40),
  sort_order int not null default 100 check (sort_order between 0 and 9999),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- the four the site shipped with, plus anything products already use
insert into public.categories (id, label, sort_order) values
  ('hot', 'Hot drinks', 10),
  ('iced', 'Iced drinks', 20),
  ('bakery', 'Bakery', 30),
  ('beans', 'Beans', 40)
on conflict (id) do nothing;

insert into public.categories (id, label, sort_order)
select distinct p.category, initcap(replace(p.category, '-', ' ')), 100
from public.products p
where p.category is not null
  and p.category ~ '^[a-z0-9-]{1,30}$'
  and not exists (select 1 from public.categories c where c.id = p.category)
on conflict (id) do nothing;

-- a product now belongs to a row staff can edit, not to a fixed list
alter table public.products drop constraint if exists products_category;
alter table public.products drop constraint if exists products_category_fk;
alter table public.products add constraint products_category_fk
  foreign key (category) references public.categories (id) on update cascade;

alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert (id, label, sort_order, active) on public.categories to authenticated;
grant update (label, sort_order, active) on public.categories to authenticated;
grant delete on public.categories to authenticated;

drop policy if exists "Menu sections are public" on public.categories;
create policy "Menu sections are public" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Staff add menu sections" on public.categories;
create policy "Staff add menu sections" on public.categories
  for insert to authenticated with check ((select public.is_staff()));

drop policy if exists "Staff edit menu sections" on public.categories;
create policy "Staff edit menu sections" on public.categories
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

drop policy if exists "Staff remove menu sections" on public.categories;
create policy "Staff remove menu sections" on public.categories
  for delete to authenticated using ((select public.is_staff()));

-- ------------------------------------------------------- the home page
-- One row per block of the page. The site ships with sensible copy and falls
-- back to it for anything staff haven't written yet, so an empty table is
-- still a complete home page.
create table if not exists public.site_content (
  key        text primary key check (key ~ '^[a-z0-9_.-]{1,40}$'),
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert (key, value, updated_at, updated_by) on public.site_content to authenticated;
grant update (value, updated_at, updated_by) on public.site_content to authenticated;

drop policy if exists "The site is public" on public.site_content;
create policy "The site is public" on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists "Staff write the site" on public.site_content;
create policy "Staff write the site" on public.site_content
  for insert to authenticated with check ((select public.is_staff()));

drop policy if exists "Staff edit the site" on public.site_content;
create policy "Staff edit the site" on public.site_content
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- --------------------------------------------- paying before it's ready
alter table public.orders add column if not exists payment_requested_at timestamptz;

create or replace function public.get_order(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id',                   o.id,
    'order_number',         o.order_number,
    'customer_name',        o.customer_name,
    'table_number',         o.table_number,
    'note',                 o.note,
    'status',               o.status,
    'subtotal',             o.subtotal,
    'tax',                  o.tax,
    'tax_rate',             0.0925,
    'total',                o.total,
    'created_at',           o.created_at,
    'paid_at',              o.paid_at,
    'payment_method',       o.payment_method,
    'payment_requested_at', o.payment_requested_at,
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

/** A guest asking to settle now, without waiting for the drinks. */
create or replace function public.request_bill(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_order_open(p_id);
  update public.orders
     set payment_requested_at = coalesce(payment_requested_at, now()), updated_at = now()
   where id = p_id;
  return public.get_order(p_id);
end;
$$;

revoke execute on function public.request_bill(uuid) from public;
grant execute on function public.request_bill(uuid) to anon, authenticated;

-- the counter needs to see who is waiting to pay
create index if not exists orders_waiting_to_pay_idx on public.orders (payment_requested_at)
  where paid_at is null and payment_requested_at is not null;
