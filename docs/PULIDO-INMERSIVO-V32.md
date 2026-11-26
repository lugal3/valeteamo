# V3.2 · Cierre de pulido inmersivo

La rama de trabajo es `feature/v32-cinematic-animations`. No fusionar ni publicar hasta autorización explícita después de QA. El usuario enviará "." para continuar; cada turno debe abarcar todos los cambios razonables que puedan completarse sin sacrificar calidad.

## Alcance acordado

- Sombra real del secuestrador, crujidos de madera provisionales hasta disponer de grabaciones.
- Escondites: observar de forma controlada desde el armario o debajo de la cama; respiración discreta, natural cuando se entreguen WAV.
- Inspección de objetos: acercar, girar y observar notas, llaves y otros objetos relevantes, sin desvelar el acertijo del espejo.
- Patita de Kitty para confirmar guardados reales, transiciones de recuperación cuidadas.
- RC: inclinación, suspensión en escaleras, señal de tablet, interferencia, ruedas según suelo, sin cambiar alcance efectivo o la solución narrativa.
- No rehacer Emy, cortinas, lluvia ni añadir polvo. No sustituir puertas de madera existentes.

## Bloque A · Integración inicial (implementado, QA integral pendiente)

- Catálogo actualizado en `docs/CATALOGO-AUDIO.md`: grabaciones opcionales P1 y selecciones históricas. Conservar el archivo de usuario de 70 sonidos actualizado en la conversación.
- El guardado real devuelve éxito; aviso de patita solo tras escritura nueva. No anuncia guardado ficticio.
- Mantener V o botón Asomarse: cámara limitada, soltando regresa; posición física y estado oculto intactos. Respiración visual y bucles reales opcionales; sin tono sintético de respiración.
- RC: roll y pitch aplicados a la malla, suspensión visual, fuerza de señal informativa (no bloquea), breve interferencia al golpe, bucles por superficie opcionales.
- Sombra: proxy ligero articulado en atlas de profundidad de luces existentes, invalidación local acotada; no se sustituye el actor visible.
- Crujidos situados durante pasos del perseguidor, usando síntesis existente de respaldo y grabación opcional.
- Corrección de la prueba visual del árbol en su nueva esquina A.
- Pruebas nuevas de cámara/refugio, pose de sombra, guardado real y RC; navegador threat-hide comprueba sostener y soltar V y botón.
- 1.518 comprobaciones aisladas sobre funciones reales: todas pasan; navegación libre simulada para RC; NO equivalen a navegador o casa completa.

## Siguiente bloque · Completar, corregir y validar

1. Leer resultados CI del HEAD, solucionar fallos reales antes de ampliar alcance. Auditar tutoriales previos: tarjetas una vez, ambas rutas de escondite, cuenta de diez segundos con el actor arriba al cero, persistencia y muerte inmediata.
2. Implementar inspección interactiva real: reutilizar geometría de los objetos (no duplicar modelos ni descargar recursos), controles táctiles/ratón, zoom acotado, cierre limpio, no alterar el espejo ni avanzar el puzzle. Confirmar guardado y transiciones de captura/reanudación. Completar audio de manipulación únicamente si hay grabación.
3. Validar visualmente sombra cerca de una puerta, ambos refugios, RC y HUD móvil; corregir si la malla proxy o la cámara no ofrecen un resultado adecuado. No declarar validación visual sin evidencia.
4. Ejecutar pruebas integrales y producción, rendimiento y recorrido narrativo. Evitar merges hasta pasar lo relevante y aprobación del usuario.

Los WAV opcionales se buscan en `src/lab/audio/`: kitty-breath-calm.wav, kitty-breath-fear.wav, house-creak.wav, floor-groan.wav, rc-wheel-wood.wav, rc-wheel-tile.wav, rc-signal-loss.wav, rc-damage.wav, inspect-cloth.wav. No existen todavía grabaciones nuevas aportadas para este bloque. El juego mantiene los recursos anteriores y no exige descargarlos para funcionar.
