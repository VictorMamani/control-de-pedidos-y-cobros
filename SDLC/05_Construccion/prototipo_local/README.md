# Prototipo local | Registro de pedidos

- **Versión:** 0.1
- **Tipo:** experimento de interfaz con persistencia local ficticia.
- **No es:** autenticación real, backend, aislamiento seguro de comercios ni una versión comercial.

## Ejecutarlo

Desde la raíz del repositorio:

```bash
python3 -m http.server 4174 --directory SDLC/05_Construccion/prototipo_local
```

Abre `http://localhost:4174`. Para detener el servidor usa `Ctrl+C` en la terminal.

No hay instalación de paquetes ni configuración de claves. La demo está hecha con HTML, CSS y JavaScript del navegador.

## Qué se puede probar

1. Entrar como uno de dos perfiles ficticios.
2. Consultar el listado sintético de ese comercio.
3. Crear un pedido con producto, variante, cantidad, precio y estado de preparación.
4. Buscar, filtrar y cambiar el estado de preparación.
5. Cambiar de comercio y comprobar que el prototipo mantiene registros separados en el navegador.
6. Reiniciar solo los datos demo del comercio seleccionado.

Esta demo anterior no registra cobros. El flujo de anotación manual ahora está planteado en la [aplicación web](../aplicacion/README.md), pendiente de conectar un proyecto Supabase.

## Cómo se guardan los datos

El prototipo usa `localStorage` con una clave separada por identificador ficticio de comercio. La sesión se pierde al recargar, pero los cambios de pedidos permanecen en ese navegador hasta reiniciar los datos del comercio o borrar el almacenamiento del sitio.

Esto sirve para explorar el flujo y su presentación. No es seguridad multi-tenant: quien usa el navegador puede leer o cambiar ese almacenamiento. El control real requerirá una cuenta autenticada, autorización del lado servidor, políticas RLS y pruebas entre dos tenants antes de guardar datos reales.

## Archivos

- `index.html`: estructura de las vistas, formulario y mensajes.
- `styles.css`: estilos responsive del prototipo.
- `app.js`: cuentas sintéticas, almacenamiento local y comportamiento interactivo.

## Límites

- No usar nombres, contactos, montos o productos de clientes reales.
- No almacena cobros, pagos, credenciales, comprobantes ni información bancaria.
- Los importes y productos de ejemplo son inventados y no describen precios de mercado.
- La elección de un perfil no valida permisos ni una relación real con una empresa.
