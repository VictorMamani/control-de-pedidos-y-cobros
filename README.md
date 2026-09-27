# Candidato 01 | Control de pedidos y cobros

- **Estado:** hipótesis comercial no validada; existe una primera app de aprendizaje, sin clientes ni datos reales.
- **Foco provisional:** un SaaS adaptable para comercios que venden productos; empezaríamos usando tiendas de periféricos, celulares o componentes de PC como contexto, sin programar una versión exclusiva para un cliente.
- **Problema hipotético:** al cotizar o recibir pedidos, puede costar seguir disponibilidad, reserva, entrega y cobro si la información queda repartida entre conversaciones y registros.
- **Alcance de prueba:** un flujo común de consulta/cotización/pedido, preparación/entrega y seguimiento manual del cobro, con ajustes simples por negocio.
- **Modelo comercial por comprobar:** acceso alojado por suscripción recurrente, inicialmente pensado por negocio/local. Precio, frecuencia y niveles todavía no se definen.
- **Riesgos/limitaciones:** alternativas existentes, poca disposición a migrar datos, acceso a información de pagos, soporte y uso de datos de clientes.
- **Estado de construcción:** existe un MVP técnico 0.3 en Next.js/Supabase local, recorrido con cuentas y datos sintéticos. Aún no es una versión comercial ni se conectó un proyecto Supabase remoto.
- **Siguiente paso de descubrimiento:** preparar y realizar conversaciones/observaciones AS-IS con comercios de tecnología en Cochabamba. No hay evidencia de campo todavía.
- **Ejercicio de arquitectura:** existe una [arquitectura de referencia](SDLC/04_Arquitectura_y_seguridad/arquitectura.md) para aprender cómo se estructura un SaaS, con [modelo de datos](SDLC/04_Arquitectura_y_seguridad/modelo_de_datos.md), [decisiones técnicas](SDLC/04_Arquitectura_y_seguridad/decisiones_tecnicas.md) y [seguridad y privacidad](SDLC/04_Arquitectura_y_seguridad/seguridad_y_privacidad.md). Es provisional y no reemplaza la validación del proceso con comercios de Cochabamba.
- **Experimentos ejecutables:** el [prototipo local](SDLC/05_Construccion/prototipo_local/README.md) usa `localStorage` ficticio. La [aplicación web](SDLC/05_Construccion/aplicacion/README.md) continúa la base con Next.js/Supabase; sin variables presenta datos de solo lectura y no guarda.

## Estructura SDLC

Las carpetas de `SDLC/` contienen plantillas para descubrimiento, planificación, diseño, arquitectura/seguridad, construcción, verificación, lanzamiento, operación y mejora/cierre. Completar por evidencia, no por adelantado.

## Entorno de trabajo

- La skill de este proyecto está instalada en el perfil personal de Codex; guía el trabajo repetible y mantiene presentes las hipótesis y cuidados de datos.
- El MCP de documentación OpenAI está configurado en Codex para consultar documentación oficial. No da acceso a datos del negocio ni sustituye la investigación con usuarios.
- Playwright MCP está configurado en el perfil global para inspeccionar el [prototipo visual local](SDLC/03_Diseno/prototipo_visual/README.md) y la app en ejecución. La app incorpora Tailwind y shadcn/ui; el desarrollo local usa Supabase CLI/Docker. Sigue pendiente conectar un proyecto remoto de desarrollo.
- Las decisiones locales de diseño se documentan en `SDLC/03_Diseno/`; la aplicación se revisa en navegador con Playwright MCP.

La aplicación se plantea como un servicio por suscripción, no como desarrollo a medida para una tienda. La adaptabilidad se limitará a opciones de configuración; primero hay que demostrar que varias tiendas comparten el flujo central.

El [product brief](SDLC/02_Planificacion/product_brief.md) y el [alcance adaptable](SDLC/02_Planificacion/alcance_adaptable.md) describen esta hipótesis con más detalle.
