# Secuestro animado · furgoneta LUNA-07

## Propósito
Sustituir el antiguo efecto de desaparición instantánea (sprite Kuromi + transparencia) por una **cinemática jugable dentro de la misma escena Phaser 2D · Corazones**. Se conservan sus controles, cámara, personajes, 4 mapas independientes y enlace al interior 3D.

**Continuidad narrativa actual:** el juego diferencia **Luis** (novio de Kitty; gafas y tatuaje, conversa en el jardín y luego investiga) y **Louis** (invitado seguido por las sombras y secuestrado; personaje al que Kitty rescata en la casa 3D). Para conservar el rescate y modelo 3D ya realizados, la furgoneta se lleva a **Louis**. El detalle se puede cambiar más adelante junto con el personaje que se encuentra en el 3D; NO están mezclados.

## Dirección de la escena
`src/demo/abduction-van.ts` define el arte pixel art original y el estado de la cinemática con fotogramas deterministas:

1. La furgoneta gris-lila **LUNA-07** aparece de forma progresiva por el camino con ruido de motor y polvo.
2. Frena; abre su **puerta corredera**, con sprite de carrocería diferente.
3. Bajan **dos secuestradores**, uno con **máscara de zorro** y otro con **máscara de conejo**. Cada uno tiene cuadros para caminar y sujetar.
4. Se aproximan a Louis desde posiciones distintas; Louis reacciona y retrocede durante el forcejeo.
5. Lo sujetan, lo guían hasta la puerta lateral y lo suben. Permanece visible hasta llegar al umbral: **no se achica, no se desvanece, no se teletransporta**.
6. Los secuestradores vuelven a subir, se cierra la puerta y la furgoneta acelera fuera del encuadre, dejando polvo.
7. Se activa la búsqueda solo al acabar la salida física del vehículo.

Duración total de referencia: **8,9 segundos**, con pequeñas señales de audio, mínimo movimiento de cámara y reducción de efectos para `prefers-reduced-motion`. La cinemática no utiliza `setTimeout`, nuevos motores, imágenes descargadas ni emisores infinitos: la actualiza `IsoAdventure.update()`. Los controles se bloquean solo mientras ocurre la captura.

## La pista en el barrio
`buildRescueOverworld` coloca **el mismo sprite del vehículo con media luna y matrícula LUNA-07** junto a la vereda de la casa de dos plantas, sin tapar puerta ni ventana. Al acercarse aparecen **«Inspeccionar furgoneta»** y una confirmación visual y sonora. También existe **«☾ Investigar furgoneta»**, una ruta opcional de caminar físicamente desde la calle; el joystick o WASD la cancelan como la guía de la casa. La inspección no abre un diálogo largo ni bloquea la misión, y la pista queda visible en el HUD nocturno.

## Transiciones suaves
Louis camina desde los cerezos después de la batalla y conserva su coordenada en pantalla cuando la historia cambia de `talk-louis` a `talk-luis`, a `walk-together` y a `disappearance`. La persecución comienza exactamente en sus últimos píxeles, sin desplazarlo arbitrariamente hacia Kitty. Las animaciones previas de saludo y despedida de Luis se preservan.

## Textos para editar
Los únicos textos principales están en `src/demo/prologue-story.js` → `PROLOGUE_DIALOGUES`. Se redujeron a **1 o 2 líneas por escena**, deliberadamente breves; el usuario puede reemplazarlos por textos definitivos más adelante sin modificar los tiempos ni los controles de la cinemática.

## QA y compatibilidad
- `tests/abduction-van.cjs`: fases, movimiento real del coche y del cautivo, captores distintos, puerta abierta, plate `LUNA-07`, ruta accesible, no sprite Kuromi viejo.
- `tests/rescue-world.cjs`: carga separada de mapas y continuidad con casa 3D.
- `tests/prologue-browser.cjs`: capturas de llegada, máscaras, carga, huida, visita física a la misma furgoneta nocturna, inspección y entrada a casa 3D.
- `tests/prologue-desktop.cjs`, `tests/emotes-browser.cjs`: teclado, cámara y 3D originales.
- `npm test`, `npm run build`: verificaciones antes de merge a `main` y publicación Firebase.

No se cambiaron los dormitorios, puzzles, rescate ni modelos internos de la casa 3D.
