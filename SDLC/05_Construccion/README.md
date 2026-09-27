# 05 | Construcción

**Objetivo:** entregar cambios pequeños, entendibles y conectados con criterios acordados.

## Artefactos de construcción

- [Prototipo visual](../03_Diseno/prototipo_visual/README.md): pantallas estáticas navegables que guían la interfaz.
- [Prototipo local](prototipo_local/README.md): demo anterior en HTML/CSS/JavaScript con almacenamiento local ficticio; no es autenticación ni aislamiento seguro.
- [Aplicación web](aplicacion/README.md): implementación principal que continúa la base Next.js/Supabase; mantiene comercio activo, cotizaciones, pedidos, preparación, cobros manuales y reversión.
- **Estado 0.3:** MVP técnico recorrido con Supabase local, dos identidades/tenants sintéticos, build Docker y pruebas automatizadas. Sin variables Supabase, la vista previa es solo de lectura.
- No hay credenciales remotas, despliegue ni clientes. No cargar datos reales.

## Documentos sugeridos

- [Guía de desarrollo](guia_de_desarrollo.md): cómo abrir el mockup, la demo anterior y la app actual.
- [Estructura del código](estructura_del_codigo.md): límites de carpetas de la app y artefactos anteriores.
- [Registro de cambios](registro_de_cambios.md): cambios visibles por versión.
- [Trabajo pendiente](trabajo_pendiente.md): siguientes cortes de aprendizaje y condiciones para backend real.
- [Requisitos de hosting](requisitos_de_hosting.md): criterios para una comparación futura; no selecciona proveedor.

## Salida de fase

La persistencia local, migraciones y pruebas de aislamiento ya se ejecutan con Supabase CLI/Docker. La construcción sigue siendo aprendizaje técnico: el problema, la propuesta comercial, el precio y la rentabilidad están pendientes de validación humana con comercios.
