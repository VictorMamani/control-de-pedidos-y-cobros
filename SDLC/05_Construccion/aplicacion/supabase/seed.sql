-- Only synthetic fixtures. These users intentionally have no login password;
-- run the local end-to-end script to create temporary Auth accounts.
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'user-a@bytecx.example.test'),
  ('22222222-2222-4222-8222-222222222222', 'user-b@bytecx.example.test')
on conflict (id) do nothing;

insert into public.businesses (id, name, created_by) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Comercio sintético A', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Comercio sintético B', '22222222-2222-4222-8222-222222222222')
on conflict (id) do nothing;

insert into public.business_memberships (business_id, user_id, role, status) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'owner', 'active')
on conflict (business_id, user_id) do nothing;

insert into public.customers (id, business_id, display_name, contact_value) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Comprador sintético A', null),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc02', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Comprador sintético B', null)
on conflict (business_id, id) do nothing;

insert into public.quotations (
  id, business_id, customer_id, customer_label_snapshot, reference, status, total, valid_until, created_by
) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'Comprador sintético A', 'C-DEMO-A01', 'sent', 800, current_date + 14,
    '11111111-1111-4111-8111-111111111111'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd02', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'cccccccc-cccc-4ccc-8ccc-cccccccccc02', 'Comprador sintético B', 'C-DEMO-B01', 'draft', 1750, current_date + 7,
    '22222222-2222-4222-8222-222222222222')
on conflict (business_id, id) do nothing;

insert into public.quotation_lines (business_id, quotation_id, description_snapshot, sku_snapshot, quantity, unit_price) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01', 'Teclado mecánico de prueba', 'KB-SYN-01', 1, 500),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01', 'Memoria DDR5 de prueba', 'RAM-SYN-01', 1, 300),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'dddddddd-dddd-4ddd-8ddd-dddddddddd02', 'Monitor de prueba', 'MON-SYN-01', 1, 1750);

insert into public.orders (id, business_id, reference, customer_label, created_by) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'P-DEMO-A01', 'Comprador sintético A',
    '11111111-1111-4111-8111-111111111111'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'P-DEMO-B01', 'Comprador sintético B',
    '22222222-2222-4222-8222-222222222222')
on conflict (business_id, id) do nothing;

insert into public.order_lines (business_id, order_id, description_snapshot, sku_snapshot, quantity, unit_price) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'Teclado mecánico de prueba', 'KB-SYN-01', 1, 500),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'Memoria DDR5 de prueba', 'RAM-SYN-01', 1, 300),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'Monitor de prueba', 'MON-SYN-01', 1, 1750);

insert into public.payment_entries (id, business_id, order_id, amount, method_label, recorded_by) values
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 500, 'cash', '11111111-1111-4111-8111-111111111111');

insert into public.audit_events (business_id, actor_id, entity_type, entity_id, action, details) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'order',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'order.created', '{}'::jsonb),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'payment',
    'ffffffff-ffff-4fff-8fff-ffffffffffff', 'payment.recorded',
    '{"order_id":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01","amount":500,"currency":"BOB","method":"cash"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'order',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'order.created', '{}'::jsonb);
