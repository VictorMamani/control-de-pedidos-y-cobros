begin;

-- Keep the initial migration immutable; normalize its temporary role names here.
alter table public.business_memberships
  drop constraint business_memberships_role_check;

update public.business_memberships
set role = case role
  when 'admin' then 'manager'
  when 'staff' then 'seller'
  else role
end;

alter table public.business_memberships
  add constraint business_memberships_role_check
  check (role in ('owner', 'manager', 'seller'));

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  contact_value text check (contact_value is null or char_length(contact_value) <= 100),
  created_at timestamptz not null default now(),
  unique (business_id, id)
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid,
  customer_label_snapshot text check (customer_label_snapshot is null or char_length(customer_label_snapshot) <= 80),
  reference text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  currency text not null default 'BOB' check (currency = 'BOB'),
  total numeric(14, 2) not null default 0 check (total >= 0),
  valid_until date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, reference),
  foreign key (business_id, customer_id) references public.customers(business_id, id) on delete restrict
);

create table public.quotation_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  quotation_id uuid not null,
  description_snapshot text not null check (char_length(trim(description_snapshot)) between 2 and 120),
  sku_snapshot text check (sku_snapshot is null or char_length(sku_snapshot) <= 40),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, quotation_id) references public.quotations(business_id, id) on delete cascade
);

alter table public.audit_events
  drop constraint audit_events_entity_type_check,
  add constraint audit_events_entity_type_check
    check (entity_type in ('business', 'quotation', 'order', 'payment'));

alter table public.orders
  add column quotation_id uuid,
  add column cancelled_reason text check (cancelled_reason is null or char_length(cancelled_reason) between 3 and 160),
  add constraint orders_business_quotation_key unique (business_id, quotation_id),
  add constraint orders_business_quotation_fkey
    foreign key (business_id, quotation_id) references public.quotations(business_id, id) on delete restrict;

create unique index payment_entries_one_reversal_per_entry_idx
  on public.payment_entries (business_id, reverses_entry_id)
  where reverses_entry_id is not null;

alter table public.payment_entries
  add column reversal_reason text check (reversal_reason is null or char_length(reversal_reason) <= 160),
  add constraint payment_entries_reason_only_on_reversal_check
    check (reverses_entry_id is not null or reversal_reason is null);

create index quotations_business_created_idx on public.quotations (business_id, created_at desc);
create index quotation_lines_business_quotation_idx on public.quotation_lines (business_id, quotation_id);
create index customers_business_name_idx on public.customers (business_id, display_name);

-- A non-login, non-BYPASSRLS owner lets the atomic RPCs run with a small set of
-- table privileges while PostgreSQL still applies forced RLS policies.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'bytecx_rpc_owner') then
    create role bytecx_rpc_owner nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end;
$$;

-- Supabase migrations execute as the non-superuser `postgres` role. Grant it
-- membership explicitly so it can assign the RPC owner after creating it.
grant bytecx_rpc_owner to postgres;

