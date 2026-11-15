# Rescate 2D · Fase 2 — Mundo vivo (ValeTeAmo)

## Objetivo y alcance

Hacer que los cuatro mapas respondan a la presencia y al movimiento de Kitty, incluso cuando el jugador está quieto, sin bloquear los controles ni reemplazar el pixel art, la progresión, las cinemáticas o el acceso a la casa 3D. **Todo funciona dentro de `IsoAdventure` con Phaser original; la aventura clásica `2D · Corazones` continúa sin una sola instancia del ecosistema.**

## Cuatro ambientes con identidad

| Capítulo | Luz, flora y agua | Fauna | Paisaje sonoro y microeventos |
|---|---|---|---|
| 1 · Río de los pétalos | Ramas con flores en movimiento, vegetación que se inclina al acercarse Kitty, nenúfares y reflejos/ondas sobre el río y el puente | Mariposas, gorriones, conejos | Agua cercana al puente, trinos y brisa; pequeños remolinos de pétalos y ondas |
| 2 · Jardín de cerezos | Luz dorada con rayos móviles, flores, hojas y sombra suave en el claro | Mariposas, gorriones, ardillas y conejos | Trinos, hojas movidas por el viento y destellos ambientales |
| 3 · Bosque de las pistas | Niebla baja animada, arroyo, juncos, vegetación oscura, destellos y luciérnagas | Polillas, búhos, zorros y conejos | Insectos, viento entre árboles y ondas del arroyo |
| 4 · Villa de los faroles | Halos cálidos, faroles, ventanas iluminadas y cortinas que se mecen, alguna luz se atenúa, bruma a ras de calle | Gatos, cuervos y polillas | Viento nocturno, insectos y algún motor distante (sutil vínculo con la furgoneta LUNA-07) |

Los animales son **decorativos, no enemigos ni colisiones**: deambulan poco, reaccionan cuando Kitty se acerca, se apartan y regresan gradualmente. No hay eventos obligatorios ni diálogos nuevos. El entorno nunca cambia el objetivo de una misión.

## Implementación

- `src/demo/rescue-ecology.ts` contiene todos los estados y las semillas deterministas de fauna, flora, ambiente y microeventos. Fórmulas de alerta/relajación independientes del FPS.
- `src/demo/rescue-ecology-render.ts` dibuja las formas originales con `Phaser.GameObjects.Graphics` reutilizables. Cada ave, conejo, gato o flor conserva su gráfico y su profundidad isométrica; no se crean objetos ni emisores dentro del `update()`.
- `src/demo/rescue-overworld.ts` carga el ecosistema de cada mapa, lo actualiza a un máximo aproximado de 30 FPS y destruye **todos** los objetos al salir mediante el conjunto de elementos creados en la escena.
- `src/iso-game.ts` entrega la posición de Kitty solo durante `if(this.story)`. No cambia ni dispara efectos en el modo Corazones clásico. La fase 1 (movimiento, cámara y pisadas) permanece intacta.
- `src/audio.ts` dispone de una función de audio ambiental original mediante Web Audio y panoramización estéreo cuando está disponible. Se dispara de forma esporádica, se integra con `mute`/`pause`, no utiliza muestras externas ni temporizadores perpetuos.
- `prefers-reduced-motion`: sin aleteos, cambios de posición de animales decorativos, sacudidas de plantas ni eventos de partículas animados; conserva la geografía y lectura de pistas.

## Presupuesto de recursos para móvil

- **18 plantas animadas máximo por mapa**, de las cuales se actualizan visualmente las próximas a Kitty.
- **6–7 animales por mapa** (límite global de 8); renderizados solo cerca de la posición horizontal del jugador.
- **25–40 motas** ya existentes en los mapas, reutilizadas; máximo de 12 ondas extra, 6 ventanas dinámicas.
- **~30 actualizaciones visuales/s**, sin bloquear la lógica y los controles a ~60 FPS.
- Audio ambiental espaciado en intervalos de al menos 5,6 segundos, con límite adicional de 2,4 segundos en el sintetizador; silencioso antes de permiso del usuario.
- Semillas reproducibles y movimientos continuos: sin `Math.random()` ni asignaciones de textures en el bucle y sin `setTimeout` en la ecología.
- El cambio entre mapas libera todos los Graphics; no acumula objetos ni pistas invisibles.

## Pruebas

- `tests/rescue-ecology.cjs`: cuatro biomas, tipos diferentes de animales y microeventos, plantas que reaccionan, animales que se apartan/vuelven, 30/60/120 FPS, límites, `prefers-reduced-motion`, audio y aislamiento del modo clásico.
- `tests/audio.cjs`: sonidos ambientales con permissionamiento, atenuación, mute y cooldown.
- `tests/prologue-browser.cjs`: inspección visual y conteo de plantas y fauna en los cuatro mapas reales durante el recorrido al interior 3D, con capturas por capítulo.
- `tests/rescue-feel-browser.cjs`: teclado, joystick de iPhone, cámara, pisadas y desaceleración de fase 1 como regresión.
- `npm test`, `npm run build`, CI de Playwright PC/móvil, transición 2D → 3D, emotes y accesibilidad.

## Entregas y control por punto

Se debe informar la fase 2 **solo al aprobar la CI** y dejar la PR #22 en estado borrador. Quedan pendientes las mejoras de personajes, coreografía, burbujas ambientales y publicación de la **fase 3**, que se iniciará solo después de que el usuario envíe su próximo `.`. Firebase seguirá sin cambios en esta fase.
