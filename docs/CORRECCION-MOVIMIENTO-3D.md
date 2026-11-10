# Movimiento que quedaba atascado — casa 3D

10 de noviembre de 2026. Rama `codex/corregir-movimiento-atascado`, sobre `be8ef1a` (perseguidor y grabaciones locales). Sin merge ni despliegue.

## Problema y reparación

El jugador podía seguir caminando en diagonal después de soltar los controles. Abrir un menú lo detenía porque esa acción ya reiniciaba la entrada.

- **Teclado:** se guardaba `KeyboardEvent.key` literalmente. Pulsar A/S con Mayúsculas y soltarlas después de soltar Mayúsculas dejaba `A`/`S` activas cuando llegaban las liberaciones `a`/`s`. Las teclas de movimiento ahora se identifican por su código físico, con respaldo normalizado para teclados sin `code`. La liberación se recibe en la fase de captura; las repeticiones no reactivan una tecla limpiada al pausar o perder el foco.
- **Ratón y táctil:** se dependía de la captura del puntero y de la liberación recibida por cada control. Ahora hay liberación global por `pointerup`/`pointercancel`, respaldo para `mouseup` y `touchend`/`touchcancel`, y detección de ratón/lápiz que se mueve sin botón pulsado. Los botones secundarios no activan el joystick ni el giro. La captura se intenta y libera sin dejar el control activo si el navegador la rechaza.
- **Dos dedos:** joystick y cámara conservan propietarios independientes. El respaldo táctil comprueba los destinos originales de los contactos restantes; soltar el dedo de caminar conserva el de mirar y viceversa. No se aplica un temporizador que interrumpa los gestos largos.
- **Ciclo de página:** perder/recuperar el foco y salir/volver a la página limpia teclas, punteros, ejes y velocidad. Se mantienen las limpiezas existentes de menús, orientación y visibilidad.

Fuentes modificadas únicamente en `src/lab/house.js` y el nuevo `src/lab/movement-input.js`. No se modifican fuentes compartidas, controles 2D, mapas, colisiones, guardados ni claves de localStorage. Se conserva el trabajo local previo de sonido y perseguidor.

## Verificación

- `npm test`: pasa la suite general existente, incluidos navegación, colisiones, cámaras, animaciones, progresión y perseguidor.
- `npm run build`: pasa TypeScript y Vite. Permanece el aviso existente de tamaño del bundle de Phaser.
- `node tests/house-input-browser.cjs`: Chromium con WebGL, escritorio 960×540 y táctil emulado 844×390. Comprueba Mayúsculas/WASD, liberación perdida de ratón, liberación fuera del control, botón secundario, multitáctil con ambas liberaciones parciales, pérdida de evento táctil, cancelación global, foco, regreso a la página, movimiento posterior y reposo sin entradas. Sin errores JavaScript ni WebGL.
- `HOUSE_QA_DIR=docs/capturas/movimiento/compilado node tests/house-production-browser.cjs`: prueba local del sitio compilado; HUD, teléfono, agacharse, emote, pausa, reinicio, salida y ausencia de herramientas DEV.

Los resultados están en `docs/capturas/movimiento/despues.json` y `docs/capturas/movimiento/compilado/`. La evidencia previa `antes.json` se obtiene con el mismo ensayo y el módulo histórico servido en memoria, sin sobrescribir las fuentes:

```powershell
$env:HOUSE_INPUT_OBSERVE='1'
$env:HOUSE_INPUT_BASELINE='be8ef1a'
node tests/house-input-browser.cjs
```

Ese modo registra fallos deliberadamente y no es una prueba de aceptación. La comparación distingue las regresiones reproducidas de las comprobaciones de multitáctil normal que ya funcionaban. El ensayo táctil utiliza emulación Chromium; no sustituye una comprobación en un teléfono físico.

Para comprobarlo manualmente: caminar en diagonal con el joystick y levantar el dedo manteniendo otro en la cámara; repetir soltando primero la cámara; en PC pulsar Mayúsculas+A+S y soltar Mayúsculas antes de A/S. Al terminar, el personaje debe detenerse sin abrir ningún menú y aceptar una nueva pulsación normalmente.