create or replace function public.get_business_dashboard(p_business_id uuid)
returns table (
  open_orders bigint,
  preparing_orders bigint,
  ready_orders bigint,
  pending_cents bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_id() is null or not public.is_business_member(p_business_id) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;

  return query
  with line_totals as (
    select order_line.business_id, order_line.order_id,
      sum(round(order_line.quantity * order_line.unit_price, 2) * 100)::bigint as total_cents
    from public.order_lines as order_line
    where order_line.business_id = p_business_id
    group by order_line.business_id, order_line.order_id
  ), payment_totals as (
    select payment.business_id, payment.order_id,
      sum(case when payment.reverses_entry_id is null then payment.amount else -payment.amount end) * 100 as paid_cents
    from public.payment_entries as payment
    where payment.business_id = p_business_id
    group by payment.business_id, payment.order_id
  )
  select
    count(*) filter (where orders.commercial_status = 'confirmed' and orders.fulfillment_status <> 'delivered'),
    count(*) filter (where orders.commercial_status = 'confirmed' and orders.fulfillment_status = 'preparing'),
    count(*) filter (where orders.commercial_status = 'confirmed' and orders.fulfillment_status = 'ready'),
    coalesce(sum(greatest(coalesce(line_totals.total_cents, 0) - coalesce(payment_totals.paid_cents, 0), 0))
      filter (where orders.commercial_status = 'confirmed'), 0)::bigint
  from public.orders as orders
  left join line_totals on line_totals.business_id = orders.business_id and line_totals.order_id = orders.id
  left join payment_totals on payment_totals.business_id = orders.business_id and payment_totals.order_id = orders.id
  where orders.business_id = p_business_id;
end;
$$;

grant usage on schema public to bytecx_rpc_owner;
grant create on schema public to bytecx_rpc_owner;
grant select, insert, update on
  public.businesses,
  public.business_memberships,
  public.orders,
  public.order_lines,
  public.payment_entries,
  public.audit_events,
  public.customers,
  public.quotations,
  public.quotation_lines
to bytecx_rpc_owner;

-- Bridge the authenticated subject without exposing the private auth schema
-- to the limited SECURITY DEFINER owner role.
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid();
$$;

revoke all on function public.current_user_id() from public, anon;
grant execute on function public.current_user_id() to authenticated, bytecx_rpc_owner;

create or replace function public.is_business_creator(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses as business
    where business.id = target_business_id
      and business.created_by = (select auth.uid())
  );
$$;

create or replace function public.has_business_role(target_business_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships as membership
    where membership.business_id = target_business_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any(coalesce(allowed_roles, array[]::text[]))
  );
$$;

revoke all on function public.is_business_creator(uuid) from public, anon;
revoke all on function public.has_business_role(uuid, text[]) from public, anon;
grant execute on function public.is_business_creator(uuid) to authenticated, bytecx_rpc_owner;
grant execute on function public.has_business_role(uuid, text[]) to authenticated, bytecx_rpc_owner;
grant execute on function public.is_business_member(uuid) to bytecx_rpc_owner;

alter table public.businesses force row level security;
alter table public.business_memberships force row level security;
alter table public.orders force row level security;
alter table public.order_lines force row level security;
alter table public.payment_entries force row level security;
alter table public.audit_events force row level security;
alter table public.customers enable row level security;
alter table public.customers force row level security;
alter table public.quotations enable row level security;
alter table public.quotations force row level security;
alter table public.quotation_lines enable row level security;
alter table public.quotation_lines force row level security;

drop policy businesses_select_for_members on public.businesses;
create policy businesses_select_for_members
  on public.businesses for select to public
  using (public.is_business_member(id) or created_by = (select auth.uid()));
create policy businesses_insert_by_creator
  on public.businesses for insert to public
  with check (created_by = (select auth.uid()));

drop policy memberships_select_self on public.business_memberships;
create policy memberships_select_self
  on public.business_memberships for select to public
  using (user_id = (select auth.uid()));
create policy memberships_insert_by_creator
  on public.business_memberships for insert to public
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and status = 'active'
    and public.is_business_creator(business_id)
  );

drop policy orders_select_for_members on public.orders;
create policy orders_select_for_members
  on public.orders for select to public
  using (public.is_business_member(business_id));
create policy orders_insert_for_members
  on public.orders for insert to public
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));
create policy orders_update_for_members
  on public.orders for update to public
  using (public.has_business_role(business_id, array['owner', 'manager', 'seller']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));

drop policy order_lines_select_for_members on public.order_lines;
create policy order_lines_select_for_members
  on public.order_lines for select to public
  using (public.is_business_member(business_id));
create policy order_lines_insert_for_members
  on public.order_lines for insert to public
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));

drop policy payment_entries_select_for_members on public.payment_entries;
create policy payment_entries_select_for_members
  on public.payment_entries for select to public
  using (public.is_business_member(business_id));
create policy payment_entries_insert_for_members
  on public.payment_entries for insert to public
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));

drop policy audit_events_select_for_members on public.audit_events;
create policy audit_events_select_for_members
  on public.audit_events for select to public
  using (public.is_business_member(business_id));
create policy audit_events_insert_for_members
  on public.audit_events for insert to public
  with check (
    actor_id = (select auth.uid())
    and public.is_business_member(business_id)
  );

create policy customers_select_for_members
  on public.customers for select to public
  using (public.is_business_member(business_id));
create policy customers_insert_for_members
  on public.customers for insert to public
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));

create policy quotations_select_for_members
  on public.quotations for select to public
  using (public.is_business_member(business_id));
create policy quotations_insert_for_members
  on public.quotations for insert to public
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));
create policy quotations_update_for_members
  on public.quotations for update to public
  using (public.has_business_role(business_id, array['owner', 'manager', 'seller']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));

