# Nota reflejada y caja fuerte

10 de noviembre de 2026. Rama `codex/nota-espejo-caja-fuerte`, sobre `c864840`. Contraseña elegida por el propietario: **1505**. Implementación local en la casa 3D; sin merge, push ni despliegue.

## Recorrido

1. Se conservan la nota del pasillo y la llave con lazo del cajón.
2. En el escritorio del estudio hay una segunda nota. Al recogerla, aparece como papel con **los glifos reflejados horizontalmente**, no solo con el orden de las cifras cambiado. Se puede volver a abrir desde la mochila.
3. Después de **más de 60 segundos activos** sin descifrarla, aparece una pista única: «La escritura parece reflejada… quizá el espejo del baño pueda ayudarte». Cuando este es el objetivo actual, la ayuda también queda como objetivo breve. Lectura, pausa, ajustes, teléfono, entrada cinematográfica, escondites en transición y pérdida de foco detienen ese reloj.
4. Con la nota recogida, mirar el espejo real del baño a menos de tres metros revela automáticamente **«En el espejo: 1505 · combinación de la caja fuerte»** arriba, en el canal compacto del HUD. El reflejo tiene que estar realmente dibujado: mirar una pared o en dirección contraria no sirve. La lectura se recuerda en la mochila. Las alertas de peligro conservan mayor prioridad.
5. La caja fuerte está en un rincón del salón, junto al mueble de televisión. Su teclado acepta ratón/táctil y números del teclado, con borrar, limpiar, Enter y Escape. Una combinación incorrecta permite volver a intentarlo; la correcta abre físicamente su puerta, respetando el espacio delante del jugador.
6. El sobre de la caja entrega el símbolo del corazón. Con ese símbolo y la llave se abre el dormitorio y continúa el evento del teléfono/perseguidor. El cuadro del salón ahora orienta hacia la caja, sin entregar automáticamente su contenido.

El código correcto también funciona si el jugador ya lo conoce; no se obliga a visitar el espejo para aceptar una combinación válida. La caja se recompensa una sola vez. Los checkpoints avanzados `lock` y `rescue` conservan las pistas previas resueltas para seguir funcionando como accesos de prueba. Reiniciar la casa reinicia el puzle; reintentar al perseguidor conserva las pistas obtenidas en esa sesión.

## Alcance técnico

`src/lab/mirror-safe.js` contiene únicamente el estado de sesión y el umbral de ayuda. La presentación utiliza `house.js`, el HUD existente y estilos exclusivos en `house.css`. El espejo se comprueba a partir de `renderer.mirrorDrawn` después de renderizar, con límite de distancia y controles activos. No añade otro render de espejo, solicitudes de red ni temporizadores independientes.

La caja se construye con materiales y piezas geométricas existentes en `house-layout.js`; su puerta, bisagra, teclado y tirador comparten la transformación dinámica. `world.js` conserva la colisión de la hoja de la caja al rotarla e `interactions.js` evita que la propia hoja oculte su punto de interacción. La caja no se abre por proximidad. Se reutilizan los sonidos existentes.

No se modifican fuentes 2D, orquestación compartida, `src/demo/house-puzzles.js`, CSS compartido, assets públicos ni claves de localStorage. La segunda pista se entrega mediante la API ya existente de los puzles, desde la casa 3D. Se actualizan los ensayos de navegador de recorrido para resolver la nueva caja antes del dormitorio.

## Verificación

- `npm test`: suite completa, nueva prueba `tests/mirror-safe.cjs` y auditoría espacial con la nota/caja incluidas. Comprueba el umbral real de 60 segundos, congelación en pausa, ayuda única, reflejo antes/después de recoger, teclado incorrecto/correcto/bloqueado, recompensa única, checkpoints, colisión giratoria y prioridad del HUD.
- `npm run build`: TypeScript/Vite. Permanece el aviso existente de tamaño del bundle Phaser.
- `node tests/mirror-safe-browser.cjs`: escritorio 960×540 y móvil emulado 568×320; nota reflejada y recuperable, pausa del reloj, pista, orientación/visibilidad del espejo, revelación, teclado físico y táctil, errores/reintento, apertura, mochila y continuación al dormitorio. La nota incluye su botón de volver dentro de la pantalla pequeña. **Solo el escenario de prueba acelera 120 veces el reloj del puzle**, mediante un envoltorio del método; la lógica de producción conserva el minuto real y su prueba unitaria exacta.
- `node tests/pursuer-browser.cjs`: recorrido normal con la nueva caja, aviso del teléfono, captura, reintento, escondite, despistar al perseguidor y avance hasta Louis; audio y WebGL sin errores.
- `HOUSE_QA_DIR=docs/capturas/nota-espejo/compilado node tests/house-production-browser.cjs`: sitio compilado local y controles existentes, sin hooks DEV.

Evidencias en `docs/capturas/nota-espejo/`, incluidos capturas de los dos tamaños, estado espacial y resultados de la regresión del perseguidor. Las pruebas utilizan Chromium/GPU por software y táctil emulado; no certifican FPS ni una prueba física de Safari/iPhone.
