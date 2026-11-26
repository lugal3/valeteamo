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

## Bloque B · Inspección y transiciones (implementado, QA integral pendiente)

- Vista interactiva de los modelos de recogida existentes (llaves, pila, linterna, destornillador, RC y papel), accesible desde las notas y el inventario. Arrastrar con ratón/dedo, pellizco o rueda, botones de zoom y centrado, teclado accesible; límites y cierre sin alterar poses, inventario ni puzles.
- El render de inspección es un pequeño Canvas2D que proyecta los triángulos de la geometría real, sin duplicar modelos o abrir otro contexto WebGL. No reproduce las texturas/materiales complejos del shader. Solo se redibuja con interacción o resize. La nota del espejo conserva su sistema original y no se entrega un modelo giratorio con las cifras.
- Fundido visual de recuperación de .58 s tras restaurar el checkpoint después de captura o rescate de Emy; se omite con movimiento reducido, no concede tiempo extra.
- Puertas interiores: holgura inferior real de 5.5 cm, para que la luz/sombra pueda pasar cerca del umbral; no cambia el ancho del paso ni el estado cerrado de la puerta.
- Pruebas añadidas al navegador de movimiento: abrir una nota real, píxeles visibles, ratón físico, pellizco nativo Chromium o eventos de puntero WebKit, centrado y cierre, integridad del puzle.
- Prueba focalizada de la llegada: lectura pausada, bajo la cama al cero, reintento sin repetir tutorial, pérdida de exactamente una vida y posición del perseguidor en planta alta.
- La auditoría previa (4eeb4e3) confirmó código/puzles/colisiones/build, amenaza/escondites, luces del árbol, entrada móvil, Emy móvil/WebKit, altar y prólogo. Otras pruebas se cancelaron por nuevos commits. 5.315 comprobaciones aisladas de proyección y límites del visor pasaron con malla sintética; las de mallas reales y navegador están en CI.

## Siguiente bloque · QA, correcciones y cierre

- Revisar resultados de CI del HEAD, corregir fallos reales antes de cualquier merge. No cancelar innecesariamente las ejecuciones con commits de documentación.
- Confirmar ambas rutas de escondite y pérdida inmediata al cero en navegador real; verificar manual/historial y no repetición en campaña normal.
- Comprobar visualmente sombra cerca de puertas, ambos refugios, RC, fundido y HUD/inspección móvil; corregir si es necesario. Validación visual aún no realizada en esta sesión.
- Ejecutar pruebas integrales y producción y auditoría de rendimiento. Ningún cambio de main/Firebase hasta autorización explícita.

Los WAV opcionales se buscan en `src/lab/audio/`: kitty-breath-calm.wav, kitty-breath-fear.wav, house-creak.wav, floor-groan.wav, rc-wheel-wood.wav, rc-wheel-tile.wav, rc-signal-loss.wav, rc-damage.wav, inspect-cloth.wav. No existen todavía grabaciones nuevas aportadas para este bloque. El juego mantiene los recursos anteriores y no exige descargarlos para funcionar.
