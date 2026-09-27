# Ciclo BYTE-CX para diseñar flujos

**Versión:** 0.1 · **Estado:** método inicial para aplicar al proyecto de pedidos y cobros.

Este proceso convierte una tarea real de una persona en un flujo que se puede prototipar, probar y corregir antes de programar. Está inspirado en el Double Diamond del Design Council y en prácticas de investigación, mapeo de recorridos y prototipado descritas en GOV.UK. Se adapta a BYTE-CX; no es una certificación ni una receta rígida.

## Principio central

Separar tres tipos de información durante todo el trabajo:

1. **Lo que hace la gente hoy**, observado o contado por personas del público objetivo.
2. **Lo que hacen productos de referencia**, revisado en documentación pública oficial.
3. **Lo que BYTE-CX propone**, todavía como hipótesis hasta probarlo.

Ver un patrón en Shopify u Odoo puede inspirar una solución, pero no demuestra que una tienda boliviana tenga la misma necesidad ni el mismo proceso.

## El ciclo en nueve pasos

| Paso | Qué hacemos | Salida concreta | Cuándo avanzar |
|---|---|---|---|
| 1. Enmarcar | Definir usuario, tarea, disparador, resultado deseado y límites del flujo. Escribir las dudas de mayor riesgo. | Ficha breve del flujo y preguntas de investigación. | La tarea tiene un inicio y un resultado que se pueden explicar en una frase. |
| 2. Descubrir | Revisar evidencias existentes y conversar/observar personas que realizan la tarea. Preguntar por el último caso real, no solo por preferencias. | Notas anonimizadas y fuentes, separando observaciones de interpretaciones. | Tenemos ejemplos concretos del proceso actual o dejamos explícito que faltan. |
| 3. Mapear el proceso actual (AS-IS) | Ordenar pasos, responsables, herramientas, datos, esperas, decisiones, errores y excepciones tal como ocurren hoy. | Mapa del flujo actual con puntos de fricción y vacíos. | Cada paso importante puede vincularse a una fuente o está marcado como supuesto. |
| 4. Definir el problema | Agrupar hallazgos, formular necesidades y escoger un problema acotado. Escribir qué resultado medirá una mejora. | Necesidad de usuario, alcance y criterio de éxito inicial. | El equipo puede explicar por qué se aborda este problema y qué queda fuera. |
| 5. Contrastar referentes | Revisar 2–3 productos o servicios que resuelven partes de la tarea. Usar documentación oficial para entender objetos, estados, transiciones, filtros y excepciones. | Tabla de patrones, diferencias y decisiones que no se copiarán automáticamente. | Cada patrón adoptado tiene una razón y una pregunta local por validar. |
| 6. Diseñar la propuesta (TO-BE) | Dibujar el flujo futuro más simple; incluir camino principal, decisiones y fallas frecuentes. Separar estados cuando describen trabajos que pueden avanzar por separado. | Mapa propuesto, matriz de transiciones, reglas y preguntas abiertas. | Una persona puede explicar el siguiente paso en cada punto. |
| 7. Prototipar | Empezar con papel, texto o wireframes. Hacerlo interactivo solo cuando la interacción sea la duda a probar. | Prototipo suficiente para recorrer la tarea de principio a fin. | Se puede probar el riesgo principal sin programar el producto. |
| 8. Probar y ajustar | Dar una tarea realista a personas del público objetivo, pedir que la resuelvan y observar sin guiarlas. Anotar éxito, confusión, errores, palabras y atajos. | Resultados por sesión y cambios priorizados. | Las tareas críticas se entienden; los bloqueos y las decisiones pendientes tienen dueño. |
| 9. Decidir y aprender | Registrar qué se conserva, cambia o descarta. Si el producto sale a producción, observar uso y soporte y volver al paso 1 con preguntas nuevas. | Decisión de diseño, criterios de aceptación y señales de seguimiento. | Diseño y producto conocen los límites, casos cubiertos y asuntos pospuestos. |

