# ValeTeAmo · Renovación integral del rescate 2D en 3 fases

**Protocolo del usuario:** comenzar la fase 1 ahora; al terminar cada fase se comunica estado y se **espera un solo punto `.`** antes de implementar la siguiente. Las fases 1–2 permanecen en una rama dedicada sin fusionar `main` ni desplegar Firebase. La fase 3 comprende la validación visual integral, mezcla final y publicación **solo si todas las pruebas pasan**.

## Protección de lo existente

- **NO modificar el modo original `2D · Corazones`**: cámara, controles, progresión, disparos y economía/combate.
- No eliminar ni reescribir las escenas 3D, animación de ventana, modelo Kitty/Luis/Louis, secuestro con furgoneta LUNA-07, las 4 escenas de rescate o sus puzzles.
- Modificar `IsoAdventure` *solo dentro de `this.story`*, con utilidades testeables puras. Respetar teclado, joystick móvil, mouse, pausa, `prefers-reduced-motion`, y limitación de partículas/sonido.
- Sin descargas externas de assets ni música protegida. Pixel art y audio originales.
- No aumentar cantidad de diálogos: la redacción la agregará el usuario después.

## Fase 1 — Game feel, movimiento y reacciones (COMPLETADA Y VALIDADA)

- Movimiento de Kitty con aceleración y frenado graduados, velocidad máxima estable en FPS variables, joystick de baja intensidad preciso y respuesta inmediata al dar vuelta. **La guía A* a puerta, ventana y furgoneta se mantiene funcional.**
- Animaciones de caminar según velocidad, cambio de dirección natural, respiración y parpadeo en idle, ligera inclinación, rebote al detenerse y anticipación leve de cámara. Sin mareos, y se respeta `prefers-reduced-motion`.
- Pisadas discretas adaptadas al suelo (hierba, madera, tierra, piedra, asfalto); huellas/pequeño polvo de vida breve, límites estrictos y sin afectar el arcade clásico.
- Interacciones contextuales con orientación del personaje hacia el objeto y gesto corto de examinar/tocar, señales suaves de confirmación, botón suficientemente grande para tocarlo en iPhone.
- Seguidor Louis natural y estable: no hace moonwalk constantemente cuando Kitty se detiene, guarda separación, acelera suavemente y usa poses correctas.
- Tests: lógica pura a 30/60 FPS, cámara limitada, colisiones, guía manual, comportamiento de seguidor, idle y accesibilidad; regresión móvil/PC/3D en CI. **No iniciar fase 2 sin `.`.**

### Cambios concretos realizados

- `src/demo/rescue-game-feel.ts` implementa aceleración y deceleración suaves con fórmula independiente de FPS y velocidad máxima heredada de **2,1 unidades ISO/s**, joystick analógico sensible a la intensidad, respuesta rápida al cambio de dirección y mirada de cámara limitada a **22 px horizontal / 11 px vertical** con recenter veloz al soltar.
- `src/iso-game.ts`: separación estricta entre `if(this.story)` (rescate cinético) y el `else` (modo Corazones clásico sin cambios en su control/combate). Kitty conserva sprites originales y añade respiración, parpadeo, balanceo mínimo según velocidad y gesto breve al examinar. Llega a los objetivos de la guía A* sin teletransportes; WASD/joystick cancelan la guía en cualquier momento.
- Pasos originales suaves por **césped, tierra, madera del puente, piedra y asfalto**; huellas casi imperceptibles de vida breve, máximo **12** partículas. Sonido y gestos se reducen automáticamente al activar `prefers-reduced-motion`.
- **Louis** sigue a Kitty con una distancia natural, velocidad acotada, poses de caminar solo cuando se desplaza, parpadeo/idle y memoria de la última dirección al detenerse. Kitty gira hacia la pista antes de tocarla y da una confirmación visual/sonora.
- `src/demo/garden-prologue.css` mejora el botón táctil contextual con blanco de toque de al menos 46–48 px, retroalimentación activa y foco accesible.
- `tests/rescue-game-feel.cjs` valida 30/60/120 FPS, controles, frenado, idle/parpadeo, superficies, cámara, acompañante y separación del arcade.
- `tests/rescue-feel-browser.cjs` valida movimientos reales en ventana de **1280×720** y paisaje de **844×390**: teclado, parada, cámara, pisadas, joystick suave/fuerte y animaciones. El flujo completo existente de los cuatro escenarios y del 3D también pasó.

**Gate de fase 1: aprobado.** El usuario envió `.` y se implementó la fase 2. No merge a `main` ni despliegue en Firebase hasta finalizar la fase 3 y aprobar la QA de las tres fases.

## Fase 2 — Mundo vivo (COMPLETADA Y VALIDADA)

