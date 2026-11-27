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
