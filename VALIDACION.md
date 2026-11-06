# Validación de la entrega

Fecha: 6 de noviembre de 2026.

## Comprobaciones pasadas
- `npm install`: 23 paquetes instalados; auditoría de instalación sin vulnerabilidades notificadas.
- `npm run build`: TypeScript estricto y Vite correctos. Phaser produce un bundle de aproximadamente 1,73 MB (419 KB gzip); Vite informa advertencia de tamaño, no error.
- `npm test`: prueba de integración lógica con renderizador simulado. Verifica exactamente seis salas, ruta lineal y enlaces recíprocos; bloqueo de puertas y llave del tesoro; recompensa única; economía de ambas ofertas; pila, bomba sin daño propio, Brimstone, cabeza y manto; dos dedos independientes, soltar/cancelar y pausa; ataques del jefe; escotilla y final; muerte y reinicio completo.
- Navegador real integrado en Windows: bienvenida, carga del canvas Phaser, HUD, botones de bomba y activo, pausa y continuar. Se comprobó que continuar conservaba cuatro bombas tras gastar una; no reinició la escena.
- Compilación servida mediante `npm run preview`, sin errores ni advertencias de consola en las comprobaciones realizadas.
- Viewports 852×393 y 393×852: encuadre horizontal y aviso de giro vertical, con pausa al girar.

## Límites de las pruebas
- No se probó Safari en iPhone físico, ni el audio en sus altavoces ni dos dedos reales en pantalla capacitiva. El multitouch se comprobó en el sistema de entradas con eventos simulados; esto no sustituye la prueba física.
- El recorrido completo se validó mediante la prueba de integración con render simulado; la inspección del navegador fue de inicio/interfaz/pausa y tamaños, no una partida completa controlada manualmente.
- Una recarga de la página o la recarga automática de Vite durante cambios de fuentes reinicia la partida. Cambiar de app, pausar o girar solo pausa y limpia entradas; no hay guardado persistente solicitado.
- Para probar una versión estable mientras editas, ejecuta `npm run build` y `npm run preview` en lugar del servidor de desarrollo.

## GitHub

Repositorio público de código: https://github.com/lugal3/valeteamo

El usuario creó el repositorio y autorizó subir el prototipo. Solo se incluyen fuentes, documentación, pruebas y lockfile. `node_modules`, `dist`, temporales y credenciales están excluidos. El repositorio guarda el código; no se activó GitHub Pages ni se publicó el juego como sitio web.
