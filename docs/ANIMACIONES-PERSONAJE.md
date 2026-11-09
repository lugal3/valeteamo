# Animaciones reutilizables de Kitty

## Resultado

El modelo suave del espejo ahora usa un esqueleto de 15 articulaciones. Tiene reposo con respiración discreta y caminar con piernas, rodillas y pies articulados. El modelo, el esqueleto, el mezclador y los clips son módulos separados, sin depender de Phaser, DOM ni un segundo motor.

| Archivo | Responsabilidad |
|---|---|
| `src/lab/character-model.js` | Geometría en postura de referencia y asignación explícita de cada pieza a una articulación. |
| `src/lab/character-rig.js` | Jerarquía, pivotes, matrices, pose de referencia y transformación de posiciones/normales. |
| `src/lab/animator.js` | Reloj, distancia, dirección, mezcla suave entre reposo/caminar y selección de clips. |
| `src/lab/animations/idle.js` | Respiración, balanceo mínimo y movimiento suave de cabeza y muñeca. |
| `src/lab/animations/walk.js` | Pasos por distancia real, apoyo del pie y resolución de cadera/rodilla/tobillo. |
| `src/lab/animations/window-entry.js` | Clip corporal reutilizable y puntos de apoyo de las manos que ya consume la entrada actual. |
| `src/lab/mirror.js` | Aplicar la reflexión y situar la pose sobre el suelo; no define las animaciones. |

## Movimiento y rendimiento

`house.js` entrega el desplazamiento resuelto por las colisiones, no la posición del joystick. El ciclo avanza según metros recorridos y se detiene al empujar contra una pared. En apoyo, el pie se desplaza hacia atrás en coordenadas locales a la misma velocidad que el personaje avanza: su posición mundial permanece fija. Al cambiar de dirección o detenerse, el controlador mezcla las poses suavemente. La cabeza, el moño, los ojos, los bigotes, las manos y la linterna siguen sus articulaciones respectivas.

Fuera del espejo se conserva únicamente el estado ligero del controlador (tiempo, distancia y mezcla). El muestreo de clips, las matrices, la transformación de los 12.064 vértices y la actualización del buffer se ejecutan después de la comprobación de visibilidad del espejo. Al mirar hacia otro lado no se evalúa el esqueleto. Al volver, la pose se obtiene del estado actual. No hay nuevos temporizadores ni bucles de animación independientes.

Pausar, perder foco, abrir ajustes o girar a vertical congela el reloj. Con movimiento reducido se elimina la respiración decorativa; se conservan los pasos funcionales. El render actual permanece en primera persona y los guardados/2D no se editan.

## Reutilización

```js
import {CharacterAnimator} from '../src/lab/animator.js';
import {createRigBinding, evaluateRig, skinCharacter} from '../src/lab/character-rig.js';
import {characterPieces} from '../src/lab/character-model.js';
import {geometry} from '../src/lab/renderer.js';

const actor = new CharacterAnimator();
const mesh = geometry(characterPieces());
const binding = createRigBinding(mesh.groups);
const posedVertices = new Float32Array(mesh.vertices.length);

// Cada actualización de simulación: distancia real en metros y dirección local.
actor.advance(dt, {distance, forward, side, paused, reduced});

// Solo cuando una cámara necesite mostrarlo:
evaluateRig(binding, actor.sample());
skinCharacter(mesh.vertices, posedVertices, binding);

// Una escena futura puede seleccionar el clip de entrada con progreso de 0 a 1:
evaluateRig(binding, actor.sample('window-entry', progress));
skinCharacter(mesh.vertices, posedVertices, binding);
```

También están disponibles `actor.sample('idle')` y `actor.sample('walk')` para previsualizar los clips. Las posiciones de esta API son locales al personaje; cada escena debe aplicar su transformación al mundo y su cámara. El suelo físico y las colisiones continúan a cargo del juego.

## Entrada por ventana

La cinemática publicada conserva su cámara, duración, colisiones, opción de saltar, pausa y manos en primera persona. Sus apoyos ahora proceden de `animations/window-entry.js`. Ese archivo contiene además una curva corporal para apoyar brazos, levantar piernas y volver a reposo. Mostrar todo el cuerpo en una nueva toma externa o integrar una cinemática corporal completa queda para la siguiente etapa; no se presenta como una sustitución ya realizada de la entrada actual.

## Verificación

- `npm test` y `npm run build`.
- `tests/character-animation.cjs`: postura de referencia idéntica, todas las piezas ligadas, normales unitarias, pie de apoyo fijo en cuatro direcciones, pared sin avance de fase, mezcla, pausa, 30/60 Hz, movimiento reducido y clip de ventana.
- `tests/character-animation-browser.cjs`: reposo/caminar visibles, detenerse contra pared, pausa, ausencia de evaluaciones/buffers fuera del espejo, retorno, accesibilidad y entrada por ventana.
- `tests/mirror-browser.cjs` y `tests/chibi-browser.cjs`: regresiones del espejo, menú, audio, guardados, controles táctiles, linterna y manos.
- Evidencias en `docs/capturas/animaciones/`: capturas y vídeo breve de la aplicación real.

Las pruebas de Chromium por software no certifican FPS ni compatibilidad en un iPhone físico. Las articulaciones usan piezas rígidas solapadas; no es todavía una piel continua con pesos múltiples, ni un archivo glTF exportado.
