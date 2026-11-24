# ValeTeAmo V2 — auditoría de integración y criterio de publicación

**Rama de trabajo:** `feature/valeteamo-v2-game-feel-integral` · **PR:** [#39](https://github.com/lugal3/valeteamo/pull/39)

**Estado:** **NO PUBLICAR / NO FUSIONAR** hasta resolver fallos, ejecutar recorridos y revisar evidencias. Esta auditoría no sustituye las comprobaciones físicas en iPhone/PC.

## Matriz automatizada

| Sistema | Validación | Evidencia esperada |
| --- | --- | --- |
| Código y migración de guardados | `npm test` | Todas las pruebas unitarias y de integración sin fallos |
| Rendimiento de IA, Auto RC y sótano | `npm run test:perf` | Rutas y simulaciones sin regresiones |
| TypeScript + Vite + iconos | `npm run build` | Compilación de producción sin errores |
| 2D clásico y prólogo | `node tests/prologue-browser.cjs` | Cuatro mapas, Churu, secuestro, LUNA-07, ventana y carga 3D |
| Inventario, checkpoints y final | `node tests/house-checkpoint-browser.cjs` | No perder progreso en recarga |
| RC, secuestrador y Louis | `node tests/rc-browser.cjs` | Señuelo, trampilla, escape y final |
| Persecución y escondites | `node tests/house-threat-browser.cjs` | Sin bloqueos de Emy/Kitty ni capturas falsas |
| Joystick, teclado, ratón y giro | `node tests/house-input-browser.cjs` | Interacciones válidas en móvil y PC |
| Versión compilada | `node tests/house-css-production-browser.cjs` | Canvas 3D visible y recuperable |
| Emy en Chromium móvil/escritorio | `node tests/emy-abilities-browser.cjs` | Distracciones, pisos, objetos, accesibilidad, limpieza |
| WebKit (aproximación de Safari) | `EMY_QA_ENGINE=webkit node tests/emy-abilities-browser.cjs` | Sin errores de WebGL1 ni controles invisibles |

La matriz paralela se encuentra en [`.github/workflows/valeteamo-v2-release-qa.yml`](../.github/workflows/valeteamo-v2-release-qa.yml). Es **solo de lectura/prueba**: no contiene comandos de merge ni deploy. Los flujos existentes de Emy y cosmos continúan ejecutándose por separado.

## Problemas observados y acciones

- Fase 08: faltaba la declaración de tipos del nuevo módulo de actos; corregido con `src/demo/prologue-beats.d.ts`.
- Fase 09: giro excesivo de Louis detectado en pruebas de lógica; limitado a una velocidad angular máxima.
- Fase 06/11: la prueba de Emy esperaba dos botones lanzables, pero existe un tercero («Lanzar suave»); actualizada para comprobar las tres acciones.
- El navegador del test de emotes quedó esperando una navegación tras entrar en pruebas; ahora verifica explícitamente la preparación del escenario.
- Fase 05: la decoración dinámica saturaba el presupuesto de vértices WebGL1; elementos de cortina/polvo permanecen **estáticos** hasta una solución de rendimiento verificada.

## Pendientes antes de cualquier integración

- Revisar **resultados definitivos**, logs y capturas de **cada job** del flujo integral y de los flujos Emy/cosmos; reparar los fallos reales y ejecutar nuevamente el conjunto.
- Recorrer en un **iPhone físico** (Safari horizontal, pantalla con notch, audio habilitado, multitáctil) y en **PC** (ratón capturado, teclado, escala del navegador), con evaluación visual de cámara/cinemáticas.
- Revisar las funcionalidades aún incompletas de las fases 04–11, especialmente movimiento ambiental seguro, suspensión del RC y tácticas coordinadas Emy/RC.
- Confirmar autoría/permisos de audios, fotos, referencias y contenido personal antes de entregar.
- Obtener aprobación del propietario del juego antes de fusionar a `main` o publicar en Firebase.

**Criterio de éxito:** todo el recorrido de «Corazones» → historia 2D → secuestro → pistas → casa 3D → puzles → rescate → señuelo/trampa → salida debe completarse sin atajos de prueba, pantallas en blanco, cuelgues, pérdida de progreso ni regresiones de rendimiento.