El ciclo es iterativo: un resultado de prueba puede devolvernos a mapear o incluso a redefinir el problema. No se avanza por completar documentos; se avanza porque disminuye una incertidumbre relevante.

## Ficha mínima para cada flujo

Usar [`plantilla_mapa_de_flujo.md`](plantilla_mapa_de_flujo.md). Como mínimo, documentar:

- usuario y tarea;
- evidencia disponible y vacíos;
- pasos actuales (AS-IS), incluidos canales fuera del software;
- necesidad y resultado esperado;
- propuesta (TO-BE), estados, decisiones y excepciones;
- referentes consultados y por qué sirven;
- prototipo y tareas de prueba;
- decisiones, supuestos que siguen abiertos y fecha de revisión.

## Etiquetas de evidencia

- **OBSERVADO:** vimos a una persona completar el paso.
- **CONTADO:** una persona describió el paso o una experiencia pasada.
- **REFERENTE:** aparece en la documentación o producto citado.
- **HIPÓTESIS:** explicación o propuesta todavía no probada.
- **DECISIÓN:** elección actual de BYTE-CX, con motivo.
- **PENDIENTE:** pregunta que puede cambiar el flujo o el alcance.

No transformar una hipótesis en requisito solo porque aparece repetida en varios documentos. Varias copias de una suposición siguen siendo una suposición.

## Cómo hacer pruebas de flujo

1. Reclutar personas que realicen la tarea o pertenezcan al segmento que la realizará. No presentar a amistades del equipo como evidencia del mercado si no conocen el trabajo.
2. Pedir permiso para tomar notas; usar ejemplos ficticios y notas anónimas cuando los datos del negocio o sus compradores sean sensibles.
3. Explicar que se prueba el diseño, no a la persona.
4. Dar una tarea y pedir que piense en voz alta; no mostrar primero la solución ni explicar dónde hacer clic.
5. Registrar dónde duda, qué interpreta, qué intenta y si llega al resultado.
6. Al terminar, preguntar qué haría en su proceso real y qué parte no corresponde a cómo trabaja.
7. Ordenar hallazgos por impacto: bloqueo de tarea, riesgo de error/dinero/datos, confusión y mejora menor.
8. Cambiar el prototipo y repetir con otra ronda cuando un hallazgo afecte el flujo principal.

Una ronda cualitativa pequeña sirve para encontrar problemas de comprensión; no estima demanda, tamaño de mercado ni disposición a pagar.

## Límite entre diseño e implementación

No elegir arquitectura ni construir pantallas productivas hasta que el equipo entienda el flujo principal, las excepciones de mayor impacto y qué información debe conservarse. Se puede programar un prototipo desechable para probar una interacción, pero no se trata como código listo para producción.

## Referencias internacionales consultadas

Consultadas el 25 de septiembre de 2026:

- Design Council, [The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/): marco de cuatro fases —Discover, Define, Develop, Deliver— con exploración del problema y de la solución.
- GOV.UK Service Manual, [Learning about users and their needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs): aprender cómo las personas realizan hoy una tarea e investigar durante las fases del servicio.
- GOV.UK Service Manual, [Creating an experience map](https://www.gov.uk/service-manual/user-research/creating-an-experience-map/): consolidar etapas, actividades, fricciones e interdependencias a partir de investigación.
- GOV.UK Service Manual, [Making prototypes](https://www.gov.uk/service-manual/design/making-prototypes): prototipar y probar opciones antes de comprometerse a construir.
- Shopify Help Center, [Understanding your order statuses](https://help.shopify.com/en/manual/fulfillment/managing-orders/order-status): distingue estado de orden, pago, cumplimiento y devolución.
- Odoo, [Sales quotations](https://www.odoo.com/documentation/18.0/applications/sales/sales/sales_quotations.html): documenta cotización aceptada que se convierte en pedido y continúa a entrega/facturación/pago.

Estas fuentes muestran marcos y decisiones de productos concretos. No validan por sí mismas el comportamiento de comercios bolivianos ni la oportunidad comercial de BYTE-CX.
