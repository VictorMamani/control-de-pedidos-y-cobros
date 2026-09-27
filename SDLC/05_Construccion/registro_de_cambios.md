# Registro de cambios

## 0.3 | MVP técnico local | 27 de septiembre de 2026

### Implementado

- Selector de comercio activo, soporte de varios negocios por usuario y resolución/validación del contexto en servidor.
- Migración incremental con clientes mínimos, cotizaciones, líneas snapshot, enlace idempotente cotización→pedido, roles `owner`/`manager`/`seller`, razones de cancelación y reversión, y procedimientos SQL atómicos.
- Estados comercial, preparación y financiero derivados separados; saldo calculado desde líneas y cobros/reversiones.
- Historial de cotización, pedido, preparación, cobro, reversión y cancelación; resumen operativo desde Supabase.
- Seed sintético multi-tenant, pruebas pgTAP, E2E local Auth/RPC y soporte Docker multi-stage para la app Next.js.
- Documentación de entorno, exportación/restauración sintética, límites de borrado, estrategia de exportación por negocio y evaluación futura de hosting.

### Probado

- `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` (52 comprobaciones pgTAP), `npm run test:e2e` y `npm run build` (Next.js/webpack).
- `npx supabase db reset` reconstruyó ambas migraciones y el seed. El E2E creó dos usuarios sintéticos y confirmó aislamiento A/B.
- Playwright recorrió registro/login, varios comercios, cotización con dos líneas, envío, aceptación, snapshots, preparación, anticipo, saldo, reversión, nuevo cobro, entrega e historial.
- `docker compose build` terminó; la app quedó healthy y la conexión del contenedor a Supabase Auth respondió HTTP 200. También se recorrió el flujo principal desde el contenedor.
- Exportación local del esquema/datos y restauración sobre esquema reconstruido sin seed; conteos agregados de tablas comerciales coincidieron.
- Consola del navegador de la app de producción sin errores nuevos; sin auditoría completa WCAG.
- Revisión de detalle y navegación a 390 px: todo el contenido principal cabe en el viewport; la tabla conserva su desplazamiento local. Detector visual Impeccable sin hallazgos en las rutas revisadas.

### Pendiente

- Configuración y recorrido contra un proyecto Supabase remoto de desarrollo; no se recibieron credenciales remotas.
- Administración/invitación de memberships desde UI, investigación humana con comercios, hosting/producción, backups gestionados y automatizados, exportador por negocio y borrado de negocio.
- Revisión legal, retención, anonimización y experiencia real con vendedores/gerentes.

### Hipótesis

- La propuesta adaptable para comercios de tecnología, el flujo común y el modelo de renta por negocio siguen sin validación comercial. Ninguna prueba técnica demuestra demanda o rentabilidad.

## 0.2 | Aplicación Next.js inicial | 25 de septiembre de 2026

- Se creó una app Next.js App Router con TypeScript, Tailwind CSS y shadcn/ui.
- Se añadieron Supabase Auth SSR, validación Zod, plantilla de entorno y migración PostgreSQL con RLS.
- Se implementaron acceso, espacio de trabajo, resumen, lista, detalle y alta atómica de pedidos con líneas.
- Se añadieron cambios de preparación y cobros parciales manuales, con validación en servidor/SQL e historial.
- Sin credenciales, la app presentaba registros ficticios de solo lectura.
- En esa entrega histórica no se había configurado Supabase ni se habían ejecutado pruebas.

## 0.1 | Prototipo local de pedidos | 25 de septiembre de 2026

- Se añadieron dos perfiles y comercios ficticios para recorrer el flujo local.
- Se podía crear, buscar, filtrar y cambiar el estado de preparación de pedidos.
- Los pedidos de cada perfil se guardaban bajo una clave distinta de `localStorage`.
- Se añadió reinicio de datos por comercio demo.
- El acceso y la separación se identificaban claramente como simulación, no controles de seguridad.
- Cobros parciales y backend real quedaban fuera de esa entrega.
