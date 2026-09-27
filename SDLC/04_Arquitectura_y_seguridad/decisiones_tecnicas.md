# Decisiones técnicas | Registros ADR

Estos registros son decisiones provisionales para guiar el ejercicio de aprendizaje. Se revisan tras las conversaciones AS-IS y antes de escribir migraciones o desplegar con datos reales.

## ADR-001 | Monolito modular para la primera versión

- **Estado:** propuesta.
- **Fecha:** 25 de septiembre de 2026.
- **Contexto:** BYTE-CX parte de una persona aprendiendo y de un flujo aún no validado. Microservicios requerirían más despliegues, comunicación entre procesos y operación.
- **Decisión:** iniciar con una aplicación desplegable y un repositorio, separando módulos de identidad/negocio, cotizaciones, pedidos, entrega, cobros e historial.
- **Ventajas:** menor cantidad de infraestructura; permite aprender límites de dominio y entregar un flujo vertical; transacciones de datos sencillas.
- **Costos/riesgos:** si el dominio crece, se necesitará mantener límites internos y evitar que los módulos se mezclen.
- **Revisar si:** varios equipos trabajan con ciclos distintos, hay necesidades de escala independientes o el despliegue único bloquea cambios.

## ADR-002 | Base compartida con aislamiento por `business_id`

- **Estado:** propuesta con condición de seguridad alta.
- **Fecha:** 25 de septiembre de 2026.
- **Contexto:** un SaaS para varios comercios necesita separar datos. Una base y esquema compartidos evitan gestionar una base por cliente al inicio, pero elevan el impacto de errores de autorización.
- **Decisión:** usar PostgreSQL compartido, `business_id` en cada fila comercial, capa de acceso que valide membresía y políticas RLS. Relaciones entre tablas deben conservar el mismo tenant.
- **Ventajas:** operación inicial simple y una ruta directa para probar el producto con datos sintéticos.
- **Costos/riesgos:** todas las lecturas, escrituras, vistas, exportaciones y procesos administrativos pueden filtrar información si una política o consulta omite el tenant. Las claves con permiso elevado pueden omitir RLS.
- **Condición de entrada:** no cargar datos de comercios hasta tener pruebas automatizadas de aislamiento que demuestren acceso permitido y denegado entre tenants.
- **Revisar si:** clientes requieren aislamiento dedicado, exportaciones por tenant más estrictas o condiciones contractuales distintas.

PostgreSQL aplica políticas de fila si RLS se habilita y existe una política para permitir la operación; Supabase advierte que roles/llaves con `BYPASSRLS` deben mantenerse fuera del navegador. ([PostgreSQL RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security))

## ADR-003 | Registrar cobros manualmente, sin procesar dinero

- **Estado:** propuesta alineada al alcance actual.
- **Fecha:** 25 de septiembre de 2026.
- **Contexto:** el problema planteado es seguimiento y control; integrar bancos o tarjetas agregaría riesgos, dependencias y obligaciones aún no investigadas.
- **Decisión:** guardar entradas manuales de cobro con importe, moneda, fecha, método etiquetado y usuario que las anotó. El sistema calcula el saldo, pero no verifica el pago ni retiene fondos.
- **Ventajas:** permite aprender la parte comercial sin integración financiera ni credenciales sensibles.
- **Costos/riesgos:** el registro refleja lo que reportó la persona; puede no coincidir con el dinero recibido.
- **Revisar si:** usuarios solicitan evidencia de conciliación y se investiga un proveedor/reglas del país antes de diseñar esa integración.

## ADR-004 | Next.js App Router + TypeScript y Supabase Auth/PostgreSQL

- **Estado:** implementado como base de aprendizaje local; proveedor conectado y uso comercial pendientes.
- **Fecha:** 25 de septiembre de 2026.
- **Contexto:** se busca una sola base de código para interfaz y lógica web, con identidad y PostgreSQL administrados. La persona está aprendiendo frontend, backend y operación de SaaS.
- **Decisión:** considerar Next.js App Router + TypeScript, Tailwind/shadcn para la interfaz, Supabase Auth para identidad y PostgreSQL con RLS para persistencia. Mantener reglas de negocio en módulos del servidor/capa de acceso y no acoplar entidades de negocio al proveedor.
- **Ventajas:** una ruta de aprendizaje continua desde formulario hasta persistencia, despliegue y autorización; PostgreSQL permite definir integridad relacional.
- **Costos/riesgos:** dependencia de proveedores; configuración de sesión SSR y RLS tiene detalles que deben comprobarse; el proveedor de alojamiento de la aplicación y la región aún no están elegidos.
- **Revisar si:** costo vigente, residencia/ubicación de datos, exportación o requisitos de operación no convienen; considerar alternativa que mantenga PostgreSQL portable.

La documentación oficial de Next.js describe App Router, Server Components y Server Actions; recomienda autorización en la capa de acceso a datos y comprobación en cada acción. Supabase documenta el cliente SSR para Next.js y RLS como control de acceso a filas. ([Next.js App Router](https://nextjs.org/docs/app), [Next.js: autenticación](https://nextjs.org/docs/app/guides/authentication), [Supabase SSR para Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs))

## ADR-005 | Sin microservicios, colas, adjuntos ni integración de pagos al inicio

- **Estado:** propuesta.
- **Fecha:** 25 de septiembre de 2026.
- **Decisión:** no añadir infraestructura distribuida ni almacenamiento de adjuntos hasta que una necesidad validada la justifique.
- **Revisar si:** hay trabajos lentos que necesiten procesamiento asíncrono, notificaciones autorizadas, adjuntos necesarios o volumen que supere los límites del monolito.
