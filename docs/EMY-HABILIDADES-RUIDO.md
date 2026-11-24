# Emy: escaneo, distracción y objetos ruidosos

> Implementación experimental en la rama `feature/emy-scan-distraccion-objetos`. Está aislada de `main` y no está desplegada automáticamente.

## Arquitectura inspeccionada

El juego 3D **no usa react-three-fiber**: el renderizador de `src/lab/renderer.js` es WebGL1 propio. No integrar shaders para Three.js. La planta real la define `src/lab/house-layout.js` con dos alturas y los límites de `ROOMS`; `roomAt` agrega pasillos. La gatita usa `src/lab/emy-companion.js` y `src/lab/emy-cat.js`; el secuestrador está en `src/lab/pursuer.js`. El controlador central de botones, sonido, render y checkpoints es `src/lab/house.js`.

## Jugabilidad añadida

1. Acercarse a Emy y pulsar **E/Usar** muestra un panel con **Acariciar**, **Escaneo** y **Distracción**. El botón de acariciar conserva su animación original.
2. **Escaneo**: sonido de maullido, onda expansiva superficial alrededor de Emy y contorno verde translúcido en el modelo 3D **real** del secuestrador visible incluso cuando hay paredes delante, durante 6 s. Enfriamiento 28 s. Los enemigos inactivos no se dibujan como amenazas.
3. **Distracción**: mapa consultable de **planta baja y planta alta a la vez**, con botones en las posiciones relativas de los recintos. Las etiquetas provienen de `world.rooms`; los pasillos son áreas complementarias. Emy usa rutas navegables existentes entre plantas; cuando llega al destino, maúlla aproximadamente cada 1,5 s durante 25 s. Los eventos renuevan la investigación de ruido por el secuestrador. Enfriamiento 55 s desde la orden. Volverá a seguir a Kitty al terminar.
4. **Objetos ruidosos**: seis elementos ligeros iniciales de vasos, platos y tazas alrededor de la casa. Seleccionarlos con **E** para llevarlos en la mano; **G** lanza y **V** deja caer; hay botones táctiles para ambas acciones. Simulación ligera de gravedad, comprobación de obstáculos y choque, efecto percutivo de cristal/cerámica, y alerta que hace investigar la ubicación de impacto al secuestrador. Golpearlo con un proyectil lo aturde hasta 2 s. Al pasar uno cerca de Emy, ella se desplaza lateralmente si encuentra un lugar libre y adopta animación evasiva.

## Respeto a la historia

- Los poderes solo se muestran mientras Emy está disponible para interacción. No alterar introducción por ventana, recuperación de llave del conducto, escondites, escape con Louis ni secuencia del auto RC y la escotilla.
- La distracción no sustituye la detección visual de Kitty: perseguir a Kitty y perseguir el RC tienen prioridad sobre las investigaciones ruidosas.
- Los cambios son propios de la casa 3D. El 2D original y los assets existentes quedan intactos.
- El mapa dibujado por el usuario sirve como idea visual; las coordenadas y habitaciones jugables salen del mapa real, no de la foto.

## Archivos principales

- `src/lab/emy-abilities.js`: temporizadores, puntos de destino, mapa visual.
- `src/lab/emy-companion.js`: nuevo estado `distract`, navegación y esquiva.
- `src/lab/pursuer.js`: `hearNoise` y `stun`, con replanteamiento de ruta al cambiar el objetivo.
- `src/lab/noise-props.js`: geometría, interacción y físicas ligeras.
- `src/lab/house.js`: interfaz, entradas PC/táctiles, actualizaciones, integración.
- `src/lab/renderer.js` + `src/lab/material-shaders.js`: contorno mediante un pase de stencil por detrás de la profundidad.
- `src/lab/emy-skills.css`: panel, mapa a dos columnas, onda y botones.
- `src/lab/sound.js`: choque cerámico con WebAudio.
- `tests/emy-abilities-noise.cjs`: pruebas automáticas añadidas a `npm test`.

## Correcciones tras las primeras pruebas

