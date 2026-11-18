# VALETEAMO

El proyecto reúne la historia de cumpleaños, la aventura clásica y el rescate de Louis en una sola aplicación web. Esta guía es el punto de entrada para entender el juego, ubicar su código y saber dónde hacer un cambio. Las reglas del repositorio están en [AGENTS.md](AGENTS.md). Los informes y notas anteriores se pueden consultar en el [índice de documentación](docs/INDICE-INFORMES.md).

## Arrancar y elegir una experiencia

```sh
npm ci
npm run dev
```

Abre la dirección que muestre Vite. Desde la portada, después de pulsar **PLAY**:

| Entrada | Qué abre | Código principal |
| --- | --- | --- |
| **Abrir mi regalo** o **Continuar la historia** | Historia de cumpleaños con recuerdos, preguntas, tres desafíos isométricos y una carta | [StoryApp.tsx](src/StoryApp.tsx), [StoryGame.tsx](src/StoryGame.tsx), [iso-game.ts](src/iso-game.ts) |
| **Jugar la aventura clásica** | Juego 2D de seis salas, con combate, tienda y jefe | `ClassicApp` en [main.tsx](src/main.tsx), [game.ts](src/game.ts), [config.ts](src/config.ts), [geometry.ts](src/geometry.ts) |
| **Jugar la demo de rescate 2D → 3D** | Kitty recoge Churu, alimenta a la gata gris, saluda a Luis y Vale y sigue la furgoneta hasta la casa 3D. | [RescueDemo.tsx](src/demo/RescueDemo.tsx) → [house.js](src/lab/house.js) |
| **Pruebas → Casa 3D** | Casa desde la entrada por la ventana | [StoryApp.tsx](src/StoryApp.tsx) → [RescueDemo.tsx](src/demo/RescueDemo.tsx) → [house.js](src/lab/house.js) |

**Pruebas** ofrece el recorrido completo de la casa y accesos directos a la llegada, el dormitorio, la trampilla, las pistas, el espejo, la pila, el tablero eléctrico, el piano y el televisor. Cada prueba rápida abre con su posición, inventario y condiciones preparados. Para repetirla usa **Ajustes → Reiniciar prueba**. El menú también ofrece los accesos a los modos 2D. Para móvil en la misma red, consulta [Probar en iPhone](PROBAR-IPHONE.md).

## Mapa de carpetas

| Ruta | Responsabilidad |
| --- | --- |
| `index.html` → `src/main.tsx` → `src/StoryApp.tsx` | Entrada Vite, montaje de React y navegación entre portada, juegos y pruebas. `main.tsx` también contiene la interfaz de la aventura clásica. |
| `src/` · historia 2D | `story-content.ts` contiene el contenido y el orden de capítulos. `story-progress.ts` gestiona el avance. `StoryGame.tsx`, `iso-game.ts` e `isometric.ts` conectan los desafíos con Phaser. Guía de edición en [HISTORIA.md](HISTORIA.md). |
| `src/` · clásico 2D | `game.ts`, `config.ts` y `geometry.ts` definen el juego de seis salas. `art.ts`, `garden-art.ts`, `characters.ts`, `effects.ts` y `audio.ts` contienen piezas de presentación y juego, algunas reutilizadas por otros modos. [Manual del clásico](README-CLASICO.md). |
| `src/demo/` · portada y prólogo 2D | `Splash.tsx` y su melodía abren la aplicación. `RescueDemo.tsx` monta el prólogo Phaser y carga la casa bajo demanda. `progression.js` gestiona el guardado del rescate y `house-puzzles.js` aporta reglas que usa la casa. |
| `src/lab/` · casa 3D | Motor propio en WebGL 1. `house.js` es el punto de entrada activo. `index.js` corresponde al lanzador histórico del laboratorio. |
| `public/` | Vite sirve estas rutas de forma directa. `sprites/` contiene hojas y plantillas 2D. `demo-assets/` contiene portada, recursos y referencias. `comics/` contiene el cómic final. Conserva los nombres y rutas utilizados por el código. |
| `assets/` | Material fuente, como las ilustraciones de referencia. Su presencia aquí no implica que se cargue en el juego. |
| `docs/`, `docs/capturas/` y `demo-screenshots/` | Documentación, informes y evidencias de versiones. |
| `tests/` y `scripts/` | Pruebas de lógica y navegador, y herramientas de trabajo. `npm run sprites` regenera plantillas y puede sobrescribir dibujos editados. |
| `dist/` y `node_modules/` | Compilación y dependencias generadas. Firebase Hosting publica `dist/`. |

