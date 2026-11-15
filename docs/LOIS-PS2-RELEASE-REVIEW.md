# Lois PS2 opción B — informe de cierre de fases 1–6

**Proyecto:** ValeTeAmo, casa 3D (NPC de rescate Lois, identificador técnico `louis-companion`).  
**Rama:** `feature/lois-ps2-option-b-rig`  
**PR:** [#23 — borrador](https://github.com/lugal3/valeteamo/pull/23)  
**Prueba de referencia:** [GitHub Actions #43767296452](https://github.com/lugal3/valeteamo/actions/runs/43767296452) — **aprobada**  
**No fusionado / no desplegado**: `main` y Firebase Hosting siguen sin recibir estos cambios.

## Entrega

- Modelo visual PS2-B reversible: blazer oscuro, camiseta clara, cabello castaño, cara low-poly continua con superficie UV ilustrada original.
- Animación por jerarquía de 21 pivotes; ojos, cejas, labios, brazos, piernas y agacharse. Retarget del flujo real `untying → climb → hide → hidden → follow`.
- Reacciones visuales discretas sin inventar diálogo; hooks disponibles para `look-kitty`, `listen`, `startle`, `relief`, `speak`, `reach`.
- Director de cámara durante el rescate, con corte a posiciones previamente seguras, mezcla breve al cambiar de toma y corte inmediato al volver a Kitty si las cámaras están en plantas diferentes.
- Renderer WebGL1 de la casa **conservado**, sin otro motor ni segundo loop. Geometría generada al construir la escena; UV cargada solo cuando aparece Lois.

## Pruebas ejecutadas y resultado

| Prueba | Resultado |
| --- | --- |
| `npm test` (incluye 2D clásico, mundo de rescate, casa y animaciones) | Aprobado |
| `npm run build` (TypeScript + Vite) | Aprobado |
| `tests/lois-ps2-profile.cjs`, `lois-ps2-mesh.cjs`, `lois-ps2-uv.cjs` | Aprobados |
| `tests/lois-ps2-rig.cjs`, `lois-ps2-cinematics.cjs`, `tests/rc-car.cjs` | Aprobados |
| `tests/lois-ps2-browser.cjs`: malla, atlas, fallback, ojos, expresiones y capturas WebGL1 | Aprobado |
| `tests/lois-ps2-stress-browser.cjs`: 150 fotogramas, calidad baja/media, entrada/salida | Aprobado |
| `tests/rc-browser.cjs`: rescate real, sótano, barra, auto RC, perseguidor, trampa y final | Aprobado |

Archivo del pipeline: `lois-ps2-b-stage6-final-qa`, con capturas PNG y `lois-phase6-stress.json`.

## Rendimiento medido

Ambiente **Chromium con SwiftShader (software)**, viewport móvil **812 × 390**, DPR 2. **No equivale a un iPhone físico ni certifica FPS reales.**

| Indicador | Medición |
| --- | ---: |
| Ensayo de fotogramas | 150 |
| Muestras de rig | 150 (una por fotograma) |
| Subidas GPU del modelo durante movimiento | 150 (máximo una por fotograma) |
| Subidas GPU de una pose idéntica | 0 |
| Máximo transferido por fotograma | 273.088 bytes |
| Mediana CPU `updateDynamic` | 0,2 ms |
| P95 CPU `updateDynamic` | 0,6 ms |
| Triángulos del escenario de ensayo con Lois | 3.496 |
| Vértices del escenario de ensayo con Lois | 4.315 |
| Atlas facial modo fluido | 512 × 512 RGBA ≈ 1 MiB |
| Atlas facial modo normal | 1024 × 1024 RGBA ≈ 4 MiB |
| Reingreso tras destruir el renderer | Aprobado |
| Recuperación de modelo anterior | Aprobada |
| Errores de WebGL informados | 0 |

Los 3.496 triángulos incluyen un escenario diagnóstico pequeño; `tests/lois-ps2-mesh.cjs` mide únicamente al personaje con 3.472 triángulos en móvil y 6.376 en la variante escritorio. El juego utiliza actualmente la **malla móvil** para el personaje en todos los dispositivos; sus otros objetos tienen presupuestos separados. El tiempo CPU mide únicamente `updateDynamic` y no contiene render, rasterización, sombras, entrada táctil, audio, ni tiempo de pantalla.

## Pasos para revisión manual (antes del merge)

- En iPhone real, probar Safari en calidad normal y modo fluido, controlar temperatura/memoria, giros, orientación, bloqueo/desbloqueo y cambio de pestaña.
- Iniciar la historia 3D y completar manualmente: desatar a Lois, subida, escondite en cocina americana, recoger/desplegar RC, perseguir al secuestrador, cerrar la escotilla y escapar.
- Ver rostro frontal / perfil / 3⁄4 con luz natural y linterna, revisar que flequillo, boca y párpados no atraviesen la cara.
- Revisar la unión del blazer y extremidades en poses extremas: el rig es **rígido por pieza**, no deformación suave por pesos.
- Revisar si la ilustración PS2 se parece suficientemente a la **opción B**. **No** es un mapa facial fotográfico exacto; sería posible sustituir el atlas por uno licenciado y correctamente alineado en una iteración posterior.
- Inspeccionar el modelo anterior, la entrada al 2D clásico y los mensajes del teléfono (Luis no aparece como personaje 3D).
- Probar interrupción real de WebGL por el sistema: la casa informa que se perdió el contexto y ofrece salir; **no se implementó restauración automática in situ**.
- Verificar los resultados CI de la última revisión del PR antes de permitir la fusión.

## Rollback y despliegue controlado

**Antes del merge:** la versión pública no ha cambiado. Se puede abandonar el PR sin consecuencias para la publicación.

**Cambiar solo el modelo de Lois dentro de la rama:** indicar `visualVariant:'legacy'` en el objeto `louis-companion`, reconstruir geometría, y mantener los estados de rescate. El fallback no invoca el rig PS2. No borrar las funciones existentes.

**Si se decide fusionar en el futuro:** crear una etiqueta/commit de referencia de `main`, aprobar el PR, fusionar, comprobar el workflow de Firebase que se ejecuta tras el push a `main`, y probar el juego público en móvil. Si hay regresión, revertir el merge en GitHub para volver al estado estable; no publicar manualmente desde esta rama.

## Límites y pendientes no bloqueantes

El parecido facial y las uniones musculares son artísticas, no fotorrealistas. No se midieron FPS en iPhone real ni consumo de memoria del sistema operativo; tampoco hay restauración automática WebGL tras pérdida de contexto. Esas comprobaciones requieren navegador/dispositivo real. El PR permanece en **borrador** para revisión y aprobación expresa.
