# Lois 3D — opción B / plan de implementación escalonada

**Rama de trabajo:** `feature/lois-ps2-option-b-rig`  
**Base:** `e06061c55490b49709d697fe21becb24cc5ba0aa` (main, 15 nov 2026).  
**Estado:** fases 1–6 implementadas y verificadas en rama. PR de revisión [#23](https://github.com/lugal3/valeteamo/pull/23) en borrador, sin merge a `main` ni publicación Firebase. Ver [`LOIS-PS2-RELEASE-REVIEW.md`](./LOIS-PS2-RELEASE-REVIEW.md).

## Alcance y separación de identidad

- **Lois** (en el código heredado se identifica como `Louis` / `louis-companion`) es el NPC que Kitty rescata; su modelo 3D sí cambia.
- **Luis** (novio de Kitty) participa solamente por mensajes del teléfono **en el flujo 3D**. No introducir un modelo 3D ni ropa, rig, cámara o texturas para Luis. Hay arte heredado del prólogo 2D que se auditará por separado; no destruir el 2D clásico ni su historia en esta tarea.
- La **opción B** elegida muestra una persona joven de rostro estrecho, cabello castaño despeinado, ojos azulados, barba muy tenue y atuendo oscuro: blazer, camiseta clara, pantalones oscuros. **La imagen generada es referencia visual, no una malla importable ni una textura UV real**.
- Prohibido añadir fotografías de Pinterest como texturas finales directamente. Preparar UV a partir de una referencia autorizada o arte derivado original, evitando costuras y deformaciones.
- **No modificar main**, no publicar Firebase ni fusionar sin completar verificación y autorización expresa.

## Inventario auditado al inicio

| Responsabilidad | Módulo | Observación |
| --- | --- | --- |
| Estados, recorrido y rescate | `src/lab/louis-escape.js` | `untying → climb → hide → hidden → follow`, caminar, mirar, parpadear, desatar, seguimiento |
| Modelo antiguo | `louisModel` en `src/lab/louis-escape.js` | Partes independientes con colores; rostro sin textura fotográfica |
| Modelo a geometría de escena | `src/lab/pickup-models.js` | Enlaza el modelo con la geometría de objetos |
| Actualización visual | `HouseRenderer.updateDynamic` en `src/lab/renderer.js` | Modifica transformaciones de piezas en VBO dinámico, sin skinning humano |
| Sombras / materiales | `src/lab/material-shaders.js`, `materials.js` | WebGL1, atlas de materiales; no hay atlas facial dedicado |
| Cine, rescate y UI | `src/lab/house.js` | Debe conservar su flujo |
| Regresión funcional | `tests/rc-car.cjs` | Prueba cambios de fase, parpadeo, hombros y ocultarse |
| Pruebas visuales | `tests/house-production-browser.cjs` | No ejecutar reemplazo en main |

## Fases (una por “.”)

### Fase 1 — Auditoría y contrato técnico (completada)
- Rama aislada y contrato de identidad visual PS2 B (`src/lab/lois-ps2-profile.js`).
- Especificación de proporciones, paleta, límite de triángulos, atlas, esqueleto humano y canales expresivos.
- Adaptador determinista que muestrea las fases existentes sin alterar lógica o posición; metadato `visualPreset` no cambia el dibujo.
- Test automático sin navegador y flujo CI exclusivo de rama; el modelo original debe renderizar igual.
- **Criterio de salida:** `npm test`, `npm run build`, prueba del contrato PS2 y `tests/rc-car.cjs` aprobados. Ningún asset nuevo en producción.

### Fase 2 — Geometría PS2 B alternativa (implementada; QA en la rama)
- Construir cuerpo low-poly: blazer oscuro, camiseta, pantalón, zapatos y manos, silueta y proporciones del diseño elegido.
- Cara en malla continua (no 20 volúmenes superpuestos) con nariz, barbilla, pómulos y labios; cabello por mechones simplificados.
- Conmutador reversible antiguo/nuevo **solo en la rama**; validación frontal, perfil, 3/4, fondo iluminado y oscuro.
- Presupuestos diferenciados móvil y escritorio. **No reemplazar definitivamente hasta pasar visuales**.

#### Implementación y verificación de la fase 2

- Modelo alternativo: `src/lab/lois-ps2-model.js`, silueta de adulto esbelto, blazer oscuro con solapas y bolsillos, camiseta clara, pantalón oscuro, zapatos y flequillo castaño lateral.
- Cabeza nueva: `src/lab/lois-ps2-face.js` aporta **una sola superficie paramétrica** con mandíbula, nariz, pómulos, labios y mentón modelados; `u=0.5` corresponde al frente, y la costura UV está atrás. Hay ojos y pelo como capas de geometría, no múltiples esferas para la cara.
- Integración: `geometry()` reconoce `shape:'lois-face'`; `pickupGeometry()` selecciona PS2-B cuando `visualPreset=lois-ps2-b-v1`; `louisPartPose()` conserva el movimiento de todas las piezas usando `rigGroup` y `rigSide`.
- Reversión: **establecer `visualVariant:'legacy'` en el NPC y reconstruir la geometría** para volver al modelo anterior, sin modificar guardados ni lógica. La función `louisModel(piece)` sin opciones sigue creando el modelo heredado.
- Presupuestos medidos por `tests/lois-ps2-mesh.cjs`: **3.472 triángulos / 4.267 vértices** móvil y **6.376 triángulos / 8.245 vértices** escritorio. La integración actual escoge el preset móvil para todos los dispositivos, como opción conservadora. El modelo antiguo suma más triángulos y se mantiene como respaldo.
- `tests/lois-ps2-browser.cjs` usa Vite/Playwright/SwiftShader y genera capturas del propio renderizador WebGL1, con vista frontal, perfil, 3/4, primer plano y modo fluido, además de un control con el modelo antiguo. La iluminación de las capturas es diagnóstica, no representa todas las condiciones de la casa.
- El objetivo **todavía no** es parecido fotográfico definitivo: sin el atlas UV de fase 3, la cara es geométrica con colores planos, y la pose sigue usando la animación procedimental anterior (rig completo en fase 4). No presentar esta fase como textura final o modelo perfectamente igual a la referencia.

### Fase 3 — UV y texturas faciales (completada técnicamente; semejanza definitiva por mejorar)
- Desplegado UV estable para rostro/orejas/cuello, mapas sRGB; 512 px móvil y 1024 px escritorio si el dispositivo lo soporta.
- Usar referencias de rostro autorizadas para crear una textura cohesionada (ojos, cejas, labios, stubble); no pegar pantallazos completos.
- Integrar textura en el renderizador WebGL1 sin asignar texturas nuevas por cuadro; fallback a color si el asset falla.
- Comparar con las cuatro fotos de referencia y la **opción B** para likeness sin artefactos, incluyendo perfil.

#### Implementación, memoria y limitaciones de fase 3

- **Atlas propio**: `src/lab/assets/lois-ps2-face.svg` — piel, pómulos, sombras de ojos, puente nasal, labios, pecas y barba tenue; ilustración retro creada para el juego, **no fotografías de Pinterest copiadas**.
- **UV real**: `src/lab/lois-ps2-face.js` marca exclusivamente la malla facial como material de rostro `vArt=3` y conserva la costura longitudinal en la parte posterior. Ojos, pestañas, orejas y cuello mantienen primitivas de color; sus animaciones y la opción anterior no cambian.
- **Integración**: `src/lab/lois-ps2-texture.js`, `material-shaders.js` y `renderer.js` incorporan un sampler WebGL1 dedicado en la unidad 4. La TV continúa usando la unidad 3; sin nuevo motor ni draw calls por la cara.
- **Carga diferida**: SVG rasterizado una vez en un canvas temporal solo si se reconstruye la escena con la malla facial de Lois. En `low`: 512×512 RGBA ≈ 1 MiB de GPU; en `medium`: 1024×1024 RGBA ≈ 4 MiB. Sin mipmaps, `CLAMP_TO_EDGE`. La textura se destruye con el renderer y si falla se conserva color de piel.
- **Control visual**: al revisar capturas encontramos una regresión no detectada inicialmente: winding invertido en la superficie facial, que ocultaba la cara frontal. Se corrigió para igualar el orden de triángulos del motor. `tests/lois-ps2-uv.cjs` y `tests/lois-ps2-browser.cjs` verifican esta orientación además de capturas real WebGL, atlas cargado, LOD 512/1024, fallback y una sola subida GPU por modelo.
- **Lo que NO significa**: no es todavía un escaneo fotográfico ni un parecido facial exacto. El acabado es PS2 ilustrado basado en las fotos suministradas, no un collage fotográfico. La malla sigue animándose mediante piezas, no con skinning por huesos (fase 4). Para un acabado aún más fiel haría falta un atlas fotográfico autorizado y calibrado frontal/perfil que se podría integrar en este sampler sin tocar la lógica del rescate.

### Fase 4 — Rig, animación corporal y facial (completada técnicamente)
- Un rig anatómico con jerarquía de huesos, mirada, apertura de mandíbula, parpadeo real y expresiones (miedo, alivio).
- Retarget de los eventos existentes (`untying/climb/hide/hidden/follow`), caminar sin deslizamiento, girar, agacharse, respirar.
- Pruebas 30/60/120 Hz y `prefers-reduced-motion`; ninguna animación altera colisiones ni mecánica.

#### Implementación de fase 4

- `src/lab/lois-ps2-rig.js` convierte el contrato de 21 pivotes de fase 1 en matrices jerárquicas calculadas por CPU una vez por personaje y fotograma; cada pieza rígida tiene `rigBone` y la UV frontal permanece intacta.
- Retarget sin modificar la máquina de estados: desatar, subida, ocultarse, permanecer escondido y seguir a Kitty. Cintura/columna/cabeza, hombros/codos/muñecas, cadera/rodillas/tobillos, párpados y mandíbula tienen canales propios; ojos miran de lado y la piel de la barbilla recibe una deformación pequeña. El contacto de tobillos con el suelo tiene corrección vertical para limitar el deslizamiento y hundimiento.
- La implementación usa el VBO dinámico **ya existente** en `HouseRenderer.updateDynamic()`, sin crear un renderer, bucles RAF ni draw calls adicionales. Las transformaciones solamente alteran vértices y normales de Lois, **no posición física, colisiones, guardar partidas ni cámaras**.
- `src/lab/lois-ps2-model.js` asigna cada pieza a un hueso. Las piezas del modelo heredado carecen de `rigBone` y siguen usando `louisPartPose`, reversible sin cambiar la lógica.
- Pruebas `tests/lois-ps2-rig.cjs`: jerarquía, 21 huesos, 5 estados, parpadeo, mandíbula, seguimiento visual, modelos heredados, independencia del framerate 30/60/120 (mismo estado físico), integridad UV/normales y ausencia de mutación en datos del NPC.
- `tests/lois-ps2-browser.cjs`: capturas comparativas reales de distintos momentos del rescate, incluidas expresiones y parpadeo.

**Limitación expresa:** es un esqueleto jerárquico de **segmentos rígidos deformados por CPU**, no skinning suave con pesos por vértice. Sigue pudiendo mostrar separaciones menores en codos, hombros o rodillas; la fase 5 se dedicará a las transiciones y al encuadre de cinemáticas. No se afirma que esté probado en un iPhone físico, únicamente en navegadores automatizados.

### Fase 5 — Cinemáticas y preparación para ampliaciones (implementada en rama)
- Ajustar encuadres de desatar, subida del sótano, cocina americana y seguimiento para que el rostro sea visible.
- Añadir *hooks*, sin activar contenido narrativo inventado, para hablar, mirar a Kitty, reaccionar, manos y labios.
- Limpiar transiciones bruscas sin modificar rutas del puzzle ni comportamiento de Luis (teléfono).

#### Trabajo realizado en fase 5

- **Director de cámara aislado** (`src/lab/lois-ps2-cinematics.js`): conserva los puntos de vista seguros ya existentes del túnel y de la cocina americana, y suaviza los cambios entre desatar las cuerdas → subir las escaleras → buscar cobertura → quedar escondido. Aplica interpolación del ángulo por el recorrido más corto. El encuadre inicial corta directamente a un punto seguro para no atravesar paredes. El retorno a Kitty se suaviza solo cuando ambas cámaras están cerca; si separan plantas u obstáculos grandes, hace un corte limpio en lugar de volar por paredes.
- **Integración** (`src/lab/house.js`): el director se instancia al iniciar el rescate y se libera al reiniciar o devolver el control. Reutiliza el bucle de renderizado actual y el mismo tiempo de pausa; se anula la transición adicional con `prefers-reduced-motion`. No se cambian cámaras de la ventana, auto RC, llegada del secuestrador ni cierre final.
- **Reacciones reutilizables** (`src/lab/lois-ps2-reactions.js`): API de `look-kitty`, `listen`, `startle`, `relief`, `speak` y `reach`, con transiciones de entrada/salida y caducidad automática. Los cuatro primeros se activan en eventos originales: liberación, llegada a la cocina, escondite y retorno al seguimiento. `speak` y `reach` quedan como *hooks de animación* disponibles para añadir escenas futuras: **no se agregaron diálogos ni mecánicas inventadas**.
- **Rig y continuidad**: `sampleLoisRig()` combina esas reacciones con el parpadeo, mirada, cejas, articulación mandibular y brazos ya existentes, sin cambiar físicas ni posición del NPC; el modelo antiguo sigue disponible.
- **QA**: `tests/lois-ps2-cinematics.cjs` valida secuencias de estados y eventos idénticas, cámaras finitas, retorno seguro a Kitty, cortes al cambiar de piso, reacciones, respuesta a movimiento reducido y ausencia de movimiento físico durante gestos. `tests/lois-ps2-browser.cjs` captura distintas reacciones en el renderizador WebGL existente.
- **Limitación**: el sistema mejora encuadres y gestos, pero todavía no incluye captura de movimiento real, voz sincronizada, cinemáticas fotorrealistas ni evaluación en un iPhone físico. Las posibles separaciones de articulaciones y los fondos complejos siguen sujetos a revisión en la fase 6.

### Fase 6 — Optimización, QA y preparación de integración (completada técnicamente; pendiente aprobación y prueba en iPhone físico)
- Revisar FPS, memoria GPU, atlas, draw calls, colisiones y pérdidas de contexto WebGL en móvil.
- Pruebas funcionales y visuales, capturas reales o emuladas, análisis del diff contra main y plan de reversión.
- Dejar un PR revisable; **integración a main solo cuando el usuario apruebe**.

#### Cierre de fase 6

- Coalescencia de los segmentos contiguos del rig en **una subida VBO WebGL por fotograma animado**, evitando 60 transferencias diminutas; los segmentos sin cambios no se vuelven a subir si toda la pose es idéntica.
- Una evaluación de rig por NPC y fotograma. Invalidación de sombras limitada a una vez por NPC, sin modificar cámara física, colisiones ni juego 2D.
- Auditoría automatizada móvil de 150 fotogramas en **SwiftShader**, reingreso a la casa, calidad baja/media, destrucción/recreación de atlas, fallback legacy. Confirmada en CI [#43767296452](https://github.com/lugal3/valeteamo/actions/runs/43767296452).
- Flujo de rescate con auto RC real aprobado en `tests/rc-browser.cjs`, desde el sótano y escondite de Lois hasta la trampa y el desenlace.
- [Informe de entrega](./LOIS-PS2-RELEASE-REVIEW.md) con métricas, límites, pruebas en iPhone pendientes, instrucciones de rollback e integración controlada. PR en borrador hasta autorización expresa.

## Criterios innegociables

1. Conservar todos los estados del rescatado y sus eventos, diálogos y sonido.
2. No confundir Luis con Lois ni añadir representación 3D de Luis.
3. No tocar el juego clásico Corazones.
4. Sin cambio a secretos/credenciales, guardados existentes, Firebase ni despliegues en las fases de trabajo.
5. Perfil y malla alternativos, rollback simple; performance iPhone tan importante como parecido facial.
