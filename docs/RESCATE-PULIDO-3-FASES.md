# Valeteamo · pulido narrativo del rescate en tres fases

**Rama de trabajo:** `codex/pulido-rescate-fases-20261115`.
**Base:** `main` a 15/11/2026, commit `e8370cfcec1eda94f73c30876c243028655c1b0c`.

La rama se mantuvo independiente durante las fases 1 y 2; el usuario ya autorizó por puntos consecutivos las fases 2 y 3. **La publicación se realizará solo tras superar los controles finales.** Se mantiene `IsoAdventure` / `StoryGame` del **Corazones original**, sin reemplazar sprites, motor, cámara, input, joysticks, controles o transición a la casa 3D.

## Estado

| Fase | Alcance | Estado |
| --- | --- | --- |
| **1** | Terreno, materiales, profundidad, ambientes y partículas de los cuatro mapas | **Implementada en esta rama** |
| **2** | Rediseño chibi de Luis, sprites, proporciones, parpadeo, caminata y poses | **Implementada en esta rama, pendiente revisión visual de fase 3** |
| **3** | Entrada animada de Luis, saludo, despedida, regresión PC/móvil 2D→3D, integración a main y Firebase | **Cinemáticas implementadas; verificación final y publicación en curso** |

### Fase 1 — Implementación

Modificada únicamente `src/demo/rescue-overworld.ts`, **sin tocar el juego clásico de Corazones**.

- Reemplazado el aspecto de cuadrícula repetitiva por **paletas de mosaico deterministas** para cuatro biomas; variación sutil de color y bordes orgánicos de senderos, grava, piedras, tierra, hierba y juntas en pavimento.
- **Mañana:** agua turquesa con reflejos y ondas, nenúfares, juncos, árboles floridos, bancos, cercas y zona de picnic.
- **Tarde:** grupo de cerezos de copa rosada por capas, macetas, flores, plaza ovalada, bancas y cercas de jardín.
- **Atardecer:** bosque con copas violáceas, orilla de arroyo con juncos, piedras, bruma baja y partículas de hojas y polvo.
- **Noche:** faroles con iluminación cálida en el suelo, terrazas, detalles de calle, maceteros, vallas, luciérnagas y fachadas con textura.
- **Casa:** fachada isométrica inspirada en el volumen 3D de 14 × 12 m / dos plantas de 3,15 m; se añadieron textura de tejas, ladrillo, chimenea, canaleta, hiedra, escalones y lámparas junto a la puerta. Se conserva la ventana abierta por donde entra Kitty.
- **Partículas:** un conjunto fijo de 25–40 partículas por mapa, reutilizando tres objetos `Phaser.GameObjects.Graphics`; animación ambiental limitada a ~30 Hz y soporte `prefers-reduced-motion`. Se limpian los objetos al cruzar el portal, sin acumulación entre mapas.
- Dibujado únicamente del mapa activo; funciones deterministas para que el paisaje no cambie aleatoriamente entre recargas.

### Fase 2 — Luis (realizada después del primer punto)

Se preservaron el retrato antiguo y los sprites de **Louis**. El protagonista de la mejora es **Luis**: novio de Kitty, pelo oscuro, gafas, camiseta sin mangas de tono carbón, vaqueros azul pizarra y tatuaje floral dibujado en su brazo izquierdo.

- `src/demo/prologue-art.ts`: sprite pixel-art chibi original de **48 × 64** con cabeza más grande, silueta redondeada, piel sombreada, peinado con brillo, gafas con reflejos, ojos y sonrisa expresivos, parche de corazón y un tatuaje floral reconocible, no un rectángulo oscuro.
- Tres orientaciones reales: `down`, `right` (reflejable para izquierda) y `up`.
- Cuatro animaciones reutilizables: `idle` (respiración y parpadeo cada ~4,3 s), `walk` (4 fases de piernas/brazos), `talk` (3 fases de boca y expresión) y `wave` (4 gestos listos para la despedida). Son **45 pequeños cuadros** en total, generados una sola vez en el cargador de texturas de la escena Phaser original, sin descargar imágenes externas.
- `src/iso-game.ts`: el NPC Luis utiliza el nuevo sprite y cambia orientación según desde dónde lo mira Kitty; mientras se muestra el diálogo RPG alterna las poses de conversación aun con el movimiento bloqueado. Fuera del diálogo respira y parpadea. Se respeta `prefers-reduced-motion`.
- Se mantiene `story-person-luis` como retrato para las ventanas RPG. El antiguo retrato de `story-person-louis` se conserva pixel por pixel, y los sprites del propio Louis no fueron modificados.
- `tests/luis-animation.cjs` comprueba 45 cuadros generados, vistas distintas, tatuaje/gafas/ropa, pose hablada, parpadeo, reutilización de texturas y que el diálogo siga bloqueando el joystick. Se integró al script `npm test` y al disparador CI.

