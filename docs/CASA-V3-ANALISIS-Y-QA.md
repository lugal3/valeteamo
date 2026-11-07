# Informe de ingeniería — Casa completa V3

**Alcance:** una única casa 3D de dos plantas, jardín de rescate 2D conservado como prólogo, portada animada y melodía original. Código base: `src/lab/world.js`, `navigation.js`, `house.js`, `renderer.js`, `src/demo/Splash.tsx`.

## Diagnóstico con pruebas en código

| Área | Problema identificado | Cambio aplicado y límite |
|---|---|---|
| Cámara horizontal | `moveLook` hacía `s.yaw -= dx * factor` mientras `renderer` usa `forward=[sin(yaw),...,cos(yaw)]`. Un arrastre a la derecha giraba la mirada a la izquierda; ArrowRight tenía signo contrario | `applyLookDelta` usa signo normal positivo, ajustable con **Invertir giro horizontal**; prueba unitaria y en Chromium de swipe derecho |
| Cámara vertical | Pitch se modificaba de golpe por evento, sin amortiguación común con teclado | `followLook` interpola yaw y pitch con `1-exp(-response*dt)`, insensible a FPS, restringido a ±1.1 rad |
| Ajustes | Controles de cámara escondidos en diagnóstico y demasiado técnicos | Panel visible «⚙ Cámara» con sensibilidad, inversión y calidad 3D; preferencias de giro guardadas en `localStorage` sin afectar progreso |
| Toque y arrastre | Un `pointercancel` o pérdida de foco podía dejar entradas residuales | Captura por puntero, `lostpointercapture`, reinicio de objetivo al desenfocar |
| Puertas y movilidad | Los pasos estrechos y una geometría de pasillos dificultaban maniobrar | Se conserva el movimiento por subpasos y el autoapertura de puertas ordinarias; dormitorio permanece bloqueado hasta resolver los dos puzzles. Test de escaleras arriba/abajo y accesos |
| Fluidez GPU | Se pintaba una escena pausada hasta 60 FPS y no había adaptación por caída sostenida | 15 FPS en pausa/orientación bloqueada; reducción automática estable a calidad «fluido» tras 3 s de rendimiento bajo; opción manual en HUD |
| Entrada a la casa | El nivel comenzaba con un modal de instrucciones en vez de una escena | Se construyó **un hueco real en la ventana** al sur del salón, con alféizar, marco y cortinas. Cámara animada desde fuera, través de ventana hasta suelo seguro, texto y salto opcional. Se omite en checkpoint de pruebas o movimiento reducido |
| Texturas y iluminación | Superficies uniformes o repetición rudimentaria de patrones | Shader WebGL1 con motivos anclados a coordenadas mundiales: yeso, vetas de madera, juntas de azulejos, tejido, follaje y metal; iluminación ambiental cálida y niebla más suave |
| Detalle ambiental | Habitaciones muy vacías | Macetas, hojas, molduras, cortinas, alfombras, marcos, faroles, papeles y cuadros. Mayoría con `solid:false` para no obstruir rutas |
| Portada | Imagen estática además de unas pocas partículas; no tenía melodía propia | Pétalos adicionales, respiración sutil de la ilustración y **motivo pentatónico original procedural** que comienza en un gesto de PLAY y respeta silenciado. `prefers-reduced-motion` desactiva movimiento |

## Geometría de ventana y cinemática

La ventana ubicada en `x≈10.2,z≈10` ya no corresponde a una pared completamente cerrada. El alféizar queda por debajo del nivel de la cámara, y el hueco libre entre `y≈0.8` y `y≈2.15` deja pasar la toma. La función `windowIntroCamera(t)` recorre `z≈11.48` a `z≈9.38`; el primer fotograma jugable corresponde a `WINDOW_LANDING=(x=10.20,z=9.38,y=0)` con yaw hacia el interior. El estado final se valida con el detector de colisiones de la casa. El jugador no queda atrapado en la pared.

**Límite:** el paso por la ventana es una secuencia de cámara dirigida, no una animación esquelética de cuerpo completo ni física interactiva de salto. En el juego normal ya dentro de la casa no se teletransporta entre habitaciones o plantas; las escaleras conectan físicamente las plantas.

## Materiales y coste

No se cargan texturas remotas ni plugins externos: el shader ya existente asigna `vStyle` por material y usa coordenadas mundiales con motivos deterministas, para evitar que las vetas y juntas se deslicen con la cámara. WebGL1/GLSL ES1 mantiene la misma precisión `mediump float` en vertex y fragment. Hay más triángulos estáticos, pero son pocos respecto al presupuesto de 16 bits; no se usan sombras dinámicas ni posprocesado de pantalla completa.

El modo «Detalles» prioriza nitidez; si cae de forma persistente por debajo de 37 FPS durante tres ventanas sucesivas de un segundo se activa «Fluido», que baja resolución interna y limita render a 30 FPS para mejorar estabilidad. Pausas y orientación bloqueada limitan repintado a 15 FPS.

## Sonido y accesibilidad

El jingle de bienvenida se sintetiza con Web Audio a partir de notas originales y se programa **al pulsar PLAY**. No es posible garantizar reproducción automática previa: Chrome y Safari bloquean Web Audio sin interacción del usuario. La melodía no se reproduce si el perfil está silenciado. El sonido de ambiente del juego se mantiene en su propio ciclo de vida.

La intro de la ventana puede saltarse en cualquier momento mediante botón visible, y se omite por `prefers-reduced-motion` y al abrir checkpoints de prueba. El desplazamiento táctil sigue siendo multitouch: el joystick de la izquierda y la mirada en el lado derecho.

## QA ejecutable

```bash
npm ci
npm test
npm run build
npx playwright install chromium --with-deps
node tests/demo-browser.cjs
npm run test:browser
```

- `tests/camera-controls.cjs` verifica dirección, inversión, límites, estabilidad al soltar y equivalencia a 30/60 FPS.
- `tests/window-intro.cjs` verifica trayectoria, opciones de reducción de movimiento, hueco real y aterrizaje sin colisión.
- `tests/house-navigation.cjs` comprueba escaleras, acceso a habitaciones y movimiento barrido.
- `tests/demo-browser.cjs` comprueba en Chromium la intro, el salto, swipe a la derecha, pausa del giro, objetos y rescate final.
- `tests/browser.cjs` protege el regalo original, música, niveles, escenas, rotación, pantalla completa, efectos e interacción.

**Limitaciones:** Chromium con emulación móvil no equivale a Safari en un iPhone físico ni prueba el tacto humano. Tampoco se ha demostrado un mínimo de FPS en todos los móviles; por eso existen selector de calidad y ajuste automático. Los assets isométricos del kit son referencias artísticas, no mallas 3D importables.

## Criterios de publicación

La rama solo debe fusionarse con CI verde; el pipeline de Firebase escucha únicamente `main`, y su confirmación final se obtiene del resultado de `Publicar Valeteamo en Firebase`. No copiar claves Firebase a este repositorio.