- Cuatro biomas diferenciados: ramas/vegetación que se mecen; flores que reaccionan al pasar Kitty; río con reflejos y ondas; mariposas, aves y animales tímidos, hojas y pétalos con sentido del viento.
- Capas de profundidad, iluminación de tarde, niebla y luciérnagas, faroles nocturnos, iluminación suave de casas y ventanas, sonido ambiental localizado que se mezcla sin cortes.
- Eventitos pasivos no repetitivos sin forzar diálogos; determinismo y recuentos máximos por pantalla para móviles.
- Respetar atmósfera: mañana romántica → tarde cálida → crepúsculo misterioso → vecindario inquietante.

### Entrega de fase 2 y control de calidad

- **18 plantas** por mapa, con movimiento de ramas/flores/pasto, variación del viento y respuesta al paso de Kitty; **6–7 animales** visibles según el bioma (mariposas, gorriones, conejos, ardillas, zorros, búhos, polillas, gatos y cuervos). Se asustan y se apartan de manera continua, y regresan suavemente después. Nada de teletransporte ni diálogos.
- Mañana: ondulaciones y reflejos extra en el río; tarde: luz dorada y sombras; bosque: neblina y luciérnagas; noche: brillo variable de ventanas, cortinas que se mecen, faroles y bruma. Microeventos discretos y no repetitivos (pétalos, destellos, ráfagas y ondas), con posiciones deterministas.
- Audio original generado por WebAudio: río, pájaros, viento, insectos y un motor distante, con panoramización estéreo cuando el dispositivo la soporta, `mute` y cadencia baja para evitar fatiga.
- Recursos acotados: solo objetos Phaser Graphics reutilizables, aproximadamente 30 FPS visuales, 18 plantas, 6–7 animales, 25–40 motas existentes, solo los elementos cercanos se redibujan. `prefers-reduced-motion` congela efectos decorativos. Todos los objetos se destruyen al abandonar cada mapa.
- `tests/rescue-ecology.cjs` valida cuatro biomas, semillas, respuesta de vegetación, desplazamiento y vuelta de animales a 30/60/120 FPS, microeventos, límites móviles y reducción de movimiento.
- `tests/prologue-browser.cjs` prueba **los cuatro ecosistemas en el navegador real**, las capturas de cada mapa, el secuestro con furgoneta LUNA-07, las pistas, entrada a ventana y el 3D. `tests/rescue-feel-browser.cjs` valida nuevamente la fase 1 en PC/iPhone; `tests/prologue-desktop.cjs` y `tests/emotes-browser.cjs` validan el resto.
- **CI completamente aprobada (último cambio funcional):** https://github.com/lugal3/valeteamo/actions/runs/43749139228; capturas: https://github.com/lugal3/valeteamo/actions/runs/43749139228/artifacts/14175548066.
- Diseño y QA documentados en `docs/RESCATE-FASE2-MUNDO-VIVO.md`. PR #22 en borrador, sin merge ni publicación.

**Gate:** NO comenzar fase 3 antes del próximo `.` del usuario.

## Fase 3 — Personajes, escenas y cine (PENDIENTE: siguiente punto)

- Gesto y mirada contextual de Kitty, Luis y Louis; NPC que observan objetos/se acercan/se detienen; burbujas simples no bloqueantes en lugar de muchas conversaciones.
- Transiciones suaves, mejores planos, ritmo y coreografía: combate, diálogo, aparición/despedida de Luis, secuestro con van zorro/conejo, investigación de pulsera/pétalos/huellas, hallazgo del vehículo LUNA-07 y ventana a la casa 3D.
- Señales narrativas ambientales y eventos breves variables; coherencia entre geografía isométrica y exterior 3D.
- QA visual y funcional exhaustivo iPhone/desktop, controles, accesibilidad, rendimiento, continuidad 2D→3D y regresión Corazones original. Recién al aprobar: merge a `main`, verificar Action de Firebase Hosting y comunicar enlace final.

## Seguimiento

- **Fase 1: completada y validada.** CI final: https://github.com/lugal3/valeteamo/actions/runs/43743461803 (npm test, build, paisaje móvil, recorrido 2D completo, PC/teclado, nuevo test de sensibilidad en iPhone y PC, interior 3D y emotes). Capturas en https://github.com/lugal3/valeteamo/actions/runs/43743461803/artifacts/14173597640. **No publicada ni fusionada.**
- **Fase 2: completada y validada.** CI verde: https://github.com/lugal3/valeteamo/actions/runs/43749139228. Capturas de los cuatro biomas: https://github.com/lugal3/valeteamo/actions/runs/43749139228/artifacts/14175548066. **No publicada ni fusionada.**
- Fase 3: pendiente del próximo `.`. Solo después de esa fase y QA final se fusionará en `main` y publicará en Firebase.
