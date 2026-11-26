# ValeTeAmo V3 — seguimiento de desarrollo

Rama: `feature/v3-hud-interaccion-hop`. Base: `f1ba942264d3f98bc501bd144886ae76fc776b65`. No fusionar a main, publicar en Firebase ni modificar el juego clásico 2D hasta revisión del propietario.

**Estado: implementación de las fases 1–4 en la rama; fase 5 de auditoría iniciada. No declarar ninguna fase aprobada hasta tener CI verde y revisar sus evidencias.** El entorno de chat no permite clonar GitHub directamente ni ejecutar navegadores locales, por lo que la comprobación se delega a los workflows existentes, sin despliegue.

| Fase | Implementación | Comprobación pendiente |
| --- | --- | --- |
| 1 — HUD e interacción | Acción contextual permanente, inventario desde Ajustes/tecla I, lanzamiento único, salto de cámara acotado. Corregido el debounce que podía perder el lanzamiento. | CI del SHA final, accesibilidad, captura de HUD antes/después, teclado y táctil. |
| 2 — Emy | Etiqueta proyectada 1 s, espera 180 s y nueva mirada; panel de cuatro tarjetas, cierre, bloqueo de entradas y cooldowns. | Evidencias de etiqueta y tarjetas, Safari, foco y sonido. |
| 3 — Distracción | Miniatura 3D por proyección ortográfica SVG de geometría real, rotación/inclinación/zoom/pellizco/restablecer, exterior y cortes de dos plantas, lista accesible, motivos de destinos inválidos, marcadores de actores reales (amenaza únicamente con escaneo activo). No añade contexto WebGL. | Interacción táctil y ratón real, comprobación visual de cubierta, planos y marcadores, rutas y limpieza. |
| 4 — Casa | Árbol low-poly en sala de música, luces de emisión lenta integradas en el shader, regalos, nuevo emplazamiento del mueble de la linterna, destornillador centrado. IDs y guardados conservados. | Límite 16 bits WebGL1, alcance físico de los puzles, iluminación, capturas y restauración. Ubicación del árbol inferida a partir de la geometría del cuarto, no de una referencia fotográfica nueva. |
| 5 — Auditoría | Pruebas de lógica, rendimiento, producción, Chromium móvil/escritorio y WebKit, recorridos, guardados, 2D y RC preparados. | Resultado del commit final, revisión de capturas reales y cualquier corrección adicional. |

## Evidencias y criterios de cierre

- La primera revisión de la fase 1 confirmó `npm ci`, `npm test`, rendimiento, compilación, historia 2D, Chromium móvil, controles y escondites. WebKit falló al lanzar; se corrigió el orden del debounce y se añadió cobertura. No extrapolar ese PASS al SHA posterior.
- Las comprobaciones intermedias pueden cancelarse al enviar nuevos commits a la misma rama. Validar específicamente el último SHA.
- Los workflows existentes "Validar habilidades de Emy (sin desplegar)", "ValeTeAmo V2 — auditoría integral (sin publicar)" y "Verificar experiencia cósmica (sin publicar)" generan las evidencias. Revisar los ZIP de artifacts, incluyendo la miniatura, HUD y nueva captura del árbol.
- Confirmar que todos los puzles siguen alcanzables, que no hay errores de shader o WebGL1, que Emy no atraviesa muros, que los controles no se superponen en horizontal y que el jugador puede completar los dos finales. Revisar especialmente WebKit y iPhone real.
- El salto es exclusivamente visual: no altera las coordenadas físicas, guardados, IA ni detección. La miniatura usa la posición real del mundo mientras está pausado; no muestra un perseguidor no escaneado.
- El 2D, los identificadores de objetos, el formato de guardado y los destinos de producción no deben cambiar.
- Mantener el PR en borrador hasta la revisión final; ni merge ni deploy automáticos.


## Segunda pasada de calidad — antes de la fase 5 definitiva

Base de evidencia: commit `aca535007ff95d09b4273509929301035c9a49c9` y [auditoría integral](https://github.com/lugal3/valeteamo/actions/runs/45716910531). Código, puzles, colisiones, compilación, controles móviles, historia 2D, RC, guardados, producción 3D, escondites y Emy escritorio pasaron. Emy móvil y WebKit fallaron por una miniatura de solo 130,5 px de altura en 844 × 390. Los artifacts reales de móvil, escritorio y checkpoints fueron descargados e inspeccionados. También mostraban las tarjetas de Emy en tres filas, botones de navegación apilados, borde derecho recortado y guirnaldas parcialmente ocultas.

### Correcciones efectuadas

- **F1:** el lanzamiento sigue siendo único. La mano ocupada impide equipar y usar un segundo objeto, y suspende el haz de la linterna sin perder la selección ni el inventario. El menú de inventario reemplaza al teléfono en lugar de apilar diálogos. El salto cancelado no se reactiva ni salta su cooldown.
- **F2:** cuadrícula 2 × 2 real, X correctamente anclada, iconos de pausa/sonido, etiqueta con entrada/salida suave y sin reinicio de animación por fotograma, cooldown durante juego activo, restauración de foco y cierre seguro ante pérdida de contexto.
- **F3:** mapa limitado a la zona segura, controles de 44 px en paisaje de 390 px, navegación horizontal, proyección ajustada a los límites reales, zoom independiente del encuadre, colores compartidos e iconos de habitación, marcadores en escaleras, caché de destinos mientras la casa está pausada, conservación del desplazamiento y cancelación de punteros. Validación de objetivos finitos y sobre suelo real, rechazo de trayectos que cruzan puertas bloqueadas y llegada con último tramo libre de paredes.
- **F4:** guirnaldas y luces desplazadas hacia la superficie del follaje; referencia real de la linterna restaurada, marcador discreto limitado por alcance y línea de visión. Geometría indexada y IDs de puzle conservados.
- **Pruebas añadidas:** interrupción del salto, ocupación de manos, nombre de Emy y cooldown, ajuste de cámara/zoom, ausencia de amenazas sin escaneo, llegada bloqueada por pared, cuadrícula y límites del mapa, arrastre de ratón y captura de la etiqueta.

Los resultados de los commits intermedios no certifican el código nuevo. Antes de dar la fase 5 por cerrada, revisar los workflows del último commit y las nuevas capturas; no fusionar ni desplegar mientras haya fallos o evidencia insuficiente. El último commit de código y pruebas de esta pasada es `2cafc78f93fc356fdd3fa0f92ff43867372926bd` (posterior a la captura original). Las capturas de referencia son del commit anterior, no constituyen prueba visual de las correcciones.