### Dónde trabajar en la casa 3D

| Si quieres cambiar… | Empieza por… |
| --- | --- |
| Habitaciones, muebles, puertas y luces | [house-layout.js](src/lab/house-layout.js), [house-cabinets.js](src/lab/house-cabinets.js), [house-lights.js](src/lab/house-lights.js) |
| Cámara, colisiones, objetos utilizables y escondites | [house.js](src/lab/house.js), [camera-controls.js](src/lab/camera-controls.js), [movement-input.js](src/lab/movement-input.js), [world.js](src/lab/world.js), [navigation.js](src/lab/navigation.js), [interactions.js](src/lab/interactions.js), [hiding.js](src/lab/hiding.js) |
| Entrada por la ventana, avisos, persecución y rescate | [window-intro.js](src/lab/window-intro.js), [story-events.js](src/lab/story-events.js), [pursuer.js](src/lab/pursuer.js), [basement.js](src/lab/basement.js) |
| Render, espejo, texturas, carteles y modelos | [renderer.js](src/lab/renderer.js), [mirror.js](src/lab/mirror.js), [materials.js](src/lab/materials.js), [material-shaders.js](src/lab/material-shaders.js), [artwork.js](src/lab/artwork.js), [animations/](src/lab/animations/) |
| Inventario, teléfono, barra de objetos y acertijo | [house.js](src/lab/house.js), [phone-ui.js](src/lab/phone-ui.js), [hud-layout.js](src/lab/hud-layout.js), [mirror-safe.js](src/lab/mirror-safe.js) |
| Audio, televisión y recursos 3D | [sound.js](src/lab/sound.js), [recorded-audio.js](src/lab/recorded-audio.js), [television.js](src/lab/television.js), [créditos de los recursos](src/lab/media/CREDITS.md) |

### Qué comparte el 2D con el 3D

La separación útil hoy es por responsabilidad. El 3D vive en `src/lab/`, el prólogo vive en `src/demo/` y los otros dos motores 2D viven en la raíz de `src/`. Moverlos físicamente requeriría actualizar rutas de importación, el punto de entrada y las referencias de pruebas. El alcance actual conserva esas rutas y ordena la documentación.

- `RescueDemo.tsx` importa dinámicamente `../lab/house.js` y usa sus callbacks de salida y rescate.
- `house.js` importa las reglas de `../demo/house-puzzles.js`. El prólogo también carga `lab.css`. Trata esos archivos y la orquestación React como código compartido.
- La galería del teléfono usa imágenes de `public/sprites/`. Los assets importados desde `src/lab/` se empaquetan con Vite.
- Mantén el 2D protegido según AGENTS. Para cambios en archivos compartidos, revisa primero su impacto y solicita la autorización indicada allí.

## Recorrido y guardado

La linterna brilla en el cajón del descansillo de la planta alta. La llave con lazo se recoge del cajón del estudio y abre el dormitorio. La nota del pasillo y el acertijo del espejo y la caja fuerte son pistas opcionales. Tras la primera ronda el perseguidor se acuesta. Un aviso indica cuándo salir del armario, y el mensaje al dejar el dormitorio inicia la segunda persecución. La llave roja de la barra abre la trampilla bajo el tapete de la cocina. El autito y su tablet están en el túnel hacia Louis.

Usa **E** o **Usar** para entrar y salir de un escondite. Para meterte bajo la cama o la escalera, agáchate primero con **C** o **Agachar**. Al recargar, puedes salir del escondite guardado con los mismos controles. El perseguidor patrulla con descansos y vuelve a la planta alta cuando Kitty lo despista. Los cortes breves dejan luces de emergencia en la escalera. Una vez cerrada la trampa, la gata gris espera a Kitty y Louis junto a la salida.

