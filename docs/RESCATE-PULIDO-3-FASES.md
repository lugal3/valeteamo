# Valeteamo · pulido narrativo del rescate en tres fases

**Rama de trabajo:** `codex/pulido-rescate-fases-20261115`.
**Base:** `main` a 15/11/2026, commit `e8370cfcec1eda94f73c30876c243028655c1b0c`.

La rama es independiente. **No hacer merge, no publicar Firebase ni iniciar la fase siguiente sin que el usuario escriba un punto (`.`).** Se mantiene `IsoAdventure` / `StoryGame` del **Corazones original**, sin reemplazar sprites, motor, cámara, input, joysticks, controles o transición a la casa 3D.

## Estado

| Fase | Alcance | Estado |
| --- | --- | --- |
| **1** | Terreno, materiales, profundidad, ambientes y partículas de los cuatro mapas | **Implementada en esta rama** |
| **2** | Rediseño chibi de Luis, sprites, proporciones, parpadeo, caminata y poses | **Pendiente: esperar el primer `.`** |
| **3** | Luis entra y sale caminando, despedida, acompañamiento, cinemáticas y pruebas completas (PC/móvil 2D→3D), merge a main y verificación de Firebase | **Pendiente: esperar el segundo `.`** |

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

### Límites intencionados

Esta fase NO implementa animaciones de Luis, nuevos diálogos ni modifica la cámara, combate, IA enemiga, controles, ni la escena del 3D. El rediseño del personaje se realizará en fase 2 sobre `src/demo/prologue-art.ts`, respetando la diferencia narrativa entre **Luis** (novio de Kitty) y **Louis** (personaje secuestrado). La fase 3 implementará entradas y salidas escénicas y verificará las transiciones completas antes de integrar y publicar.

### Verificación final prevista en fase 3

- `npm ci && npm test && npm run build`.
- `node tests/landscape-gate.cjs`, `node tests/cosmos-browser.cjs`, `node tests/cosmos-public-flow.cjs`, `node tests/prologue-browser.cjs` y `node tests/emotes-browser.cjs` en Chromium.
- Revisar especialmente la continuidad visual entre mañana/tarde/atardecer/noche, las entradas y salidas de Luis, el tiempo de diálogo, la velocidad de los fades, la cámara, los clics PC y la conexión final a la casa 3D.
- Únicamente después de pruebas exitosas y del punto de avance de fase 3: fusionar a `main` y comprobar el resultado de la GitHub Action de Firebase Hosting.

**Estado de publicación:** cambios de esta rama **no publicados** en Firebase.
