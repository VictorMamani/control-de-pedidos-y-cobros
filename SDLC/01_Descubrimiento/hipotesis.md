# Hipótesis iniciales | Control de pedidos y cobros

- **Fecha de inicio:** 25 de septiembre de 2026
- **Estado:** por validar; investigación de escritorio
- **Fuente:** idea inicial registrada en el README del proyecto; todavía no hay entrevistas, observaciones ni clientes confirmados.

## Hipótesis de problema

Algunos comercios pequeños que venden periféricos, celulares o componentes de PC podrían tener dificultad para seguir una consulta o cotización hasta la reserva, entrega y confirmación del cobro cuando la información queda repartida entre conversaciones y registros.

Es una suposición de trabajo. Todavía no se ha observado en un negocio real ni se sabe si aplica a las tres categorías.

## Foco provisional y subsegmentos

La visión es un servicio por suscripción para varios comercios que venden productos, con un flujo compartido y opciones de configuración. El primer contexto de análisis será tiendas de tecnología —periféricos, celulares y componentes de PC—, sin construir una versión exclusiva para una tienda. Como no hay clientes todavía, el perfil de tienda y el problema siguen siendo hipótesis.

Estos subsegmentos pueden requerir datos y pasos distintos, pero son preguntas por investigar, no requisitos confirmados:

- **Periféricos:** variantes, compatibilidad, disponibilidad y reservas.
- **Celulares:** modelo/versión, color o almacenamiento, garantía y confirmación de pago. No recopilar IMEI ni números de serie reales durante la investigación.
- **Componentes de PC:** especificaciones, compatibilidad entre piezas, cotizaciones de equipos y sustitutos cuando no hay stock.

## Suposiciones críticas

| Suposición | Evidencia actual | Cómo investigarla |
|---|---|---|
| La información de pedidos queda repartida entre varias herramientas | Ninguna observación directa | Pedir que describan un pedido reciente y reconstruir sus pasos |
| Se producen olvidos, duplicaciones, demoras o confusión de estado | Ninguna evidencia directa | Preguntar por la última ocasión concreta en que algo se trabó y sus consecuencias |
| Se necesita seguir stock, variantes, compatibilidad o reserva junto al pedido | Hipótesis de trabajo por tipo de producto | Preguntar cómo confirman disponibilidad y manejan sustituciones, sin convertirlo aún en requisito del producto |
| La confirmación de pago requiere trabajo manual | Idea inicial; falta verificar en el rubro | Entender qué medios usan y cómo marcan que un pago fue confirmado, sin revisar comprobantes reales |
| El problema es lo bastante importante para cambiar un hábito | Desconocido | Observar la solución actual, los intentos de mejora y el interés en probar un flujo sencillo |
| Un registro compartido sería aceptable para el negocio | Desconocido | Preguntar por roles, dispositivos, conectividad y restricciones de datos |
| Varios comercios pueden usar el mismo flujo con ajustes de configuración | Hipótesis de producto SaaS | Comparar cómo registran cotización, pedido, cobro y entrega en distintos comercios |
| El negocio pagaría una suscripción recurrente en lugar de encargar un sistema a medida | Preferencia inicial del fundador; demanda desconocida | Validar frecuencia de uso, valor recurrente, decisión de compra y reacción a una oferta de piloto |

## Señales para revisar la hipótesis

- **La refuerzan:** un mismo problema aparece en tareas y momentos concretos; hay trabajo repetido o consecuencias observables; las personas ya mantienen una solución improvisada o han intentado resolverlo.
- **La debilitan:** cada pedido se gestiona sin fricción, la solución actual es suficiente, el problema es raro o el costo de cambiar supera el beneficio.

No decidas que hay oportunidad solo porque alguien diga que usaría una app. Busca ejemplos recientes y comportamiento real.

## Límites de la primera prueba

Explorar un flujo compartido para cotización/pedido, estado, entrega y confirmación manual de cobro, con categorías y etiquetas configurables. No construir todavía un sistema completo de inventario, marketplace, contabilidad o pagos. No procesar dinero, guardar credenciales bancarias ni recopilar comprobantes reales.