create policy quotation_lines_select_for_members
  on public.quotation_lines for select to public
  using (public.is_business_member(business_id));
create policy quotation_lines_insert_for_members
  on public.quotation_lines for insert to public
  with check (public.has_business_role(business_id, array['owner', 'manager', 'seller']));

revoke all on
  public.businesses,
  public.business_memberships,
  public.orders,
  public.order_lines,
  public.payment_entries,
  public.audit_events,
  public.customers,
  public.quotations,
  public.quotation_lines
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on
  public.businesses,
  public.business_memberships,
  public.orders,
  public.order_lines,
  public.payment_entries,
  public.audit_events,
  public.customers,
  public.quotations,
  public.quotation_lines
to authenticated;

create or replace function public.create_business(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  current_user_id uuid := public.current_user_id();
  clean_name text := trim(coalesce(p_name, ''));
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if char_length(clean_name) not between 2 and 80 then
    raise exception 'invalid_business_name' using errcode = '22023';
  end if;

  insert into public.businesses (name, created_by)
  values (clean_name, current_user_id)
  returning id into new_business_id;

  insert into public.business_memberships (business_id, user_id, role, status)
  values (new_business_id, current_user_id, 'owner', 'active');

  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action)
  values (new_business_id, current_user_id, 'business', new_business_id, 'business.created');

  return new_business_id;
end;
$$;

create or replace function public.create_order_with_line(
  p_business_id uuid,
  p_customer_label text,
  p_description text,
  p_sku text,
  p_quantity numeric,
  p_unit_price numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order_id uuid;
  current_user_id uuid := public.current_user_id();
  clean_description text := trim(coalesce(p_description, ''));
  clean_customer_label text := nullif(trim(coalesce(p_customer_label, '')), '');
  clean_sku text := nullif(trim(coalesce(p_sku, '')), '');
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;
  if char_length(clean_description) not between 2 and 120
    or char_length(coalesce(clean_customer_label, '')) > 80
    or char_length(coalesce(clean_sku, '')) > 40
    or p_quantity is null or p_quantity <= 0 or p_quantity > 10000 or p_quantity <> round(p_quantity, 3)
    or p_unit_price is null or p_unit_price < 0 or p_unit_price > 10000000 or p_unit_price <> round(p_unit_price, 2) then
    raise exception 'invalid_order_input' using errcode = '22023';
  end if;

  insert into public.orders (business_id, reference, customer_label, created_by)
  values (
    p_business_id,
    'P-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    clean_customer_label,
    current_user_id
  )
  returning id into new_order_id;

  insert into public.order_lines (business_id, order_id, description_snapshot, sku_snapshot, quantity, unit_price)
  values (p_business_id, new_order_id, clean_description, clean_sku, p_quantity, p_unit_price);

  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action)
  values (p_business_id, current_user_id, 'order', new_order_id, 'order.created');
  return new_order_id;
end;
$$;

create or replace function public.change_order_fulfillment(
  p_business_id uuid,
  p_order_id uuid,
  p_next_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  current_status text;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;

  select fulfillment_status into current_status
  from public.orders
  where id = p_order_id and business_id = p_business_id and commercial_status = 'confirmed'
  for update;
  if not found then
    raise exception 'order_not_found_or_cancelled' using errcode = 'P0002';
  end if;
  if p_next_status is null or p_next_status not in ('preparing', 'ready', 'delivered')
    or not (
      (current_status = 'not_started' and p_next_status = 'preparing')
      or (current_status = 'preparing' and p_next_status = 'ready')
      or (current_status = 'ready' and p_next_status = 'delivered')
    ) then
    raise exception 'invalid_fulfillment_transition' using errcode = '22023';
  end if;

  update public.orders set fulfillment_status = p_next_status
  where id = p_order_id and business_id = p_business_id;
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'order', p_order_id, 'order.fulfillment.changed',
    jsonb_build_object('from', current_status, 'to', p_next_status));
end;
$$;

