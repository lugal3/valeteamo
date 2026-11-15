# Rescate: exploración continua en el Corazones 2D original

## Regla innegociable

Este recorrido **no es otro juego ni otro renderer**. Sigue usando:
`StoryGame` → `IsoAdventure` (Phaser 3) → `buildArt`/`buildChibi`/`installReferenceCharacter` → `screenVector` y `toScreen`.

La cámara usa el zoom exacto original `Math.min(width/800,height/450)*1.08`, pero sigue suavemente a Kitty para mostrar territorio nuevo en vez de la antigua arena fija. La velocidad de movimiento, animaciones, disparos, impactos, teclas y joysticks originales no se cambian.

El arcade **2D · Corazones** funciona igual cuando no se pasa `story`. El rescate pasa `IsoStoryBridge` como parámetro opcional. El juego clásico y la casa 3D no se reemplazan.

## Nuevo recorrido: seis ambientes físicamente conectados

`src/demo/rescue-overworld.ts` contiene **funciones de terreno para la escena original**, sin `new Phaser.Game`, cámaras nuevas ni controlador de movimiento nuevo. Las coordenadas isométricas `(u,v)` recorren un territorio largo y angosto con límites que se ensanchan y encogen naturalmente.

| Región | Extensión en ruta | Características |
| --- | --- | --- |
| Sendero de los recuerdos | u 0–12 | Kitty sola, inicio diurno, flores y tutorial gradual |
| Río de los pétalos | u 12–20 | Agua azul animada, reflejos y puente de madera transitable con postes |
| Jardín de cerezos | u 20–40 | Prado ancho, arbustos, árboles, bancos y combate original |
| Bosque del crepúsculo | u 40–55 | Vegetación, senda más angosta, secuestro y primeras pistas |
| Villa de los faroles | u 55–66 | Vereda, calle, faroles, casas vecinas, huellas y caída de la luz |
| La casa de dos pisos | u 66–81 | Entrada, patio, calle, casas laterales y gran casa de dos plantas |

El suelo usa el tamaño romboidal **82×40** y los colores exactos de `drawFloor()` de Corazones, mezclados con piedra, sendero, asfalto y bosque. `flower()`, `tree()`, `mushroom()` y `shrub()` siguen siendo las funciones de dibujo originales.

El agua tiene **tiles y destellos móviles** por `Phaser.GameObjects.Graphics`. Se actualiza en el mismo `IsoAdventure.update()`, también mientras hay diálogos. El puente mantiene una franja caminable y las orillas imponen límites de colisión; no se puede cruzar nadando por el río.

Los actores y las pistas aparecen en posiciones **cada vez más adelantadas** dentro del mundo y ya no reinician la posición de Kitty en cada etapa. Se conservan los eventos del guion y los checkpoints guardados.

## Tutorial y progresión narrativa

Kitty comienza **totalmente sola**, sin enemigo ni NPC ni caja de diálogo forzada. Primero se descubre el movimiento; al avanzar se enseña cómo disparar, luego el puente y la interacción. El primer diálogo ocurre **después** de llegar al jardín y prepara el combate. Siguen Louis, Luis, el paseo, el secuestro, pulsera, pétalos, ruedas, puerta y ventana. Tras esa ventana se arranca el juego 3D real, sin sustituirlo.

## Atardecer: bug de rectángulo eliminado

La antigua capa `Phaser.Rectangle` de 800×450, unida al zoom y al scroll, producía un rectángulo gris mal alineado. **Se eliminó**. La nueva `.prologue-night` es una capa CSS `position:absolute;inset:0` anclada al viewport `story-prologue`, `pointer-events:none`, con gradiente azul-violeta y transición de 2300 ms.

`darknessAt()` aumenta la opacidad gradualmente según la distancia; el secuestro fija un mínimo nocturno y la noche se profundiza entre pistas y calle. Al cambiar el tamaño de pantalla, la capa conserva exactamente el área visible sin depender de las coordenadas de la cámara.

## Casa 2D y vecindario

`drawHouse()` dibuja una casa isométrica principal de dos pisos con techo a dos aguas, dos bandas de habitaciones, ventanas de ambas plantas, puerta principal, ventana lateral, balcón y patio. Sus proporciones se basan en el volumen **14 m × 12 m con dos plantas de 3,15 m** documentado en `src/lab/house-layout.js`. No pretende ser un calco exterior fotogramétrico; representa sus dos alas, habitaciones y accesos desde la perspectiva isométrica. Hay casas vecinas, luces y aceras.

La escena 3D **no fue remodelada**; solo se corrigió el funcionamiento del menú de emotes y los clics PC.

## Emotes 3D y ratón

En `src/lab/house.css` el selector oculto ahora se fuerza a `display:none!important` cuando tiene `hidden`, porque la regla anterior `display:flex` podía dejarlo interceptando clics sin verse.

En `src/lab/house.js` abrir el selector libera `pointer lock` antes de presentar los botones, restaura el input y actualiza `aria-expanded`. Elegir emote, salir del baño, Escape o reiniciar también cierra el panel. Se puede abrir con botón del mouse o la tecla **M**.

## Pruebas de regresión

```sh
npm ci
npm test
npm run build
node tests/landscape-gate.cjs
node tests/cosmos-public-flow.cjs
node tests/prologue-browser.cjs
node tests/emotes-browser.cjs
```

`tests/rescue-world.cjs` comprueba los seis ambientes, el puente angosto, el orden espacial, el oscurecimiento gradual, la reutilización del motor y el arreglo de emotes. Las pruebas de navegador verifican entrada sin personajes, cámara, escena, transiciones, 3D y clicks en escritorio; sus capturas quedan en los artifacts de GitHub Actions.

**Pendiente artístico:** revisar personalmente en un iPhone y en navegador de escritorio la velocidad del recorrido, proporciones de la casa y aspecto del agua antes de fusionar esta PR a main o publicar Firebase.