- **WebGL1 / índices de 16 bits:** la malla dinámica existente ya estaba próxima al límite `65535` vértices. Los objetos ruidosos se renderizan en un **VBO/IBO propio**, con una llamada de dibujo compacta y actualización parcial de los objetos que cambian. No se ha reducido la calidad del modelo de Emy ni de Louis.
- **Colisiones:** los proyectiles usan una comprobación de segmento contra los muebles y muros sólidos antes de declarar el impacto. El sonido WebAudio nace en las coordenadas de colisión.
- **Esquiva animada:** la ruta lateral de Emy se muestrea para descartar paredes, luego se interpola y se representa con el rig existente; en movimiento reducido se suprime el salto vertical.
- **Secuestrador:** los ruidos no interrumpen su llegada, sueño, persecución directa de Kitty o RC. El impacto activa un estado de aturdimiento temporal y un retroceso del rig.
- **Interfaz:** los botones de lanzar y soltar están centrados en horizontal para no tapar el botón contextual del teléfono; el objeto sostenido tiene iluminación independiente.
- **Panel LP:** la prueba antigua se actualizó a los 19 accesos principales actuales, sin quitar accesos nuevos.
- **Pruebas de navegador:** `tests/emy-abilities-browser.cjs` revisa los tres botones de Emy, la onda, el contorno 3D ante una pared, ambos mapas simultáneos, orden a una habitación, recogida, lanzamiento y limpieza al salir. Genera capturas en `artifacts/emy-abilities/`.

## Evidencias ejecutadas

- Ejecución verificada: [GitHub Actions #45312882623](https://github.com/lugal3/valeteamo/actions/runs/45312882623). **Aprobados** `npm ci`, `npm test`, `npm run test:perf`, `npm run build`, panel LP, prueba Emy Chromium móvil y regresión de secuestrador/escondites. Evidencias: [capturas del navegador](https://github.com/lugal3/valeteamo/actions/runs/45312882623/artifacts/14884091434).
- Ejecución de screenshots de contorno: [GitHub Actions #45313372444](https://github.com/lugal3/valeteamo/actions/runs/45313372444). Chromium móvil y escritorio **aprobaron** la prueba de Emy con una captura que incluye el modelo real visible a través de la pared. En esa ejecución, la larga regresión de escondites se atascó a ~1 FPS bajo SwiftShader y no llegó a WebKit.
- **[Última ejecución completa #45314364332 — SUCCESS](https://github.com/lugal3/valeteamo/actions/runs/45314364332)** en el commit `bbe5904`: aprobaron `npm ci`, `npm test`, `npm run test:perf`, `npm run build`, panel LP, **Chromium móvil**, **Chromium escritorio**, **WebKit móvil** y regresión de perseguidor/escondites en modo fluido. Capturas reales de los tres motores: [artifact #14885287106](https://github.com/lugal3/valeteamo/actions/runs/45314364332/artifacts/14885287106). El contorno del modelo del secuestrador a través de la pared fue comprobado visualmente en capturas de Chromium y WebKit.
- No se ha ejecutado una prueba manual en **iPhone físico**. WebKit en Linux es una aproximación a Safari, no una certificación de hardware iOS.

## Validaciones antes de mezclar a main

Ejecutar `npm ci && npm run build && npm test && npm run test:perf`; registrar resultados. Hacer inspección visual con la casa en modo nocturno y verificar el contorno del secuestrador **detrás de paredes y al cambiar de piso**; comprobar que desaparece al agotarse el escaneo y no interfiere con el espejo ni capturas. Enviar a Emy a habitaciones de ambos pisos, comprobar puertas, escaleras, regreso, cancelación por progreso de la historia y latencia al recalcular rutas. Comprobar todas las piezas, caída con ruido, aturdimiento, evasión de Emy y acciones táctiles en iPhone real (horizontal), también con calidad reducida y cambios de pestaña. Revisar fugas de buffers / audio, sombras y FPS de WebGL1.

**No afirmar que un test pasó hasta haberlo ejecutado realmente.** Este cambio está propuesto en una rama; un PR puede revisarse sin publicarlo aún en Firebase.
