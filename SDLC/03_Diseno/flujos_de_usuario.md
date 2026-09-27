# Flujos de usuario | Borrador

**Estado:** propuesta de baja fidelidad basada en escenarios inventados. Validación pendiente con comercios.

Las rutas detalladas y sus preguntas están en la [matriz de estados y transiciones](matriz_de_estados_y_transiciones.md).

## Roles hipotéticos

- **Personal de atención:** registra consultas, prepara cotizaciones y actualiza pedidos.
- **Encargado del negocio:** revisa pendientes, asigna responsables y confirma manualmente cobros.

Una misma persona puede cumplir ambos roles en un comercio pequeño. Los permisos reales se decidirán después de observar cómo trabajan los negocios.

## Flujo principal: atender una consulta y seguirla hasta el cierre

1. La persona usuaria abre la bandeja y revisa registros que requieren atención.
2. Busca si ya existe una cotización o pedido relacionado para evitar duplicarlo.
3. Registra una consulta nueva, con los datos mínimos para retomarla.
4. Añade uno o varios productos como texto libre o desde un catálogo, si está disponible.
5. Anota cantidades, precio propuesto y disponibilidad que el comercio haya confirmado manualmente.
6. Guarda como consulta o borrador de cotización, según lo que haya ocurrido realmente.
7. Si comparte la cotización fuera de la aplicación, marca «Cotización enviada» para poder retomarla después.
8. Si el comprador acepta, convierte el mismo registro en pedido confirmado y conserva productos e historial. Si no continúa, puede marcarlo «No concretada».
9. El personal actualiza por separado preparación/entrega; el encargado anota el cobro cuando lo confirma.
10. Si el pedido continúa, el negocio marca la entrega como completada; si se cancela, registra la cancelación desde el estado actual. Ambos resultados quedan en el historial. Un pedido entregado aún podría tener cobro pendiente.

### Decisiones de diseño por comprobar

- La etapa comercial, la preparación/entrega y el cobro se muestran como dimensiones separadas.
- Como hipótesis, consulta, borrador/enviada y pedido conservan el mismo registro para reducir duplicados; validar si refleja el proceso real.
- Los cambios de preparación/entrega no cambian automáticamente el estado del cobro, ni al revés.
- La disponibilidad es una nota o estado manual; no implica inventario sincronizado.
- El pago no se procesa ni se verifica desde la aplicación.
- El contacto del cliente debe limitarse a lo necesario para dar seguimiento. No guardar números de tarjeta o cuenta, comprobantes, IMEI ni números de serie.

## Flujos secundarios

### Registrar un anticipo o pago parcial

1. Abrir el pedido correcto.
2. Elegir «Registrar cobro».
3. Introducir monto recibido, fecha, método como texto/opción y persona que lo confirmó.
4. Revisar el resumen antes de guardar.
5. La aplicación actualiza el total registrado y presenta el saldo calculado, si el monto total está definido.

Si el monto total no está definido, no mostrar un saldo como si fuera exacto. La persona responsable corrige un registro equivocado mediante una acción visible en el historial; no se borra silenciosamente.

### Cancelar una cotización o pedido

1. Abrir el registro.
2. Elegir «Cancelar» y seleccionar o escribir un motivo opcional.
3. Confirmar la acción.
4. Mantener el registro en el historial como cancelado, sin incluirlo entre pendientes activos.

No se define aquí cómo tratar devoluciones o reembolsos; es una decisión de negocio aún no investigada.

### Cerrar una cotización sin venta

1. Abrir la consulta o cotización.
2. Elegir «No concretada» y, si ayuda al negocio, registrar un motivo breve como «rechazada» o «expirada».
3. Mantenerla en el historial, fuera de la bandeja de trabajo activa.

Los motivos y recordatorios son candidatos, no requisitos confirmados.

## Criterio de finalización del flujo

Una persona nueva debería poder encontrar un registro, entender el siguiente paso y distinguir su etapa comercial, preparación/entrega y cobro. Esto es una meta de diseño, todavía no un resultado probado.
