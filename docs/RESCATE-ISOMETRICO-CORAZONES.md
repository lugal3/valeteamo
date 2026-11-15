# Rescate 2D isométrico — misma estética de «2D Corazones»

## Decisión
El 2D existente que el propietario quiere conservar es **Pruebas → 2D · Corazones**.
Su motor es Phaser 3, su clase está en `src/iso-game.ts`, las hojas
de animación de Kitty en `public/sprites/` y la lógica de direcciones
en `src/animation.ts`.

La historia de rescate sigue siendo el prólogo canónico, pero ya **no**
se dibuja como una aventura lateral de sprites gigantes y fondos planos.

## Archivos modificados
- `src/demo/GardenPrologue.tsx`: Phaser, sprites y hojas de caminata de Kitty
  reutilizados sin alterarlos; frames de caminar en cuatro direcciones,
  parpadeo, disparos con animación y efectos usando la clase Sound existente;
  cámara de seguimiento con el mismo ajuste de zoom que `IsoAdventure`;
  UI móvil, barra de salud, indicador de sombras, conversaciones y guardados.
- `src/demo/rescue-iso-world.ts`: nuevo arte 2D isométrico; rombos 82×40,
  vegetación pixelada, sendero y casa con puerta cerrada y ventana en perspectiva.
- `src/demo/garden-prologue.css`: HUD y controles en tonos crema, rosa
  y verde, con estilo de la aventura isométrica.
- `src/demo/RescueDemo.tsx`: las entradas de prueba 2D comparten el
  mismo `GardenPrologue`. Se retiró el antiguo escenario lateral, pero
  **no** se altera el código de la casa 3D.
- `tests/prologue.cjs`: aserciones de integración para evitar volver a
  presentar escenas 2D con un motor visual diferente.

## Línea temporal conservada
1. Kitty camina por el jardín y conoce el entorno.
2. Defiende a Louis de las sombras disparando corazones.
3. Conversa con Louis y se presenta; luego conoce a Luis.
4. Acompaña a Louis y presencia su desaparición.
5. Sigue la pulsera, los pétalos y las huellas hasta la casa.
6. Descubre que la puerta está cerrada, busca la ventana y entra.
7. Se desmonta Phaser; el mismo `launchHouse` existente abre la casa
   WebGL y su cinemática de ventana.

Se conservan Luis y Louis como personajes distintos, la clave de guardado
`valeteamo-story-acts-1-2-v1`, `valeteamo-rescue-v2` y los modos
originales «2D Corazones», «Aventura clásica», historia y casa 3D.

## Pruebas antes de integrar o publicar
```sh
npm ci
npm test
npm run build
npx playwright install chromium
node tests/prologue-browser.cjs
```
Revisar sobre todo en iPhone horizontal la escala de las baldosas,
la visibilidad de la casa, el joystick junto al botón de disparo y
la escena de secuestro durante la transición a la noche.

**Importante:** esto es una rama de revisión. No se fusiona automáticamente
a `main` y no se despliega a Firebase. Los sprites de `public/sprites/`
y el código original `src/iso-game.ts` permanecen intactos.
