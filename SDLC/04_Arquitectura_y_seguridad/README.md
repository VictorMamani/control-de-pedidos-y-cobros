# 04 | Arquitectura y seguridad

**Objetivo:** decidir la estructura técnica mínima y cuidar los datos desde el comienzo.

## Estado de este proyecto

La arquitectura de abajo es un ejercicio de referencia para aprender cómo se estructura un SaaS comercial. Parte de la hipótesis actual de pedidos y cobros para tiendas de tecnología; todavía no está validada con comercios de Cochabamba ni aprobada como especificación de producción. Las decisiones deben revisarse con evidencia antes de desplegar el producto o almacenar datos reales.

## Documentos sugeridos

- [Arquitectura de referencia](arquitectura.md): contexto, componentes, recorrido de datos, despliegue y plan de aprendizaje.
- [Modelo de datos inicial](modelo_de_datos.md): entidades, relaciones, límites y decisiones pendientes.
- `api_e_integraciones.md`: endpoints/eventos, permisos, costos y dependencias de terceros.
- [Decisiones técnicas](decisiones_tecnicas.md): registros ADR provisionales y condiciones para revisarlos.
- [Seguridad y privacidad](seguridad_y_privacidad.md): riesgos, acceso por comercio, datos mínimos, secretos, respaldo y borrado.

`api_e_integraciones.md` se completará cuando exista un flujo validado que necesite una interfaz de API o servicios externos.

## Salida de fase

La solución propuesta es posible de operar con el equipo disponible; se sabe dónde viven los datos, quién puede verlos y cómo se restaura o elimina información importante. Para este candidato todavía quedan por validar el segmento, el flujo común y el proveedor de alojamiento.
