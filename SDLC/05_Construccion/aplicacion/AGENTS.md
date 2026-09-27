<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Criterios visuales para Control de pedidos y cobros

- Para pantallas de operación, usa Impeccable en modo **Operate**: prioriza lectura rápida, jerarquía por tarea, consistencia, estados completos, accesibilidad y comportamiento responsive. Conserva el sistema visual existente salvo que el usuario pida un rediseño.
- Aplica Emil Kowalski (`emil-design-eng`, `animate`, `find-animation-opportunities`, `review-animations`) con moderación: cada movimiento debe comunicar feedback, estado o continuidad espacial. Las acciones frecuentes deben responder al instante o con una transición casi imperceptible; respeta `prefers-reduced-motion`.
- Usa `design-taste-frontend` para revisar el brief y detectar patrones genéricos. Su upstream excluye explícitamente dashboards, tablas y flujos de producto; no traslades automáticamente a esta app sus recetas de landing, hero, densidad o motion.
- La jerarquía visual debe servir al seguimiento cotidiano de pedidos, preparación, entregas y cobros anotados. Distingue claramente los datos ficticios de los datos persistidos y no presentes los cobros como pagos verificados.
- Evita degradados decorativos, grupos repetidos de cards o mosaicos de iconos, titulares sobredimensionados y animación ornamental. Usa color y densidad cuando ayuden a reconocer prioridades y estados.
- Antes de cambiar UI, consulta el `product_brief.md`, inspecciona la implementación vigente y lee el `SKILL.md` y el playbook pertinente. Para cambios de interfaz, sigue los pasos de preparación y revisión acotada de Impeccable; no modifiques componentes solo por sugerencia de una skill.