**Límite de fase 2:** las poses `walk` y `wave` ya están listas, pero **Luis aún no se desplaza físicamente para llegar, acompañar ni salir**. La posición, timing del diálogo y escenas cinemáticas se modifican exclusivamente en fase 3 después del próximo punto del usuario.

### Fase 3 — Llegada y despedida (implementada; QA final en curso)

Se sustituyó la aparición brusca de Luis por un encuentro escenificado en la misma escena Phaser:

- `src/demo/luis-choreography.ts`: pequeño controlador determinista de **cuatro movimientos**: llegada curva desde el sendero lateral, saludo, despedida con mano levantada y salida por un camino diferente hacia el sendero. Sin timers, motores adicionales ni movimiento robótico en línea recta.
- `src/iso-game.ts`: Luis aparece físicamente al fondo del sendero cuando comienza la etapa; al acercarse Kitty entra caminando, con sombra pegada a sus pies y cambio de cuadro de animación y orientación según el desplazamiento. Kitty espera un instante mientras saluda, aparece un corazón, y solo entonces se habilita `Hablar con Luis`.
- Durante el diálogo se bloquea el control del jugador sin congelar las expresiones de Luis; al despedirse, Luis **saluda primero y camina fuera de la escena**. El cambio a `walk-together` (donde **Louis**, no Luis, sigue a Kitty) sucede **solo cuando termina ese recorrido**.
- `src/demo/GardenPrologue.tsx` mantiene el callback de finalización; si se reinicia o cambia de capítulo, se cancelan referencias al personaje y no se ejecutan callbacks antiguos.
- Se ajustaron sus diálogos para reconocer la llegada y la despedida de forma natural.
- `tests/luis-choreography.cjs` comprueba trayectoria curva, posición, temporización, puerta de diálogo y bloqueo de inputs; `tests/prologue-browser.cjs` captura llegada, idle, conversación, saludo, despedida y alejamiento, y recorre la historia hasta el 3D en un viewport móvil.
- `tests/prologue-desktop.cjs` comprueba escritorio a 1280×720, cámara, WASD, disparo y la transición entre mapas. Continúan los checks de emotes/clics 3D y el modo Corazones clásico.
- La preferencia de movimiento reducido conserva controles accesibles; los sprites se reutilizan sin crear texturas en cada fotograma.

Las fases 1 y 2 permanecieron aisladas en una rama dedicada. Se revisará el resultado final de Actions antes del merge y de Firebase.

### Límites intencionados

La fase 1 no incorporó Luis. La fase 2 añadió su arte y animaciones al motor original. La fase 3 conectó esos cuadros a sus desplazamientos sin cambiar el combate, IA enemiga, controles ni el interior 3D. **Luis** (novio de Kitty, se despide y regresa al sendero) y **Louis** (personaje secuestrado que acompaña a Kitty) siguen siendo personajes independientes.

### Verificación final prevista en fase 3

- `npm ci && npm test && npm run build`.
- `node tests/landscape-gate.cjs`, `node tests/cosmos-browser.cjs`, `node tests/cosmos-public-flow.cjs`, `node tests/prologue-browser.cjs`, `node tests/prologue-desktop.cjs` y `node tests/emotes-browser.cjs` en Chromium.
- Revisar especialmente la continuidad visual entre mañana/tarde/atardecer/noche, las entradas y salidas de Luis, el tiempo de diálogo, la velocidad de los fades, la cámara, los clics PC y la conexión final a la casa 3D.
- Únicamente después de las pruebas exitosas y de la autorización del usuario mediante el segundo punto: fusionar la PR #19 a `main` y comprobar el resultado de la GitHub Action de Firebase Hosting.

**Estado de publicación:** pruebas y merge pendientes. Este archivo se actualizará con los enlaces de CI/despliegue una vez verificados.
