-- Esquema inicial de aprendizaje. Requiere Supabase Auth y no contiene datos reales.

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  default_currency text not null default 'BOB' check (default_currency = 'BOB'),
  timezone text not null default 'America/La_Paz',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.business_memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reference text not null,
  customer_label text check (customer_label is null or char_length(customer_label) <= 80),
  commercial_status text not null default 'confirmed' check (commercial_status in ('confirmed', 'cancelled')),
  fulfillment_status text not null default 'not_started' check (fulfillment_status in ('not_started', 'preparing', 'ready', 'delivered')),
  currency text not null default 'BOB' check (currency = 'BOB'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, reference)
);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  order_id uuid not null,
  description_snapshot text not null check (char_length(trim(description_snapshot)) between 2 and 120),
  sku_snapshot text check (sku_snapshot is null or char_length(sku_snapshot) <= 40),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (business_id, id),
  foreign key (business_id, order_id) references public.orders(business_id, id) on delete cascade
);

create table public.payment_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  order_id uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'BOB' check (currency = 'BOB'),
  method_label text not null check (method_label in ('cash', 'transfer_reported', 'qr_reported', 'other')),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  reverses_entry_id uuid,
  recorded_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, id, order_id),
  check (reverses_entry_id is null or reverses_entry_id <> id),
  foreign key (business_id, order_id) references public.orders(business_id, id) on delete restrict,
  foreign key (business_id, reverses_entry_id, order_id) references public.payment_entries(business_id, id, order_id) on delete restrict
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('business', 'order', 'payment')),
  entity_id uuid not null,
  action text not null check (char_length(action) between 2 and 60),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index business_memberships_user_status_idx on public.business_memberships(user_id, status, created_at);
create index orders_business_created_idx on public.orders(business_id, created_at desc);
create index order_lines_business_order_idx on public.order_lines(business_id, order_id);
create index payment_entries_business_order_idx on public.payment_entries(business_id, order_id, recorded_at desc);
create index audit_events_business_created_idx on public.audit_events(business_id, created_at desc);

create or replace function public.is_business_member(target_business_id uuid)
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
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;

create or replace function public.create_business(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  current_user_id uuid := auth.uid();
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

revoke all on function public.create_business(text) from public;
grant execute on function public.create_business(text) to authenticated;

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
  current_user_id uuid := auth.uid();
  clean_description text := trim(coalesce(p_description, ''));
  clean_customer_label text := nullif(trim(coalesce(p_customer_label, '')), '');
  clean_sku text := nullif(trim(coalesce(p_sku, '')), '');
begin
  if current_user_id is null or not public.is_business_member(p_business_id) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;

  if char_length(clean_description) not between 2 and 120
    or char_length(coalesce(clean_customer_label, '')) > 80
    or char_length(coalesce(clean_sku, '')) > 40
    or p_quantity <= 0
    or p_quantity > 10000
    or p_unit_price < 0
    or p_unit_price > 10000000 then
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

revoke all on function public.create_order_with_line(uuid, text, text, text, numeric, numeric) from public;
grant execute on function public.create_order_with_line(uuid, text, text, text, numeric, numeric) to authenticated;

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
  current_user_id uuid := auth.uid();
  current_status text;
begin
  if current_user_id is null or not public.is_business_member(p_business_id) then
    raise exception 'business_access_denied' using errcode = '42501';
  end if;

  select fulfillment_status into current_status
  from public.orders
  where id = p_order_id and business_id = p_business_id and commercial_status = 'confirmed'
  for update;

  if not found then
    raise exception 'order_not_found_or_cancelled' using errcode = 'P0002';
  end if;

  if p_next_status is null or p_next_status not in ('preparing', 'ready', 'delivered') then
    raise exception 'invalid_fulfillment_transition' using errcode = '22023';
  end if;

  if not (
    (current_status = 'not_started' and p_next_status = 'preparing')
    or (current_status = 'preparing' and p_next_status = 'ready')
    or (current_status = 'ready' and p_next_status = 'delivered')
  ) then
    raise exception 'invalid_fulfillment_transition' using errcode = '22023';
  end if;

  update public.orders
  set fulfillment_status = p_next_status
  where id = p_order_id and business_id = p_business_id;

  insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details)
  values (
    p_business_id,
    current_user_id,
    'order',
    p_order_id,
    'order.fulfillment.changed',
    jsonb_build_object('from', current_status, 'to', p_next_status)
  );
end;
$$;

revoke all on function public.change_order_fulfillment(uuid, uuid, text) from public;
grant execute on function public.change_order_fulfillment(uuid, uuid, text) to authenticated;

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
  current_user_id uuid := auth.uid();
  clean_method text := trim(coalesce(p_method_label, ''));
  order_total numeric(14, 2);
  paid_total numeric(14, 2);
  new_payment_id uuid;
begin
  if current_user_id is null or not public.is_business_member(p_business_id) then
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

  select coalesce(sum(quantity * unit_price), 0)
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
  values (
    p_business_id,
    current_user_id,
    'payment',
    new_payment_id,
    'payment.recorded',
    jsonb_build_object('order_id', p_order_id, 'amount', p_amount, 'currency', 'BOB', 'method', clean_method)
  );

  return new_payment_id;
end;
$$;

revoke all on function public.record_order_payment(uuid, uuid, numeric, text) from public;
grant execute on function public.record_order_payment(uuid, uuid, numeric, text) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.payment_entries enable row level security;
alter table public.audit_events enable row level security;

grant usage on schema public to authenticated;
grant select on public.businesses, public.business_memberships, public.orders, public.order_lines, public.payment_entries, public.audit_events to authenticated;

create policy businesses_select_for_members
  on public.businesses for select to authenticated
  using (public.is_business_member(id));

create policy memberships_select_self
  on public.business_memberships for select to authenticated
  using (user_id = (select auth.uid()));

create policy orders_select_for_members
  on public.orders for select to authenticated
  using (public.is_business_member(business_id));

create policy order_lines_select_for_members
  on public.order_lines for select to authenticated
  using (public.is_business_member(business_id));

create policy payment_entries_select_for_members
  on public.payment_entries for select to authenticated
  using (public.is_business_member(business_id));

create policy audit_events_select_for_members
  on public.audit_events for select to authenticated
  using (public.is_business_member(business_id));
