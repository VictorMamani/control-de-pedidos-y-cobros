# Escenarios sintéticos | Flujo adaptable

**Importante:** estos ejemplos son inventados para pensar en el flujo. No representan entrevistas, clientes, prácticas de tiendas bolivianas ni evidencia de demanda.

## A | Venta de un periférico

Una persona pregunta por un teclado. El negocio confirma modelo y disponibilidad, prepara una cotización, registra el pedido cuando se acepta, marca el cobro manualmente y actualiza la entrega o retiro.

## B | Consulta por celular

Una persona pregunta por un modelo y una variante. El negocio consulta disponibilidad; si no la tiene, podría ofrecer una reserva o una alternativa. El estado del pedido y cualquier anticipo se registrarían por separado. No almacenar IMEI, número de serie, comprobantes ni datos bancarios.

## C | Cotización de componentes de PC

Una persona solicita varios componentes. El negocio prepara una cotización, revisa compatibilidades y disponibilidad, puede proponer sustitutos y convierte la cotización aceptada en pedido. El seguimiento del cobro y de la preparación continúa como estados independientes.

## Posible núcleo compartido

| Elemento | Común a los ejemplos | Diferencia configurable o pendiente |
|---|---|---|
| Cotización/pedido | Fecha, responsable, productos, cantidad y estado | Una cotización puede tener un producto o varios |
| Producto | Nombre e identificador de catálogo | Modelo, variante o atributos técnicos cambian por categoría |
| Disponibilidad | El negocio necesita saber si puede cumplir el pedido | Puede ser stock actual, reserva o consulta a proveedor; no asumir inventario en tiempo real |
| Cobro | Estado separado del estado de preparación/entrega | Puede existir anticipo o pago parcial; frecuencia desconocida |
| Entrega | Registrar retiro, entrega o cierre si aplica | El proceso puede variar por tienda |

## Prueba de adaptabilidad

Para cada caso, preguntar:

1. ¿Se puede seguir usando el mismo objeto de cotización/pedido?
2. ¿Qué campos son esenciales para todos los casos?
3. ¿Qué diferencias se resuelven con categorías y atributos configurables?
4. ¿Qué diferencia obligaría a desarrollar otro módulo?
5. ¿El mismo flujo tendría sentido fuera de tiendas de tecnología?

Si cada caso necesita estados, reglas y pantallas radicalmente distintos, reducir el primer segmento en vez de construir un configurador universal. El siguiente paso puede ser convertir estos escenarios en un boceto simple y revisarlo cuando exista acceso a una tienda.
