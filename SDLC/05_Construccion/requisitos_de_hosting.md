# Requisitos para evaluar hosting

**Estado:** criterios para comparar opciones futuras; no hay proveedor elegido ni despliegue de producción.

| Criterio | Qué comprobar |
|---|---|
| Next.js | Node.js/standalone Docker, variables runtime, healthcheck y rollback de despliegue |
| Supabase | Ubicación/región, Auth, PostgreSQL, RLS y conectividad privada desde la app |
| Costo | Costo mensual total en una carga pequeña, cuotas incluidas y precio al superar cuotas |
| Recuperación | Frecuencia y retención de backups, restore a un entorno aislado y evidencia del último ensayo |
| Operación | Logs, métricas, alertas, límites de soporte y exportación de datos |
| Seguridad | Gestión de secretos, HTTPS, permisos de equipo y rotación de credenciales |
| Salida | Exportar esquema y datos por negocio, restaurarlos fuera del proveedor y solicitar borrado |
| Ubicación | Región de cómputo/base de datos, latencia para Bolivia y obligaciones aplicables por validar |

Antes de decidir, comparar al menos dos opciones con precios y condiciones vigentes. No trasladar datos reales hasta completar un ensayo de migración, recuperación, exportación y eliminación; tampoco asumir cumplimiento legal o backups productivos por tener un proveedor configurado.
