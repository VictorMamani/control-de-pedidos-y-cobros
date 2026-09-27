begin;

create extension if not exists pgtap with schema extensions;
select plan(52);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select is((select count(*)::integer from public.businesses), 1, 'A solo ve su comercio');
select is((select count(*)::integer from public.orders where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1,
  'A puede leer sus pedidos');
select is((select count(*)::integer from public.orders where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'A no puede leer pedidos de B');
select is((select count(*)::integer from public.order_lines where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'A no puede leer líneas de B');
select is((select count(*)::integer from public.payment_entries where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'A no puede leer cobros de B');
select is((select count(*)::integer from public.quotations where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'A no puede leer cotizaciones de B');

select lives_ok(
  $$select public.create_order_with_line(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, 'Pedido propio de prueba', null, 1, 100
  )$$,
  'A puede crear un pedido con línea en su negocio'
);
select throws_ok(
  $$select public.create_order_with_line(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', null, 'Pedido cruzado de prueba', null, 1, 100
  )$$,
  '42501', 'business_access_denied', 'A no puede crear en el negocio B'
);
select throws_ok(
  $$select public.create_order_with_line(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, 'Sin líneas no aplica', null, 0, 100
  )$$,
  '22023', 'invalid_order_input', 'Se rechaza una cantidad no positiva'
);
select throws_ok(
  $$select public.create_quotation_with_lines(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null, null, '[]'::jsonb
  )$$,
  '22023', 'invalid_quotation_input', 'No se crea una cotización sin líneas'
);
select throws_ok(
  $$select public.change_order_fulfillment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'preparing'
  )$$,
  'P0002', 'order_not_found_or_cancelled', 'A no puede actualizar el pedido de B'
);
select throws_ok(
  $$select public.cancel_order(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'Intento cruzado'
  )$$,
  '42501', 'business_access_denied', 'A no puede cancelar un pedido de B'
);
select throws_ok(
  $$update public.orders set business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'$$,
  '42501', null, 'A no puede cambiar business_id por SQL directo'
);
select throws_ok(
  $$delete from public.orders where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'$$,
  '42501', null, 'No se permite borrar pedidos por SQL directo'
);

select is(
  public.create_order_from_quotation(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
  ),
  public.create_order_from_quotation(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
  ),
  'Aceptar dos veces conserva el mismo pedido'
);
select is((select count(*)::integer from public.orders
  where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'), 1,
  'La cotización aceptada solo genera un pedido');
select is((select count(*)::integer from public.order_lines
  where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and order_id = (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01')), 2,
  'La conversión copia ambas líneas como snapshot');
select is(
  (select string_agg(description_snapshot || '|' || coalesce(sku_snapshot, '') || '|' || quantity::text || '|' || unit_price::text,
      ';' order by description_snapshot)
    from public.order_lines where order_id = (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01')),
  (select string_agg(description_snapshot || '|' || coalesce(sku_snapshot, '') || '|' || quantity::text || '|' || unit_price::text,
      ';' order by description_snapshot)
    from public.quotation_lines where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'),
  'Las líneas convertidas conservan descripción, SKU, cantidad y precio'
);
select is((select status from public.quotations where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'), 'accepted',
  'La conversión cambia la cotización a aceptada');
select throws_ok(
  $$update public.quotation_lines set unit_price = 0
    where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'$$,
  '42501', null, 'Las líneas guardadas no se editan directamente'
);
select is((select count(*)::integer from public.audit_events
  where entity_type = 'quotation' and entity_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
    and action = 'quotation.accepted'), 1,
  'La aceptación deja un evento de auditoría');

select lives_ok(
  $$select public.record_order_payment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'),
    500, 'cash'
  )$$,
  'Se puede anotar un anticipo'
);
select is((
  select coalesce((select sum(round(quantity * unit_price, 2) * 100)::bigint
    from public.order_lines where order_id = orders.id), 0)
    - coalesce((select sum((case when reverses_entry_id is null then amount else -amount end) * 100)::bigint
      from public.payment_entries where order_id = orders.id), 0)
  from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
), 30000::bigint, 'El saldo después del anticipo es BOB 300.00');
select throws_ok(
  $$select public.record_order_payment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'),
    301, 'cash'
  )$$,
  '22023', 'payment_exceeds_balance', 'No se puede anotar un cobro mayor al saldo'
);
select lives_ok(
  $$select public.record_order_payment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'),
    300, 'transfer_reported'
  )$$,
  'Se puede anotar el importe restante'
);
select is((
  select coalesce((select sum(round(quantity * unit_price, 2) * 100)::bigint
    from public.order_lines where order_id = orders.id), 0)
    - coalesce((select sum((case when reverses_entry_id is null then amount else -amount end) * 100)::bigint
      from public.payment_entries where order_id = orders.id), 0)
  from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
), 0::bigint, 'El saldo después del cobro restante es cero');
select set_config('test.remaining_payment_id', (
  select id::text from public.payment_entries
  where order_id = (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01')
    and reverses_entry_id is null and amount = 300
  limit 1
), true);
select lives_ok(
  $$select public.reverse_order_payment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_setting('test.remaining_payment_id')::uuid, 'Corrección sintética'
  )$$,
  'Se puede revertir un cobro sin borrarlo'
);
select is((select reversal_reason from public.payment_entries
  where reverses_entry_id = current_setting('test.remaining_payment_id')::uuid), 'Corrección sintética',
  'La razón de reversión se conserva junto al movimiento, no en el log');
select is((
  select coalesce((select sum(round(quantity * unit_price, 2) * 100)::bigint
    from public.order_lines where order_id = orders.id), 0)
    - coalesce((select sum((case when reverses_entry_id is null then amount else -amount end) * 100)::bigint
      from public.payment_entries where order_id = orders.id), 0)
  from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
), 30000::bigint, 'La reversión vuelve a dejar BOB 300.00 pendientes');
select throws_ok(
  $$select public.reverse_order_payment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_setting('test.remaining_payment_id')::uuid, null
  )$$,
  '23505', 'payment_already_reversed', 'No se puede revertir dos veces el mismo cobro'
);
select lives_ok(
  $$select public.record_order_payment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'),
    300, 'cash'
  )$$,
  'Se puede volver a anotar el saldo liberado por la reversión'
);
select is((
  select coalesce((select sum(round(quantity * unit_price, 2) * 100)::bigint
    from public.order_lines where order_id = orders.id), 0)
    - coalesce((select sum((case when reverses_entry_id is null then amount else -amount end) * 100)::bigint
      from public.payment_entries where order_id = orders.id), 0)
  from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'
), 0::bigint, 'El saldo vuelve a cero después del nuevo registro');

select lives_ok(
  $$select public.change_order_fulfillment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'), 'preparing'
  )$$,
  'Se puede iniciar la preparación'
);
select lives_ok(
  $$select public.change_order_fulfillment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'), 'ready'
  )$$,
  'Se puede marcar el pedido listo'
);
select lives_ok(
  $$select public.change_order_fulfillment(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'), 'delivered'
  )$$,
  'Se puede marcar el pedido entregado'
);
select is((select commercial_status from public.orders
  where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'), 'confirmed',
  'Entregar no modifica el estado comercial');
select throws_ok(
  $$select public.cancel_order(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01'),
    'Ya fue entregado'
  )$$,
  '22023', 'delivered_order_cannot_be_cancelled', 'No se cancela un pedido entregado'
);
select is((select count(*)::integer from public.audit_events
  where entity_type = 'payment' and action = 'payment.reversed'
    and details ->> 'order_id' = (select id::text from public.orders where quotation_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01')),
  1, 'El historial conserva el actor y la reversión del cobro');

reset role;
update public.business_memberships set role = 'manager'
where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  and user_id = '22222222-2222-4222-8222-222222222222';
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select is((select count(*)::integer from public.orders where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 1,
  'B puede leer sus pedidos');
select is((select count(*)::integer from public.orders where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0,
  'B no puede leer pedidos de A');
select is((select count(*)::integer from public.quotations where business_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 1,
  'B puede leer su cotización');
select is((select count(*)::integer from public.payment_entries where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0,
  'B no puede leer cobros de A');
select lives_ok(
  $$select public.cancel_order(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'Cancelación sintética'
  )$$,
  'El rol manager puede cancelar su pedido sin cobros vigentes'
);
select is((select commercial_status from public.orders where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02'), 'cancelled',
  'La cancelación conserva el pedido y cambia el estado comercial');
select is((select cancelled_reason from public.orders where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02'), 'Cancelación sintética',
  'La cancelación guarda un motivo breve');
select is((select count(*)::integer from public.audit_events where entity_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02' and action = 'order.cancelled'), 1,
  'La cancelación queda en el historial');
select is((select details ? 'reason' from public.audit_events where entity_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02' and action = 'order.cancelled'), false,
  'El log de cancelación no copia el motivo libre');

reset role;
update public.business_memberships set role = 'seller'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = '11111111-1111-4111-8111-111111111111';
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select throws_ok(
  $$select public.cancel_order(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'Cancelación no permitida'
  )$$,
  '42501', 'business_access_denied', 'El rol seller no puede cancelar pedidos'
);
select lives_ok(
  $$select public.create_order_with_line(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, 'Pedido propio de seller', null, 1, 100
  )$$,
  'El rol seller puede registrar pedidos en su negocio'
);

reset role;
select throws_ok(
  $$insert into public.order_lines (business_id, order_id, description_snapshot, quantity, unit_price)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'Línea cruzada', 1, 1)$$,
  '23503', null, 'La clave foránea impide líneas de pedido cruzadas'
);
select throws_ok(
  $$insert into public.quotation_lines (business_id, quotation_id, description_snapshot, quantity, unit_price)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddd02', 'Línea cruzada', 1, 1)$$,
  '23503', null, 'La clave foránea impide líneas de cotización cruzadas'
);
select throws_ok(
  $$insert into public.payment_entries (business_id, order_id, amount, method_label, recorded_by)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 1, 'cash',
      '11111111-1111-4111-8111-111111111111')$$,
  '23503', null, 'La clave foránea impide cobros asociados a pedidos de otro negocio'
);

select * from finish();
rollback;
