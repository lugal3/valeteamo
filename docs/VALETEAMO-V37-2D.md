# V3.7 — 2D aventura narrativa

Base: V3.6 `a4e1fb5c`. Rama independiente. El arcade original, sprites de Luis, 3D, guardados y portales no se modifican en este bloque.

## Fase 1 — primer bloque
- Seis recorridos secundarios conectados a la ruta principal (dos por mapa de día/tarde/bosque).
- Límites del terreno, trazado visual y obstáculos de los nuevos lugares derivados de los mismos datos.
- Colisión y deslizamiento para los nuevos hitos; recuperación si un checkpoint queda dentro.
- Pruebas de continuidad y accesibilidad de objetivos existentes.
- Segundo bloque: mobiliario existente en registro común de colisión/dibujo, cache de obstáculos, recuperación de posiciones bloqueadas, barandas con profundidad local, tres fachadas vecinas con identidad y huellas físicas compartidas con A*. 
- Pendiente: revisión visual en navegador, ajuste de coherencia artística, cercas/ornamentos de borde y pruebas de rendimiento. No considerar la fase 1 cerrada sin esas comprobaciones.

## Fases siguientes
2. Guion, actuaciones, acompañantes y combate. 3. Investigación, descubrimientos, ecología, HUD y guardados. 4. Cinematografía, audio, handoff y auditoría completa. No fusionar hasta aprobación.

## Alcance actualizado por el usuario (27-11-2026)
El 2D es un prólogo breve y encantador que prepara un giro sorpresa al 3D, juego principal. Objetivo orientativo 3–5 minutos, sujeto a medición de partida real; sin relleno ni nuevas tareas obligatorias. Los caminos secundarios y futuras interacciones son opcionales. Conservar el flujo y guardados. No modificar ningún componente 3D, ni siquiera para reparar regresiones, sin autorización expresa previa. La referencia fotográfica de la tarjeta autoriza ajustar los sprites 2D de Vale y Luis: cabeza redondeada grande, pelo negro, rojo/verde, gafas Luis y suelas visibles Vale. Mantener dimensiones, anclas, claves de textura y poses existentes; no cambiar Louis ni arcade. Guion compacto revisado, conexión narrativa con teléfono sin modificar el teléfono. Pendiente revisión visual, medición de duración y validación del commit. Auditoría anterior: 2D y compilación correctos; dos fallos de navegador 3D (input y checkpoint), no se modificó 3D ni se presume causa.
