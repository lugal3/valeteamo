# Rescate 2D: continuar el verdadero «2D Corazones»

## Cambio de enfoque solicitado por el propietario

La primera versión de esta PR dibujaba un mundo isométrico parecido a Corazones, pero **era otro Phaser.Game**. Eso no cumplía la intención del proyecto y se retiró por completo.

Ahora el rescate se ejecuta en la **misma clase Phaser `IsoAdventure`** y el **mismo contenedor `StoryGame`** que usa `Pruebas → 2D · Corazones`. La historia añade objetivos por etapas al código existente mediante el parámetro opcional `IsoStoryBridge`.

## Qué se reutiliza, exactamente

| Pieza | Código original compartido |
| --- | --- |
| Cámara, zoom y posición | `src/iso-game.ts → fitCamera()` sin cambios |
| Suelo romboidal y decoración | `src/iso-game.ts → drawFloor(), flower(), shrub(), tree()` |
| Hoja de sprites de Kitty | `installReferenceCharacter()` y PNG de `public/sprites/` |
| Animaciones y parpadeo | `IsoAdventure.update()` original, sin un segundo controlador |
| Movimiento, joystick, disparos | `IsoAdventure.update()` original (WASD, flechas, gestos táctiles) |
| Efectos y música | `Sound`, `shoot()`, `burst()`, `hitEnemy()`, `damage()` |
| HUD, salud, pantalla completa | `StoryGame.tsx` original, solo se habilita objetivo narrativo |
| Casa 3D | `RescueDemo → launchHouse()` original |

`src/demo/GardenPrologue.tsx` ya NO contiene `new Phaser.Game`, otro mapa, otro sistema de cámara ni movimiento propio. Solo gestiona el guion de etapas, los diálogos y su comunicación con `IsoAdventure`.

## Secuencia dentro del juego

Cada etapa usa una **sala del mismo 2D Corazones**, no un mundo plano distinto:

1. Intro y encuentro en jardín de Corazones.
2. Combate del propio Corazones contra tres enemigos.
3. Hablar con Louis.
4. Hablar con Luis (personajes distintos).
5. Acompañar a Louis hasta el claro de la sala.
6. Secuencia de secuestro con sprites y tweens de la misma escena.
7. Salas consecutivas con pulsera, pétalos y huellas.
8. Sala de la casa: puerta cerrada, luego ventana.
9. El único Phaser `IsoAdventure` se desmonta; arranca la casa WebGL 3D existente.

La casa exterior es un hito visual de tamaño de sala, dibujado con `Graphics` y la paleta del juego ya existente, no un escenario con tecnología diferente.

## Aislamiento y regresiones

El código original del arcade sigue siendo el **modo por defecto**. La extensión de historia solo se ejecuta si se pasa un objeto `story`; sin él, Corazones usa los mismos enemigos, cámara, nivel, HUD, movimiento y fin de ronda que antes.

No se modifican `public/sprites/`, `src/isometric.ts`, `src/art.ts`, `src/chibi-art.ts`, `src/game.ts` ni `src/lab/`.

Los guardados de historia (`valeteamo-story-acts-1-2-v1`) y rescate (`valeteamo-rescue-v2`) siguen separados del arcade.

## Pruebas

```sh
npm ci
npm test
npm run build
node tests/prologue-browser.cjs
npm run test:browser
```

La prueba en navegador debe comprobar la entrada desde Pruebas, la animación de corazones, la transición de diálogos y la llegada a la ventana 3D. También deben revisarse manualmente el arte y los gestos de disparo en un iPhone real.

**Rama de revisión:** no fusionar a main ni desplegar a Firebase sin revisar el resultado artístico.
