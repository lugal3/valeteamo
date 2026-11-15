# ValeTeAmo · Renovación integral del rescate 2D en 3 fases

**Protocolo del usuario:** comenzar la fase 1 ahora; al terminar cada fase se comunica estado y se **espera un solo punto `.`** antes de implementar la siguiente. Las fases 1–2 permanecen en una rama dedicada sin fusionar `main` ni desplegar Firebase. La fase 3 comprende la validación visual integral, mezcla final y publicación **solo si todas las pruebas pasan**.

## Protección de lo existente

- **NO modificar el modo original `2D · Corazones`**: cámara, controles, progresión, disparos y economía/combate.
- No eliminar ni reescribir las escenas 3D, animación de ventana, modelo Kitty/Luis/Louis, secuestro con furgoneta LUNA-07, las 4 escenas de rescate o sus puzzles.
- Modificar `IsoAdventure` *solo dentro de `this.story`*, con utilidades testeables puras. Respetar teclado, joystick móvil, mouse, pausa, `prefers-reduced-motion`, y limitación de partículas/sonido.
- Sin descargas externas de assets ni música protegida. Pixel art y audio originales.
- No aumentar cantidad de diálogos: la redacción la agregará el usuario después.

## Fase 1 — Game feel, movimiento y reacciones (EN IMPLEMENTACIÓN)

- Movimiento de Kitty con aceleración y frenado graduados, velocidad máxima estable en FPS variables, joystick de baja intensidad preciso y respuesta inmediata al dar vuelta. **La guía A* a puerta, ventana y furgoneta se mantiene funcional.**
- Animaciones de caminar según velocidad, cambio de dirección natural, respiración y parpadeo en idle, ligera inclinación, rebote al detenerse y anticipación leve de cámara. Sin mareos, y se respeta `prefers-reduced-motion`.
- Pisadas discretas adaptadas al suelo (hierba, madera, tierra, piedra, asfalto); huellas/pequeño polvo de vida breve, límites estrictos y sin afectar el arcade clásico.
- Interacciones contextuales con orientación del personaje hacia el objeto y gesto corto de examinar/tocar, señales suaves de confirmación, botón suficientemente grande para tocarlo en iPhone.
- Seguidor Louis natural y estable: no hace moonwalk constantemente cuando Kitty se detiene, guarda separación, acelera suavemente y usa poses correctas.
- Tests: lógica pura a 30/60 FPS, cámara limitada, colisiones, guía manual, comportamiento de seguidor, idle y accesibilidad; regresión móvil/PC/3D en CI. **No iniciar fase 2 sin `.`.**

## Fase 2 — Mundo vivo (PENDIENTE: primer punto)

- Cuatro biomas diferenciados: ramas/vegetación que se mecen; flores que reaccionan al pasar Kitty; río con reflejos y ondas; mariposas, aves y animales tímidos, hojas y pétalos con sentido del viento.
- Capas de profundidad, iluminación de tarde, niebla y luciérnagas, faroles nocturnos, iluminación suave de casas y ventanas, sonido ambiental localizado que se mezcla sin cortes.
- Eventitos pasivos no repetitivos sin forzar diálogos; determinismo y recuentos máximos por pantalla para móviles.
- Respetar atmósfera: mañana romántica → tarde cálida → crepúsculo misterioso → vecindario inquietante.

## Fase 3 — Personajes, escenas y cine (PENDIENTE: segundo punto)

- Gesto y mirada contextual de Kitty, Luis y Louis; NPC que observan objetos/se acercan/se detienen; burbujas simples no bloqueantes en lugar de muchas conversaciones.
- Transiciones suaves, mejores planos, ritmo y coreografía: combate, diálogo, aparición/despedida de Luis, secuestro con van zorro/conejo, investigación de pulsera/pétalos/huellas, hallazgo del vehículo LUNA-07 y ventana a la casa 3D.
- Señales narrativas ambientales y eventos breves variables; coherencia entre geografía isométrica y exterior 3D.
- QA visual y funcional exhaustivo iPhone/desktop, controles, accesibilidad, rendimiento, continuidad 2D→3D y regresión Corazones original. Recién al aprobar: merge a `main`, verificar Action de Firebase Hosting y comunicar enlace final.

## Seguimiento

- Fase 1: iniciada; no publicar ni fusionar todavía.
- Fase 2: pendiente de `.`.
- Fase 3: pendiente de un segundo `.`.