create or replace function public.record_order_payment(
  p_business_id uuid,
  p_order_id uuid,
  p_amount numeric,
  p_method_label text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  clean_method text := trim(coalesce(p_method_label, ''));
  order_total numeric(14, 2);
  paid_total numeric(14, 2);
  new_payment_id uuid;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;

  perform 1 from public.orders
  where id = p_order_id and business_id = p_business_id and commercial_status = 'confirmed'
  for update;
  if not found then
    raise exception 'order_not_found_or_cancelled' using errcode = 'P0002';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 10000000 or p_amount <> round(p_amount, 2)
    or clean_method not in ('cash', 'transfer_reported', 'qr_reported', 'other') then
    raise exception 'invalid_payment_input' using errcode = '22023';
  end if;

  select coalesce(sum(round(quantity * unit_price, 2)), 0)
  into order_total
  from public.order_lines
  where business_id = p_business_id and order_id = p_order_id;
  select coalesce(sum(case when reverses_entry_id is null then amount else -amount end), 0)
  into paid_total
  from public.payment_entries
  where business_id = p_business_id and order_id = p_order_id;
  if p_amount > order_total - paid_total then
    raise exception 'payment_exceeds_balance' using errcode = '22023';
  end if;

  insert into public.payment_entries (business_id, order_id, amount, currency, method_label, recorded_by)
  values (p_business_id, p_order_id, p_amount, 'BOB', clean_method, current_user_id)
  returning id into new_payment_id;
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'payment', new_payment_id, 'payment.recorded',
    jsonb_build_object('order_id', p_order_id, 'amount', p_amount, 'currency', 'BOB', 'method', clean_method));
  return new_payment_id;
end;
$$;

create or replace function public.create_quotation_with_lines(
  p_business_id uuid,
  p_customer_name text,
  p_contact_value text,
  p_valid_until date,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  clean_customer_name text := nullif(trim(coalesce(p_customer_name, '')), '');
  clean_contact text := nullif(trim(coalesce(p_contact_value, '')), '');
  new_customer_id uuid;
  new_quotation_id uuid;
  line jsonb;
  clean_description text;
  clean_sku text;
  line_quantity numeric;
  line_unit_price numeric;
  quotation_total numeric(14, 2) := 0;
  line_count integer;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'invalid_quotation_lines' using errcode = '22023';
  end if;
  line_count := jsonb_array_length(p_lines);
  if line_count < 1 or line_count > 20
    or char_length(coalesce(clean_customer_name, '')) > 80
    or char_length(coalesce(clean_contact, '')) > 100 then
    raise exception 'invalid_quotation_input' using errcode = '22023';
  end if;

  if clean_customer_name is not null then
    insert into public.customers (business_id, display_name, contact_value)
    values (p_business_id, clean_customer_name, clean_contact)
    returning id into new_customer_id;
  elsif clean_contact is not null then
    raise exception 'contact_requires_customer_name' using errcode = '22023';
  end if;

  insert into public.quotations (
    business_id, customer_id, customer_label_snapshot, reference, status, currency, total, valid_until, created_by
  ) values (
    p_business_id,
    new_customer_id,
    clean_customer_name,
    'C-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    'draft', 'BOB', 0, p_valid_until, current_user_id
  ) returning id into new_quotation_id;

  for line in select value from jsonb_array_elements(p_lines)
  loop
    clean_description := trim(coalesce(line ->> 'description', ''));
    clean_sku := nullif(trim(coalesce(line ->> 'sku', '')), '');
    begin
      line_quantity := (line ->> 'quantity')::numeric;
      line_unit_price := (line ->> 'unit_price')::numeric;
    exception when others then
      raise exception 'invalid_quotation_line' using errcode = '22023';
    end;
    if char_length(clean_description) not between 2 and 120
      or char_length(coalesce(clean_sku, '')) > 40
      or line_quantity is null or line_quantity <= 0 or line_quantity > 10000 or line_quantity <> round(line_quantity, 3)
      or line_unit_price is null or line_unit_price < 0 or line_unit_price > 10000000 or line_unit_price <> round(line_unit_price, 2) then
      raise exception 'invalid_quotation_line' using errcode = '22023';
    end if;

    insert into public.quotation_lines (
      business_id, quotation_id, description_snapshot, sku_snapshot, quantity, unit_price
    ) values (
      p_business_id, new_quotation_id, clean_description, clean_sku, line_quantity, line_unit_price
    );
    quotation_total := quotation_total + round(line_quantity * line_unit_price, 2);
  end loop;

  update public.quotations set total = quotation_total, updated_at = now()
  where business_id = p_business_id and id = new_quotation_id;
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'quotation', new_quotation_id, 'quotation.created',
    jsonb_build_object('line_count', line_count, 'total', quotation_total, 'currency', 'BOB'));
  return new_quotation_id;
