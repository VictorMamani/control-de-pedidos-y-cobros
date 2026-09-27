# Guía de desarrollo

## Aplicación actual

La aplicación que continúa el desarrollo está en [aplicacion](aplicacion/README.md). El prototipo HTML y el mockup visual siguen disponibles como artefactos históricos; no son el backend ni el runtime de Next.js.

### Requisitos y arranque local

Requisitos: Node.js 22, npm, Docker y esta carpeta dentro del repositorio Git destino.

Desde `aplicacion/`, terminal 1:

```bash
npx supabase start
```

La primera vez, copia `.env.example` a `.env.local`. Completa las variables públicas con `API_URL` y `PUBLISHABLE_KEY` de `npx supabase status`; copia solo esos valores. No guardes `SECRET_KEY`, `SERVICE_ROLE_KEY` ni claves privadas. Añade `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

Terminal 2:

```bash
npm ci
npm run db:reset
npm run dev
```

Abre <http://localhost:3000>. El registro local no exige confirmar el correo. `db:reset` vuelve a crear el esquema usando las migraciones y carga dos negocios de prueba sin claves de login. **Restablece la base y elimina todas las cuentas y datos que se hayan creado localmente.**

Sin variables de Supabase, la app muestra solo un conjunto de lectura con datos sintéticos. Para detener la infraestructura local, usa `npx supabase stop`.

### Verificación automatizada

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm test` usa pgTAP contra PostgreSQL local. Comprueba 52 escenarios, incluidas operaciones permitidas/denegadas, claves foráneas entre negocios, roles `manager`/`seller`, snapshots, límites de cobro, idempotencia y reversión. `npm run test:e2e` crea usuarios sintéticos temporales con nombres `@bytecx.example.test`, recorre Auth/RPC y verifica aislamiento A/B. Después, `npm run db:reset` limpia estos datos.

El flujo visual también se recorrió en Chromium y desde la imagen Docker: registro/login, comercios, cotización de dos líneas, aceptación, preparación, anticipo, saldo, reversión con motivo, nuevo cobro, entrega e historial. El build `npm run build` usa webpack en Next.js 16 y quedó incluido así para que local y Docker usen el mismo compilador.

## Aplicación dockerizada

Primero ejecuta `npx supabase start`. Supabase CLI crea una red Docker externa con alias DNS `kong`; `compose.yaml` la adjunta a la app y configura el SSR con `http://kong:8000`. Esta ruta fue verificada desde el contenedor. Es necesaria porque `localhost` dentro del contenedor es el mismo contenedor.

Desde `aplicacion/`:

```bash
docker compose build
docker compose --env-file .env.local up
```

La app queda en <http://localhost:3000>. Compose no levanta otra instancia de PostgreSQL ni reemplaza a Supabase CLI. `SUPABASE_DOCKER_NETWORK` permite cambiar el nombre de la red si el `project_id` de `supabase/config.toml` se modifica. `SUPABASE_INTERNAL_URL` puede apuntar a otro endpoint alcanzable desde el contenedor. `host.docker.internal:host-gateway` queda disponible como ruta alternativa de Linux, pero en este entorno el acceso al puerto publicado por host no respondió; se usa la red interna de Supabase.

Para un Supabase remoto, cambia `NEXT_PUBLIC_SUPABASE_URL` y la publishable key en `.env.local`; define `SUPABASE_INTERNAL_URL` a una URL alcanzable por el contenedor y configura una red externa existente para Compose. No se han recibido credenciales remotas y ese modo no fue probado.

## Exportar y restaurar en desarrollo

Estas instrucciones se comprobaron solo con cuentas y datos sintéticos locales. El dump no debe guardarse en Git.

Exporta el esquema comercial y el conjunto de datos público/Auth de desarrollo:

```bash
npx supabase db dump --local --schema public --file /tmp/bytecx-schema.sql
npx supabase db dump --local --schema public,auth --data-only --file /tmp/bytecx-data.sql
```

Para ensayar la recuperación en el entorno desechable local:

```bash
npx supabase db reset --no-seed
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/bytecx-data.sql
```

`psql` pedirá las credenciales locales de Postgres. La exportación `--data-only` marca `session_replication_role = replica` por la autorreferencia de reversión de cobros; debe restaurarse localmente con un usuario PostgreSQL privilegiado. Se probó contra una base recreada sin seed: los conteos de negocios, membresías, clientes, cotizaciones/líneas, pedidos/líneas, cobros e historial coincidieron antes y después. Después de la prueba, `npm run db:reset` reconstruye el seed limpio.

Esto demuestra una recuperación de desarrollo, no copias programadas, cifrado, retención, restauración en un entorno aislado de producción ni un backup gestionado.

## Exportación separada por negocio

No hay un exportador de negocio implementado. La estrategia prevista para un incremento futuro:

1. Exigir sesión y rol autorizado y resolver la membresía en el servidor; no aceptar el `business_id` como autorización.
2. Filtrar cada tabla por el mismo `business_id`: `businesses`, `business_memberships`, `customers`, `quotations`, `quotation_lines`, `orders`, `order_lines`, `payment_entries` y `audit_events`.
3. Verificar que cada línea, cobro, reversión y vínculo de cotización apunta a una entidad del mismo negocio mediante sus claves foráneas compuestas.
4. No exportar `auth.users`, contraseñas, tokens ni datos de otros negocios. Ordenar las relaciones parentales y dependientes para restauración, y comprobar conteos/IDs antes de entregar el archivo.
5. Restringir y borrar el archivo temporal después de entregarlo; definir antes cifrado, autorización, retención y auditoría.

Este procedimiento es una **estrategia**, no una capacidad disponible.

## Política pendiente de borrado

No hay botón ni RPC de borrado de negocio. Al diseñarlo se debe decidir de forma explícita si el borrado definitivo elimina membresías, clientes, cotizaciones/líneas, pedidos/líneas, cobros y reversiones, y cómo tratar los eventos de auditoría. El esquema ya encadena algunas dependencias con `CASCADE` y usa `RESTRICT` para proteger movimientos y relaciones; el borrado requeriría una operación transaccional planificada, exportación previa y confirmación reforzada. Borrar un negocio no debe borrar una cuenta Auth que pertenezca a otros negocios. Retención legal y anonimización siguen pendientes.

## Alojamiento y validación comercial

La [lista de requisitos de hosting](requisitos_de_hosting.md) prepara una comparación futura; todavía no se seleccionó proveedor. La investigación con tiendas de tecnología en Cochabamba está **PENDIENTE DE VALIDACIÓN HUMANA**. No hay entrevistas, observaciones ni resultados comerciales registrados; no cargar datos reales.

## Prototipo local anterior

El [prototipo local](prototipo_local/README.md) es una demo separada con `localStorage` sintético. Se sirve desde la raíz del repositorio con:

```bash
python3 -m http.server 4174 --directory SDLC/05_Construccion/prototipo_local
```

Abre <http://localhost:4174>. No representa Auth, RLS ni persistencia compartida.

## Diseño

La app conserva el sistema visual existente: jerarquía operativa, tablas legibles, pocas superficies, formularios directos y estados visibles. El prototipo visual de `../03_Diseno/prototipo_visual/` y las skills Impeccable, Emil y Taste se usan como criterios de revisión, sin rehacer la interfaz completa ni convertir hipótesis en hechos.
