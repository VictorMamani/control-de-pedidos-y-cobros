# Contenido y estados de pantalla | Borrador

Los textos siguientes son candidatos de interfaz. Confirmar vocabulario con comercios antes de implementarlos.

## Etapa comercial

| Etapa | Uso propuesto |
|---|---|
| Consulta (opcional) | Aún se recopila información o se confirma disponibilidad. |
| Borrador de cotización | El personal está definiendo productos y precios; todavía no la marca como compartida. |
| Cotización enviada | La propuesta se compartió por el canal que usa el comercio; el envío se anota manualmente. |
| Pedido confirmado | El comprador aceptó; comienza el seguimiento del pedido. |
| No concretada | Una consulta/cotización no seguirá; podría tener motivo «rechazada» o «expirada». |
| Cancelado | Un pedido confirmado no continuará; permanece en el historial. |

Una consulta podría convertirse directamente en pedido. Las etapas y motivos son hipótesis; confirmar si las tiendas necesitan separar el borrador y el envío o si esos pasos pueden compartir estado.

## Preparación y entrega

| Estado | Uso propuesto |
|---|---|
| Sin iniciar | El pedido está confirmado, pero todavía no comenzó su preparación. |
| En preparación | Se están armando o solicitando los productos. |
| Listo para retiro/entrega | El comercio indica que ya puede coordinar el traspaso. |
| Entrega parcial | Solo una parte del pedido llegó al comprador; caso por validar. |
| Entregado / cerrado | El negocio considera que terminó el cumplimiento. |

Estos estados no comprueban stock ni transporte. Se actualizarían manualmente en el concepto actual.

## Estado del cobro

Se muestra y actualiza por separado de la etapa comercial y de preparación/entrega:

- **Sin registrar:** todavía no hay cobros anotados.
- **Pendiente:** hay un total acordado y no se ha registrado el pago completo.
- **Parcial:** se registró un monto menor al total.
- **Confirmado manualmente:** el encargado registró que recibió el total.
- **No aplica:** el registro aún no llegó a una etapa de venta o no requiere cobro.

«Confirmado manualmente» significa que una persona del negocio lo anotó. La aplicación no valida una transferencia ni procesa el pago.

## Mensajes de interfaz

| Situación | Texto propuesto |
|---|---|
| Lista vacía | «Todavía no hay registros. Crea una consulta o cotización para comenzar.» |
| Búsqueda sin resultados | «No encontramos registros con esos datos. Revisa el código o cambia el filtro.» |
| Guardado | «Registro guardado.» |
| Conversión | «Cotización convertida en pedido. Se conservaron los productos y el historial.» |
| Envío anotado | «Marcaste la cotización como enviada. Registra la respuesta cuando la recibas.» |
| Error al guardar | «No se pudo guardar. Tus datos siguen en el formulario; vuelve a intentarlo.» |
| Falta un dato requerido | «Completa [nombre del campo] para continuar.» |
| Cancelación | «¿Cancelar este registro? Seguirá visible en el historial.» |
| Cobro guardado | «Cobro registrado manualmente por [persona]. Revisa el total antes de cerrar.» |

## Reglas de presentación

- Usar texto además de color para distinguir las tres dimensiones.
- Mostrar fechas con una fecha concreta y hora local del negocio cuando exista una acción reciente.
- Indicar quién cambió cada estado o anotó un cobro.
- No mostrar saldo calculado si falta el total acordado.
- Diferenciar «disponibilidad anotada» de «stock sincronizado».
- No cambiar automáticamente preparación/entrega al registrar un cobro, ni cambiar el cobro al cerrar la entrega.
- Si un campo es opcional, indicarlo; si es obligatorio, explicar por qué.
- Antes de cancelar o cambiar una etapa que cierre el flujo, explicar el efecto y pedir confirmación.
