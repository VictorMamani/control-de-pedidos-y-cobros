# Aplicación web | Control de pedidos y cobros

**Estado:** MVP técnico 0.3 ejecutable localmente con Supabase. No está desplegado ni validado como producto comercial.

Esta es la app Next.js existente que continúa el proyecto. El prototipo HTML con `localStorage` y el prototipo visual permanecen como referencias históricas y no forman parte del runtime.

## Stack

- Next.js App Router, React y TypeScript.
- Tailwind CSS y componentes de shadcn/ui.
- Supabase Auth SSR y PostgreSQL con RLS.
- Zod, Server Actions y RPC SQL transaccionales.
- Supabase CLI para el entorno local; Docker Compose solo contiene la app Next.js.

## Preparar el entorno local

Requisitos: Node.js 22, npm, Docker en ejecución y Git. El CLI de Supabase se instala como dependencia de desarrollo.

Desde esta carpeta, abre la primera terminal e inicia Supabase:

```bash
npx supabase start
```

La configuración local desactiva la confirmación de correo para facilitar el aprendizaje. Esta opción pertenece a `supabase/config.toml`; no debe copiarse a un entorno remoto o de producción.

En otra terminal, crea `.env.local` a partir de `.env.example` y completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con `API_URL` y `PUBLISHABLE_KEY` que muestra `npx supabase status`. Copia solo esos dos valores. No uses `SECRET_KEY`, `SERVICE_ROLE_KEY` ni claves privadas. Añade `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

Aplica las migraciones y carga los fixtures sintéticos:

```bash
npm run db:reset
```

Luego inicia la app:

```bash
npm run dev
```

Abre <http://localhost:3000>, regístrate con una cuenta sintética y crea un comercio. `db:reset` borra los datos locales y reconstruye el esquema desde las migraciones antes de cargar `supabase/seed.sql`.

Sin `.env.local`, la app ofrece datos sintéticos de solo lectura; no es un modo de autenticación ni permite guardar.

## Flujo implementado

- Registro, inicio y cierre de sesión con Supabase Auth.
- Creación de varios comercios y selector de comercio activo; el servidor valida la membresía antes de aceptar la cookie de contexto.
- Roles `owner`, `manager` y `seller`; cancelar pedidos requiere `owner` o `manager`.
- Cotizaciones con líneas, snapshots, vigencia y estados `draft`, `sent`, `accepted`, `declined` y `expired`.
- Aceptación idempotente de cotización y conversión atómica a pedido con copia de líneas, precios y moneda.
- Estados comerciales `confirmed` y `cancelled`, separados de preparación `not_started`, `preparing`, `ready` y `delivered`.
- Cobros manuales parciales. El saldo se deriva de las líneas y movimientos vigentes; una reversión agrega un movimiento relacionado y conserva el original.
- Historial cronológico con actor y fecha, y resumen operativo consultado desde Supabase.
- RLS, claves foráneas compuestas y RPC validadas para limitar operaciones al negocio y prevenir relaciones cruzadas.

La anotación de un cobro registra lo que una persona informó. No verifica que un banco haya recibido el dinero ni procesa pagos.

## Comandos de calidad

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm test` conecta con Supabase local y ejecuta 52 comprobaciones pgTAP de tenant, roles, restricciones, saldo, snapshots, transiciones, cancelación y reversión. `npm run test:e2e` registra dos usuarios sintéticos temporales y recorre los RPC principales y el aislamiento A/B. Ejecuta antes `npx supabase start`; usa `npm run db:reset` para limpiar cuentas de prueba y volver al seed de dos comercios.

## Docker

Supabase local se inicia aparte, mediante su CLI. Desde esta carpeta:

```bash
npx supabase start
docker compose --env-file .env.local up --build
```

La app queda en <http://localhost:3000>. Compose conecta el contenedor a la red externa `supabase_network_bytecx-control-pedidos` creada por `supabase start` y usa el alias `kong:8000` para SSR. La URL pública de `.env.local` sigue siendo `http://127.0.0.1:54321` para el navegador. `host.docker.internal:host-gateway` está disponible como ruta alternativa, pero en este entorno no permitió llegar al puerto publicado por el host. No se construye Supabase dentro de `compose.yaml`.

Para detener solo la app, usa `Ctrl+C` o `docker compose down`. Para detener Supabase, ejecuta `npx supabase stop`.

El build de producción usa `next build --webpack`, opción disponible en Next.js 16 y verificada en este entorno. El contenedor usa build multi-stage, salida standalone y usuario sin privilegios.

## Variables

`.env.example` documenta estos nombres sin credenciales:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL de retorno de Auth |
| `NEXT_PUBLIC_SUPABASE_URL` | URL que usa el navegador |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable limitada por RLS |
| `SUPABASE_INTERNAL_URL` | URL SSR dentro de Docker; localmente `http://kong:8000` |
| `SUPABASE_DOCKER_NETWORK` | Red externa creada por Supabase CLI; cambia junto con `project_id` si se renombra |

Un Supabase remoto de desarrollo puede configurarse luego en `.env.local`. No hay credenciales remotas en este entorno. Nunca añadas secretos al repositorio ni al cliente; el flujo ordinario no usa `service_role`.

## Copia y recuperación local

Las migraciones reconstruyen el esquema y `supabase/seed.sql` repone dos comercios sintéticos sin contraseñas de login. [La guía de desarrollo](../guia_de_desarrollo.md) contiene comandos de dump/restauración local que se probaron comparando conteos antes/después. Esto no constituye una copia de seguridad productiva ni un plan probado de continuidad.

## Límites y pendientes

- Sin información real, entrevistas o observaciones inventadas: la validación con tiendas de tecnología en Cochabamba está **PENDIENTE DE VALIDACIÓN HUMANA**.
- No incluye inventario, facturación, canales de mensajería, pagos automáticos, pasarelas, logística ni almacenamiento de comprobantes.
- No hay invitación ni administración de membresías desde la interfaz; roles y restricciones se aplican en SQL.
- No se configuró Supabase remoto, hosting, backups gestionados ni despliegue de producción.
- No usar datos de clientes, teléfonos, domicilios, cuentas, tarjetas, IMEI ni números de serie.

Consulta [guía de desarrollo](../guia_de_desarrollo.md), [estructura del código](../estructura_del_codigo.md), [registro de cambios](../registro_de_cambios.md) y [trabajo pendiente](../trabajo_pendiente.md).