end;
$$;

create or replace function public.change_quotation_status(
  p_business_id uuid,
  p_quotation_id uuid,
  p_next_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  current_status text;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;
  select status into current_status from public.quotations
  where business_id = p_business_id and id = p_quotation_id
  for update;
  if not found then
    raise exception 'quotation_not_found' using errcode = 'P0002';
  end if;
  if not (
    (current_status = 'draft' and p_next_status = 'sent')
    or (current_status = 'sent' and p_next_status in ('declined', 'expired'))
  ) then
    raise exception 'invalid_quotation_transition' using errcode = '22023';
  end if;
  update public.quotations set status = p_next_status, updated_at = now()
  where business_id = p_business_id and id = p_quotation_id;
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'quotation', p_quotation_id, 'quotation.status.changed',
    jsonb_build_object('from', current_status, 'to', p_next_status));
end;
$$;

create or replace function public.create_order_from_quotation(p_business_id uuid, p_quotation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  quote_row public.quotations%rowtype;
  new_order_id uuid;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;
  select * into quote_row from public.quotations
  where business_id = p_business_id and id = p_quotation_id
  for update;
  if not found then
    raise exception 'quotation_not_found' using errcode = 'P0002';
  end if;

  if quote_row.status = 'accepted' then
    select id into new_order_id from public.orders
    where business_id = p_business_id and quotation_id = p_quotation_id;
    if new_order_id is null then
      raise exception 'accepted_quotation_missing_order' using errcode = '23514';
    end if;
    return new_order_id;
  end if;
  if quote_row.status <> 'sent' then
    raise exception 'quotation_not_acceptable' using errcode = '22023';
  end if;
  if quote_row.valid_until is not null
    and quote_row.valid_until < (now() at time zone 'America/La_Paz')::date then
    raise exception 'quotation_expired' using errcode = '22023';
  end if;

  update public.quotations set status = 'accepted', updated_at = now()
  where business_id = p_business_id and id = p_quotation_id;
  insert into public.orders (business_id, reference, customer_label, quotation_id, currency, created_by)
  values (
    p_business_id,
    'P-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    quote_row.customer_label_snapshot,
    p_quotation_id,
    quote_row.currency,
    current_user_id
  ) returning id into new_order_id;

  insert into public.order_lines (
    business_id, order_id, description_snapshot, sku_snapshot, quantity, unit_price
  )
  select business_id, new_order_id, description_snapshot, sku_snapshot, quantity, unit_price
  from public.quotation_lines
  where business_id = p_business_id and quotation_id = p_quotation_id;

  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'quotation', p_quotation_id, 'quotation.accepted',
    jsonb_build_object('order_id', new_order_id));
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'order', new_order_id, 'order.created_from_quotation',
    jsonb_build_object('quotation_id', p_quotation_id));
  return new_order_id;
end;
$$;

create or replace function public.reverse_order_payment(
  p_business_id uuid,
  p_payment_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  original_entry public.payment_entries%rowtype;
  order_status text;
  clean_reason text := nullif(trim(coalesce(p_reason, '')), '');
  reversal_id uuid;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager', 'seller']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;
  select * into original_entry
  from public.payment_entries
  where business_id = p_business_id and id = p_payment_id and reverses_entry_id is null;
  if not found then
    raise exception 'payment_not_found_or_not_reversible' using errcode = 'P0002';
  end if;
  perform 1 from public.orders
  where business_id = p_business_id and id = original_entry.order_id
  for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  select commercial_status into order_status from public.orders
  where business_id = p_business_id and id = original_entry.order_id;
  if order_status = 'cancelled' then
    raise exception 'cancelled_order_payment' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.payment_entries
    where business_id = p_business_id and reverses_entry_id = p_payment_id
  ) then
    raise exception 'payment_already_reversed' using errcode = '23505';
  end if;
  if char_length(coalesce(clean_reason, '')) > 160 then
    raise exception 'invalid_reversal_reason' using errcode = '22023';
  end if;

  insert into public.payment_entries (
    business_id, order_id, amount, currency, method_label, recorded_by, reverses_entry_id, reversal_reason
  ) values (
    p_business_id, original_entry.order_id, original_entry.amount, original_entry.currency,
    original_entry.method_label, current_user_id, p_payment_id, clean_reason
  ) returning id into reversal_id;
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'payment', reversal_id, 'payment.reversed',
    jsonb_build_object('order_id', original_entry.order_id, 'reverses_entry_id', p_payment_id,
      'amount', original_entry.amount, 'currency', original_entry.currency, 'reason_recorded', clean_reason is not null));
  return reversal_id;
