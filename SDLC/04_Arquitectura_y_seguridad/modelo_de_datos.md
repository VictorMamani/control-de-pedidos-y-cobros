# Modelo de datos inicial

**Estado:** modelo lógico provisional para aprendizaje. La migración inicial de la app implementa un subconjunto (negocio, membresía, pedido, línea, cobro e historial); revisar contra el flujo de comercios antes de ampliarlo o usar datos reales.

## Principios

- Cada registro comercial pertenece a un negocio (`business_id`).
- La identidad de acceso vive en Supabase Auth; el vínculo entre persona, negocio y rol vive en la aplicación.
- Una cotización puede convertirse en un pedido; también se puede registrar un pedido directo.
- Las líneas guardan una descripción y precio acordados como instantánea. No dependen de un inventario completo.
- Preparación/entrega y cobros tienen registros separados del estado comercial.
- El saldo pendiente se calcula con el total del pedido menos los cobros no revertidos; no se captura un estado de “pagado” independiente que pueda contradecir los cobros.
- Las correcciones financieras se registran con una reversión o ajuste auditado, no borrando silenciosamente el historial.

## Entidades

```mermaid
erDiagram
    AUTH_USER ||--o{ BUSINESS_MEMBERSHIP : pertenece
    BUSINESS ||--o{ BUSINESS_MEMBERSHIP : autoriza
    BUSINESS ||--o{ CUSTOMER : registra
    BUSINESS ||--o{ QUOTATION : crea
    CUSTOMER o|--o{ QUOTATION : referencia
    QUOTATION ||--o{ QUOTATION_LINE : contiene
    QUOTATION o|--o| SALES_ORDER : convierte
    BUSINESS ||--o{ SALES_ORDER : recibe
    CUSTOMER o|--o{ SALES_ORDER : referencia
    SALES_ORDER ||--|{ ORDER_LINE : conserva
    SALES_ORDER ||--o{ PAYMENT_ENTRY : registra
    BUSINESS ||--o{ AUDIT_EVENT : contiene
    AUTH_USER o|--o{ AUDIT_EVENT : ejecuta
    BUSINESS ||--o{ QUOTATION_LINE : limita
    BUSINESS ||--o{ ORDER_LINE : limita
    BUSINESS ||--o{ PAYMENT_ENTRY : limita

    AUTH_USER {
        uuid id PK
    }
    BUSINESS {
        uuid id PK
        string nombre
        string timezone
        string default_currency
    }
    BUSINESS_MEMBERSHIP {
        uuid business_id FK
        uuid auth_user_id FK
        string role
        string status
    }
    CUSTOMER {
        uuid id PK
        uuid business_id FK
        string display_name
        string contact_value
    }
    QUOTATION {
        uuid id PK
        uuid business_id FK
        uuid customer_id FK
        string reference
        string status
        string currency
        decimal total
        date valid_until
    }
    QUOTATION_LINE {
        uuid id PK
        uuid business_id FK
        uuid quotation_id FK
        string description_snapshot
        string sku_snapshot opcional
        decimal quantity
        decimal unit_price
    }
    SALES_ORDER {
        uuid id PK
        uuid business_id FK
        uuid quotation_id FK
        uuid customer_id FK
        string reference
        string commercial_status
        string fulfillment_status
        string currency
        decimal total
    }
    ORDER_LINE {
        uuid id PK
        uuid business_id FK
        uuid sales_order_id FK
        string description_snapshot
        string sku_snapshot opcional
        decimal quantity
        decimal unit_price
    }
    PAYMENT_ENTRY {
        uuid id PK
        uuid business_id FK
        uuid sales_order_id FK
        decimal amount
        string currency
        string method_label
        datetime recorded_at
        uuid recorded_by FK
        uuid reverses_entry_id FK
    }
    AUDIT_EVENT {
        uuid id PK
        uuid business_id FK
        uuid actor_id FK opcional
        string entity_type
        uuid entity_id
        string action
        datetime created_at
    }
```

## Reglas de integridad propuestas

- Añadir claves foráneas y restricciones en la base, no depender solo de validaciones visuales.
- Aplicar unicidad a la membresía `(business_id, auth_user_id)` y a la referencia visible dentro del negocio.
- Usar claves foráneas compuestas que incluyan `business_id` cuando una fila apunte a otra entidad del mismo negocio. Esto evita asociar accidentalmente una cotización, línea o cobro de otro tenant.
- Usar `quantity > 0`, `unit_price >= 0`, `amount > 0` y valores de estado restringidos. La representación numérica exacta, precisión y moneda se definen antes de la primera migración.
- Mantener una sola moneda por cotización/pedido y exigir que los cobros asociados usen esa moneda. La primera configuración de aprendizaje usaría BOB; cobros multimoneda quedan fuera hasta validar su necesidad.
- Guardar `description_snapshot`, `sku_snapshot`, cantidad y precio en las líneas. No guardar IMEI ni números de serie reales en el alcance inicial.
- Un pedido aceptado guarda el `quotation_id` de origen de forma opcional y conserva su propia copia de líneas/precios para que una edición posterior de la cotización no cambie el pedido.
- El registro de cobro significa “una persona del negocio anotó este importe”; nunca “el sistema verificó que el dinero llegó”.

PostgreSQL permite expresar claves primarias/foráneas, unicidad y restricciones `CHECK` en la base. La definición concreta requiere migraciones y pruebas de integridad más adelante. ([PostgreSQL: restricciones](https://www.postgresql.org/docs/18/ddl-constraints.html))

## Estados iniciales que deben revisarse

| Entidad | Valores de referencia | Regla |
|---|---|---|
| Cotización | `draft`, `sent`, `accepted`, `declined`, `expired` | Una cotización aceptada no se sobrescribe; origina un pedido con instantáneas. |
| Pedido comercial | `confirmed`, `cancelled` | Un pedido directo puede comenzar como confirmado; cancelar requiere motivo breve y evento de historial. |
| Preparación/entrega | `not_started`, `preparing`, `ready`, `delivered` | Se mantiene independiente del cobro. Entrega parcial es pregunta abierta, no estado aprobado. |
| Cobro | Entrada registrada o reversión | El estado pendiente/parcial/saldado se deriva de entradas vigentes y el total. |

## Datos que no forman parte del modelo inicial

- Inventario, reservas y disponibilidad de stock.
- Comprobantes de transferencia, credenciales bancarias y números de tarjeta.
- Facturas fiscales, libro contable, impuestos calculados o conciliación bancaria.
- Catálogo completo de teléfonos y dispositivos, números de serie o IMEI.
- Datos de facturación por suscripción SaaS de BYTE-CX.

## Preguntas pendientes

- ¿Se necesita una entidad `Customer` o es suficiente con una referencia opcional en el pedido?
- ¿Qué información de contacto necesita una tienda y por cuánto tiempo la conserva?
- ¿Cotización y pedido deben usar referencias numeradas visibles y quién las define?
- ¿Se permiten varios pagos por pedido, anticipos, devoluciones o sobrepagos?
- ¿Hay entrega parcial o varias entregas para el mismo pedido?
- ¿Se necesita más de una sucursal por negocio y qué datos son propios de cada sucursal?
- ¿BOB basta en la primera etapa o un comercio cobra regularmente en más de una moneda?