En PC, arrastra para mirar o pulsa **R** para capturar el ratón. Pulsa **E** o haz clic para interactuar. Leer una nota, abrir el piano o levantar la tablet libera el cursor. Con la tablet, maneja con **WASD**, activa el señuelo con **Q**, cierra la escotilla con **T** cuando se habilite y guarda la tablet con **Esc**. En móvil, usa el joystick izquierdo y arrastra a la derecha para mirar. En el engranaje puedes ajustar sensibilidad, reducir movimiento, cambiar el volumen por canal y activar los subtítulos de sonidos.

La partitura de dos hojas está en el cajón de la sala de lectura. Kitty la coloca al acercarse al piano del descansillo. Toca las catorce notas destacadas con las teclas en pantalla o sus atajos. Kitty continúa la interpretación y el compartimento suelta la llave maestra al terminar. Guárdala para abrir la puerta principal tras atrapar al perseguidor. Después puedes volver a sentarte para practicar la pieza completa. En el baño, **9** o el selector de emotes activa **What Is Love?**, con diez segundos de audio y coreografía del video de referencia. Consulta las [anotaciones de diseño](docs/INDICE-INFORMES.md#anotaciones-de-diseño) para ver el flujo por actos y las ideas para ambientar los rincones.

El plano cambia al segundo 0:24 del audio del tutorial aportado y se acerca al compartimento al 1:03. La práctica ofrece la voz principal del tutorial reducida a un teclado cromático de una octava. La llave se recoge una sola vez.

| Datos | Clave o ámbito |
| --- | --- |
| Historia de cumpleaños | `valeteamo-story-v1`, avance, respuestas y preferencias en el navegador |
| Rescate | `valeteamo-story-acts-1-2-v1` guarda el prólogo y `valeteamo-rescue-v2` guarda la entrada 3D, los checkpoints de la casa y el final. Los accesos de Pruebas usan sus propios estados. |
| Ajustes de la casa | Cámara y barra de objetos comparten `valeteamo-house-camera-v4`, con lectura de ajustes anteriores. El sonido usa `valeteamo-lab-sound-v1`. |
| Objetos y puzles de la casa | Las llaves, notas, linterna, caja fuerte, trampilla y avance RC se guardan por hitos. Los interruptores y los movimientos en curso pertenecen a la sesión. |

**Continuar el rescate** retoma el último hito desde un lugar seguro. **Reiniciar casa**, en sus ajustes, borra los hitos del interior. **Volver a jugar**, en el final, reinicia todo el rescate.

Las fotos, preguntas y carta de la historia son ejemplos editables. Consulta [HISTORIA.md](HISTORIA.md) para personalizarlas y revisar la privacidad. Los guardados locales dependen del navegador y del origen, por lo que localhost y Firebase tienen datos separados.

## Verificar y publicar

El recorrido de revisión, las pruebas de entrega y el material pendiente están en [Entrega del rescate](docs/ENTREGA-RESCATE.md).

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

`npm run test:browser` prueba la historia 2D. Para la casa se ejecutan los scripts según el cambio. Usa `node tests/house-furniture-browser.cjs` para muebles, `node tests/house-threat-browser.cjs` para escondites y cortes de luz, `node tests/rc-browser.cjs` para el rescate completo con el autito y `node tests/mirror-safe-browser.cjs` para el espejo y la caja fuerte. Las pruebas de la casa pueden generar evidencias en `docs/capturas/`. Revisa el estado de Git antes de incorporar esas salidas.

El sitio público está en [valefc.web.app](https://valefc.web.app/). [firebase.json](firebase.json) configura Hosting. El [workflow de publicación](.github/workflows/firebase-hosting-live.yml) ejecuta pruebas y compilación antes de desplegar al proyecto `valefc`. Se puede lanzar manualmente desde una rama y también se activa con pushes a `main`. Para saber qué versión sirve el sitio, consulta la ejecución de despliegue correspondiente.
