# Trabajo pendiente

## IMPLEMENTADO Y PROBADO en el corte 0.3

- App Next.js existente con registro/login, varios comercios, selector activo, cotizaciones, conversión a pedido, snapshots, preparación, cobros parciales, reversión, saldo, auditoría e historial.
- Supabase local con migraciones reproducibles, seed sintético y RLS multi-tenant comprobada con dos identidades.
- Pruebas de reglas críticas y roles; build, lint, TypeScript y app en Docker.
- Ensayo local de dump/restauración sintética con comparación de conteos.

Los comandos y límites probados se mantienen en [registro de cambios](registro_de_cambios.md) y [guía de desarrollo](guia_de_desarrollo.md).

## PENDIENTE técnico

- Configurar y validar un proyecto Supabase **remoto de desarrollo** cuando existan credenciales en `.env.local`; no se recibieron credenciales para este trabajo.
- Implementar una forma autorizada de invitar miembros y administrar `owner`/`manager`/`seller`; hoy los roles y permisos están en el esquema y se probaron en SQL, pero no se pueden asignar desde la UI.
- Convertir exportación de datos por negocio en una capacidad probada; por ahora solo existe una estrategia documentada.
- Definir y luego implementar borrado de negocio con tratamiento explícito de auditoría, membresías, pagos/reversiones, confirmación y política de retención. No existe botón ni RPC de borrado comercial.
- Elegir proveedor de hosting después de comparar costo vigente, región, logs, soporte, backups, recuperación y salida. No hay despliegue de producción.
- Diseñar backups programados/retención/cifrado y ensayar restauración en un entorno aislado. La prueba actual solo cubre desarrollo local.

## PENDIENTE DE VALIDACIÓN HUMANA

- Observar y entrevistar comercios de tecnología en Cochabamba para documentar el flujo actual, excepciones, registros utilizados y lenguaje cotidiano.
- Probar tareas del MVP con personas que venden y coordinan pedidos, y observar errores/tiempos con consentimiento.
- Comparar alternativas existentes y averiguar si el problema se repite en más de un comercio.

No se han realizado ni simulado entrevistas, visitas ni pruebas con tiendas. Registra evidencia en los formatos de descubrimiento antes de cambiar alcance comercial.

## HIPÓTESIS todavía abiertas

- Que varias tiendas comparten un flujo adaptable de cotización, pedido, preparación/entrega y anotación de cobro.
- Que un producto rentado por comercio/local sería preferible al desarrollo a medida.
- Que la app ahorra tiempo o evita errores suficientes para justificar precio y cambio de hábito.
- Qué datos de clientes hacen falta realmente y durante cuánto tiempo deben conservarse.

Estas premisas no son hallazgos ni demuestran rentabilidad.

## Fuera de alcance actual

Inventario, facturación fiscal, WhatsApp/correo, pasarelas y cobros automáticos, banca/conciliación, logística, marketplace, suscripciones integradas, colas, microservicios y Kubernetes.
