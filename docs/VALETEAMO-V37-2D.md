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

## Bloque A — identidad y alimentación
- Ruta principal 3–5 min orientativos, opcionales 5–8; mantener todas las mejoras previas sin obligar desvíos.
- Revisión de proporciones Vale/Luis según tarjeta; no prometer identidad exacta hasta revisar capturas. Louis toma como referencia estética One Direction 2012–13 (flequillo castaño lateral, ojos azules, rayas y pantalón rojo), 18 cuadros en tres direcciones, retrato de la misma textura; solo se registra en escena del prólogo.
- Alimentación Emy: tarjeta compacta sobre jardín visible, retrato protagonista, instrucción y progreso simplificados, controles de arrastre/teclado y duración intactos. Prueba de disposición en móvil y test de cuadros. Auditoría anterior: código/2D correctos, 3D-checkpoints falló; no se modifica el 3D sin permiso.

## Bloque A iteración 2 + inicio B
- Se elimina tarjeta opaca de Emy: escena sobre jardín, PNG originales idle/blink/lick/love, respiración, curiosidad, lamidos, salto alegre, burbuja y corazones. No se modifican imágenes originales ni el contrato de alimentación. Prueba de overlay y sprite real.
- Seis interacciones opcionales de los caminos laterales con reacción, sonido y observación; sin modal, sin alterar etapas ni requerir desvíos. Se recuerdan durante la sesión de Phaser; persistencia entre recargas pendiente. Prioridad de interacción principal y vehículo, sin opcionales en combate.

## Bloques B/C — continuidad y pistas
- Descubrimientos opcionales persistentes en el guardado del prólogo (IDs validados, deduplicados, compatibles con versión 2 y guardados antiguos), sin alterar objetivos o claves.
- Louis sigue migas de la trayectoria real con colisiones y velocidad acotada, mira a Kitty al parar, parpadea y reacciona al paseo sin diálogo obligatorio.
- Pulsera, pétalos pisados y huellas de ruedas dibujados como objetos físicos; destello discreto por proximidad o tras 12 s. El objetivo y las etapas se conservan. Pruebas geométricas y de migración agregadas; pendientes CI y revisión visual.

## Actuaciones sincronizadas
El interlocutor activo de la burbuja controla la pose real de los personajes. Luis deja de mover la boca mientras habla Vale; Vale tiene 3 cuadros de habla y Louis 2 cuadros adicionales por dirección. Los retratos siguen siendo los sprites reales y el diálogo no cambia de longitud. Pruebas de alternancia en navegador añadidas.

## Bloque D — ritmo y continuidad audiovisual
- Seis bloques de presentación: tres capítulos cálidos, interludio, investigación y casa. Sin etapas extra ni pantallas de espera. Títulos iniciales no revelan el 3D.
- El jardín no recupera su iluminación alegre tras el secuestro; el oscurecimiento enlaza con el bosque. Limpieza de tweens de marcadores al cambiar etapa y reacción breve durante la fuga.
- Corregida la prueba de integración que esperaba el antiguo seguimiento por píxeles: exige el nuevo seguimiento en coordenadas del mundo y su conexión efectiva al sprite; se mantienen pruebas geométricas de ruta y colisión. No se toca el 3D.
