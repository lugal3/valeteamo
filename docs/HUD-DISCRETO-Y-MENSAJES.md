# HUD discreto y mensajes sin solapamiento

10 de noviembre de 2026. Rama `codex/hud-mensajes-discretos`, sobre `314891e` (animaciones V2). Sin merge, push ni despliegue.

## Resultado

Objetivos, avisos temporales, notificaciones del teléfono y alertas de peligro antes utilizaban coordenadas absolutas independientes. El aviso de Luis podía tapar el texto de un emote; la cuenta atrás también se dibujaba sobre la pantalla del teléfono. Ahora comparten una zona con distribución vertical y un único canal de evento visible.

- **Prioridad:** peligro → notificación nueva → aviso temporal. Durante el peligro, la instrucción urgente ocupa también el lugar del objetivo normal. El objetivo se retira si una zona lateral estrecha necesita ese espacio para el aviso.
- **Menos presencia:** texto de objetivo/aviso de 11 px (10,5 px en horizontal de poca altura), peligro de 12 px, fondos ajustados al texto, bordes finos y sombras reducidas. Título y etiqueta de interacción más discretos. No se reducen los blancos táctiles de los controles; la notificación es un botón real con 44 px de altura.
- **Teléfono:** un solo aviso de Luis, sin el toast duplicado. El banner se muestra cinco segundos de lectura activa; después permanece el punto de mensaje pendiente. El tiempo no se consume durante menús o pausas. Abrir un mensaje conserva el flujo de lectura/respuesta existente.
- **Peligro con teléfono abierto:** la alerta se coloca en el espacio lateral, fuera de la carcasa, al abrirlo; la colocación no espera al siguiente fotograma del juego. Los avisos normales y el objetivo se retiran mientras se usa el teléfono.
- **Hotbar y pantallas pequeñas:** la zona de mensajes calcula el espacio disponible según el anclaje, tamaño y desplazamientos reales del dock, respetando las áreas seguras. La brújula se retira si el dock ocupa su espacio o si se abre el teléfono. El botón de activar sonido pasa a la cabecera con nombre accesible.
- **Mensajes antiguos:** se conserva el aviso temporal más reciente, sin reiniciar su duración por repeticiones idénticas. Un aviso bloqueado durante más de ocho segundos de juego se descarta para que no reaparezca fuera de contexto. Pausa, escenas, ajustes y edición de HUD ocultan la zona de mensajes.

`src/lab/hud-messages.js` coordina presentación y tiempo de lectura usando el bucle existente. Recalcula posiciones al cambiar la ventana, el dock o el estado del teléfono; no añade temporizadores ni mide estilos completos en cada fotograma. `PhoneUI` conserva su manejo de mensajes sin leer, aplicaciones, equipamiento y configuración del dock.

Fuentes de producto modificadas únicamente en `src/lab/house.js`, `house.css`, `phone-ui.js` y el nuevo `hud-messages.js`. No se modifica `lab.css` (compartido con el prólogo), ningún archivo 2D, la historia, los guardados, sus claves ni el comportamiento/tiempos del perseguidor. La rama mantiene las animaciones y el audio locales previos.

## Verificación

- `npm test`: incluye `tests/hud-messages.cjs`, con prioridad exclusiva, pausa del tiempo de lectura, retirada del banner, notificación de una sesión nueva, descarte de feedback antiguo y distribución con los cuatro anclajes, dos tamaños y desplazamientos extremos del dock.
- `npm run build`: TypeScript y Vite. Permanece el aviso existente de tamaño del bundle Phaser.
- `node tests/house-hud-browser.cjs`: 27 comprobaciones en 1280×720, 844×390 y 568×320; exploración, aviso de Luis simultáneo a un emote, cuatro anclajes, llegada, cuenta atrás y peligro con teléfono abierto. Comprueba rectángulos visibles, tamaño del texto, límites de pantalla, prioridad, pausa y WebGL/JavaScript. Usa viewport móvil real en el documento de ensayo y comprueba también `visibility`.
- `HOUSE_QA_DIR=docs/capturas/hud-discreto/compilado node tests/house-production-browser.cjs`: humo del sitio compilado local, edición de hotbar, teléfono, agacharse, emote, pausa/reinicio/salida y ausencia de hooks DEV.

Capturas y resultados en `docs/capturas/hud-discreto/antes/` y `despues/`. La comparación reproduce solapamientos en 16 de los 27 casos anteriores; los 27 casos nuevos pasan. Se versiona una selección de capturas representativas y los dos informes completos. Para repetir la evidencia anterior sin sobrescribir fuentes, ejecutar el mismo ensayo con `HOUSE_HUD_OBSERVE=1` y `HOUSE_HUD_BASELINE=314891e`: los tres módulos históricos se sirven desde Git en memoria. Ese modo registra los fallos anteriores deliberadamente y no es una prueba de aceptación.

Las pruebas de móvil usan Chromium táctil emulado y GPU por software; no certifican rendimiento ni compatibilidad en un teléfono físico. Los controles conservan su tamaño y la hotbar mantiene las preferencias ya guardadas.
