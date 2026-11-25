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
