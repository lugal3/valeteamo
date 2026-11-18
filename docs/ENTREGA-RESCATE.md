# Entrega del rescate de ValeTeAmo

Las fases 01 a 07 se revisan juntas en el [PR #32](https://github.com/lugal3/valeteamo/pull/32). La revisión visual del creador y la autorización de publicación siguen pendientes.

## Recorrido para revisar

Desde «Feliz cumpleaños Vale», abre el rescate y sigue el prólogo de Kitty. Ofrécele el Churu a la gata gris y avanza hasta el encuentro de Luis y Vale. Después de proteger a Louis, fíjate en la media luna y la placa **LUNA-07**. Sigue las pistas de la furgoneta por la villa y entra en la casa por la ventana.

Recoge la llave del cajón del estudio y la linterna del descansillo. Lleva la partitura de la sala de lectura al piano junto a la escalera. Toca las dos hojas y recoge del compartimento la llave maestra. La llave roja de la barra abre la trampilla de la cocina. Libera a Louis, usa el autito como señuelo y cierra la escotilla cuando el perseguidor entra al túnel. Usa la llave maestra en la puerta principal y sigue a la gata al jardín.

En escritorio, **E** interactúa, **R** alterna la captura del ratón y **Esc** libera el cursor o guarda la tablet. En móvil, combina el joystick izquierdo con el arrastre derecho. El engranaje reúne sensibilidad, reducción de movimiento, subtítulos y mezcla de audio.

Los efectos añadidos y sus fuentes están en [Prueba de audio](AUDIO-PRUEBA-RESCATE.md). Las búsquedas para reemplazos y nuevas grabaciones están en el [catálogo de audio](CATALOGO-AUDIO.md).

## Verificación

| Área | Prueba reproducible |
| --- | --- |
| Prólogo y entrada real por la ventana | `node tests/prologue-browser.cjs` |
| Guardados, puzles, recargas y final | `node tests/house-checkpoint-browser.cjs` |
| Rescate desde el sótano, señuelo y salida | `node tests/rc-browser.cjs` |
| Patrulla, apagones y escondites | `node tests/house-threat-browser.cjs` y `npm test` |
| Ratón, teclado, multitáctil y orientación | `node tests/house-input-browser.cjs` |
| Canvas, pérdida de WebGL y reentrada de la compilación | `node tests/house-css-production-browser.cjs` tras compilar |
| Todas las tarjetas directas de la casa | La prueba de compilación con `HOUSE_PRODUCTION_SCENE_MATRIX=1` |
| Rutas y rendimiento de los eventos | `npm run test:perf` y `node tests/house-event-perf.cjs` |

Las pruebas de navegador combinan recorridos y puntos de guardado. La emulación de WebKit verifica la compilación y la recuperación de partidas. La validación de audio y multitáctil en un iPhone físico sigue pendiente.

## Material y decisiones pendientes

- El final del rescate usa un texto provisional de aventura. Falta confirmar el texto personal, la eventual carta y su firma.
- El prólogo usa ilustraciones provisionales para Luis y Vale y diálogos narrativos breves. Quedan por aprobar sus referencias y las líneas personales.
- La historia de cumpleaños tiene espacios editables para fotos y recuerdos. El contenido de muestra está en [`src/story-content.ts`](../src/story-content.ts). Falta elegir material autorizado y decidir dónde alojarlo.
- Antes de publicar, queda por confirmar la procedencia y los permisos de los audios aportados. La lista de recortes está en [el informe de audio](PERSEGUIDOR-Y-AUDIO-GRABADO.md).