end;
$$;

create or replace function public.cancel_order(p_business_id uuid, p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := public.current_user_id();
  clean_reason text := trim(coalesce(p_reason, ''));
  current_status text;
  current_fulfillment_status text;
begin
  if current_user_id is null or not public.has_business_role(p_business_id, array['owner', 'manager']) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;
  select commercial_status, fulfillment_status into current_status, current_fulfillment_status from public.orders
  where business_id = p_business_id and id = p_order_id
  for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  if current_status <> 'confirmed' then
    raise exception 'order_already_cancelled' using errcode = '22023';
  end if;
  if current_fulfillment_status = 'delivered' then
    raise exception 'delivered_order_cannot_be_cancelled' using errcode = '22023';
  end if;
  if char_length(clean_reason) not between 3 and 160 then
    raise exception 'invalid_cancellation_reason' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.payment_entries
    where business_id = p_business_id and order_id = p_order_id and reverses_entry_id is null
      and not exists (select 1 from public.payment_entries reversal
        where reversal.business_id = p_business_id and reversal.reverses_entry_id = payment_entries.id)
  ) then
    raise exception 'payments_must_be_reversed' using errcode = '22023';
  end if;

  update public.orders set commercial_status = 'cancelled', cancelled_reason = clean_reason
  where business_id = p_business_id and id = p_order_id;
  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business_id, current_user_id, 'order', p_order_id, 'order.cancelled',
    jsonb_build_object('reason_recorded', true));
end;
$$;

revoke all on function public.create_business(text) from public, anon;
revoke all on function public.create_order_with_line(uuid, text, text, text, numeric, numeric) from public, anon;
revoke all on function public.change_order_fulfillment(uuid, uuid, text) from public, anon;
revoke all on function public.record_order_payment(uuid, uuid, numeric, text) from public, anon;
revoke all on function public.create_quotation_with_lines(uuid, text, text, date, jsonb) from public, anon;
revoke all on function public.change_quotation_status(uuid, uuid, text) from public, anon;
revoke all on function public.create_order_from_quotation(uuid, uuid) from public, anon;
revoke all on function public.reverse_order_payment(uuid, uuid, text) from public, anon;
revoke all on function public.cancel_order(uuid, uuid, text) from public, anon;
revoke all on function public.get_business_dashboard(uuid) from public, anon;
grant execute on function public.create_business(text) to authenticated;
grant execute on function public.create_order_with_line(uuid, text, text, text, numeric, numeric) to authenticated;
grant execute on function public.change_order_fulfillment(uuid, uuid, text) to authenticated;
grant execute on function public.record_order_payment(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.create_quotation_with_lines(uuid, text, text, date, jsonb) to authenticated;
grant execute on function public.change_quotation_status(uuid, uuid, text) to authenticated;
grant execute on function public.create_order_from_quotation(uuid, uuid) to authenticated;
grant execute on function public.reverse_order_payment(uuid, uuid, text) to authenticated;
grant execute on function public.cancel_order(uuid, uuid, text) to authenticated;
grant execute on function public.get_business_dashboard(uuid) to authenticated;

alter function public.create_business(text) owner to bytecx_rpc_owner;
alter function public.create_order_with_line(uuid, text, text, text, numeric, numeric) owner to bytecx_rpc_owner;
alter function public.change_order_fulfillment(uuid, uuid, text) owner to bytecx_rpc_owner;
alter function public.record_order_payment(uuid, uuid, numeric, text) owner to bytecx_rpc_owner;
alter function public.create_quotation_with_lines(uuid, text, text, date, jsonb) owner to bytecx_rpc_owner;
alter function public.change_quotation_status(uuid, uuid, text) owner to bytecx_rpc_owner;
alter function public.create_order_from_quotation(uuid, uuid) owner to bytecx_rpc_owner;
alter function public.reverse_order_payment(uuid, uuid, text) owner to bytecx_rpc_owner;
alter function public.cancel_order(uuid, uuid, text) owner to bytecx_rpc_owner;
alter function public.get_business_dashboard(uuid) owner to bytecx_rpc_owner;

revoke create on schema public from bytecx_rpc_owner;

commit;
