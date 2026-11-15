# Rescate dentro de Corazones — cuatro mapas y día → noche

Esta ruta **sigue usando la misma clase Phaser `IsoAdventure`**, el mismo `StoryGame`, sprites Kitty/Louis, disparos de corazones, cámara isométrica con zoom original, joystick y teclado que el modo **2D · Corazones**. No hay un motor ni un juego nuevos.

## Escenarios separados (carga de uno en uno)

`src/demo/rescue-overworld.ts` define `RESCUE_SCENES`, `mapForStage`, `constrainRescue`, `exitReady` y el dibujante `buildRescueOverworld()`.

| Mapa | Momento | Qué ocurre | Salida |
| --- | --- | --- | --- |
| `morning_garden` | Mañana soleada | Kitty sola, control contextual, puente sobre agua animada, sendero y flores | Portal brillante al jardín de la tarde |
| `afternoon_meeting` | Tarde dorada | Sombras del combate arcade, encuentro con Louis y Luis, paseo, secuestro | Portal al bosque, desbloqueado tras el secuestro |
| `dusk_search` | Atardecer violeta | Pulsera, pétalos, huellas, arroyo y bosque con luciérnagas | Portal al vecindario, desbloqueado tras examinar las huellas |
| `night_neighborhood` | Noche | Calle, veredas, faroles, casas vecinas, puerta cerrada y ventana | Transición existente al interior 3D |

Los límites de cada mapa cortan el movimiento en los bordes y `exitReady()` decide cuándo está abierto cada camino narrativo. Llegar al pequeño límite brillante desencadena la transición **sin pulsar ningún botón**. Nunca se puede atravesar el extremo del terreno y caer fuera de él.

En `src/iso-game.ts`, el método `changeStoryMap()` destruye los objetos visuales del mapa anterior y construye los del nuevo. Solo está activo un mapa a la vez: esto reduce la cantidad de terreno y decoraciones dibujadas y es más simple de ampliar.

## Transición tipo Pokémon

`GardenPrologue.tsx` gestiona una superposición CSS negra que cubre el viewport, incluidos el notch y la IU. Cuando Kitty cruza una salida:

1. Bloquea movimiento, disparo e interacción.
2. Hace **fade out a negro** durante unos 650 ms.
3. Reemplaza el mapa activo sin reemplazar la escena Phaser ni el jugador, lleva a Kitty al punto de entrada y centra la cámara.
4. Aplica la hora del día, decoración y tema musical adecuados.
5. Hace **fade in** y desbloquea los controles.

`src/demo/garden-prologue.css` define `.prologue-curtain`, distinta de `.prologue-night`: la primera es un fundido temporal opaco y la segunda la ambientación permanente del mapa. Ninguna recibe clics cuando está inactiva. No se usa un rectángulo Phaser fijo: el bug del rectángulo gris desalineado continúa corregido.

## Continuidad y guardado

La secuencia narrativa original se conserva: tutorial, combate, hablar con Louis, hablar con Luis, paseo, secuestro, pulsera, pétalos, huellas, puerta, ventana y entrada a la casa 3D real.

Los checkpoints siguen guardándose por etapa en la misma clave de `prologue-story.js`. Cuando se recarga la página, `mapForStage()` reconstruye el mapa correcto para esa etapa. Las transiciones no sobrescriben la aventura clásica ni otras partidas. Si se corta el secuestro, se restaura el paseo de forma segura.

## Casa isométrica inspirada en el modelo 3D real

La casa principal se dibuja dentro del mapa nocturno (no modifica el interior 3D).

Las medidas y distribución verificadas en `src/lab/house-layout.js` son **14 × 12 m**, dos plantas de **3,15 m** cada una y techo a dos aguas. En planta baja hay estudio/sala en el ala oeste, corredor/entrada central, cocina-comedor y baño en el ala este; arriba hay dormitorio, lectura y sala de música.

El modelo isométrico actual refleja:
- Dos plantas claras y techo a dos aguas.
- Ala oeste, hall de entrada, ala de cocina/baño y ventanas en ambas plantas.
- **Puerta principal al sur, aproximadamente en x=5,9**, distinta de la **ventana abierta de entrada en x=2,2**. En el 3D esta ventana de la introducción no tiene tablones; la casa isométrica la representa entreabierta, mientras una ventana del piso superior sí tiene tablones. Kitty regresa hacia el ala occidental tras comprobar la puerta, en vez de seguir avanzando en línea recta.
- Volumen lateral, balconcito, acera, faroles, casas vecinas y ambiente nocturno.

Es una correspondencia esquemática, no un calco 1:1 de cada pared. El modelo 3D completo no se alteró.

## Protecciones y pruebas

- La lógica de mapas y portales se prueba en `tests/rescue-world.cjs`.
- `tests/prologue-browser.cjs` recorre los **tres portales reales**, los diálogos, pistas, la oscuridad y la entrada 3D. Valida el uso del verdadero `IsoAdventure`.
- `tests/landscape-gate.cjs`, `cosmos-public-flow.cjs`, `cosmos-browser.cjs` y `emotes-browser.cjs` siguen cubriendo smartphone, cumpleaños, entradas y clics con ratón en 3D.
- `npm test && npm run build` comprueba además el arcade clásico.

GitHub Actions **Verificar experiencia cósmica** se ejecuta en `push` de `main` para comprobar cambios directos. El workflow separado **Publicar Valeteamo en Firebase** gestiona el despliegue; verificar su conclusión por separado después de cada actualización.

Para futuras iteraciones artísticas, ajustar cada mapa en `RESCUE_SCENES` y su dibujante sin tocar `isometric.ts`, `chibi-art.ts` ni la física original de Corazones.
