# Índice de documentación de VALETEAMO

El [README principal](../README.md) describe la estructura y el juego actuales. [AGENTS.md](../AGENTS.md) reúne las reglas de trabajo. Los documentos de esta página conservan instrucciones especializadas, decisiones y pruebas de distintas versiones. Las secciones sobre el flujo del rescate, la tele o el despliegue pueden describir el estado de la fecha en que se escribieron.

## Historia, clásico y recursos 2D

- [HISTORIA.md](../HISTORIA.md) — cómo editar capítulos, recuerdos, preguntas y carta.
- [README-CLASICO.md](../README-CLASICO.md) — manual de la aventura de seis salas.
- [CONTEXTO-PROYECTO.md](../CONTEXTO-PROYECTO.md) — contexto inicial del proyecto, centrado en 2D.
- [PROBAR-IPHONE.md](../PROBAR-IPHONE.md) — prueba desde el teléfono.
- [Sprites y plantillas](../public/sprites/README.md), [nota de sprites clásicos](../chupalo_alexitico.txt), [instrucciones de generación](ASSETS.md) y [cómic](comics/README.md).
- [Recursos públicos de la demo](../public/demo-assets/README.md), [catálogo de referencias](RECURSOS-DEMO.md) y [kit visual y mecánicas V2](ARTE-Y-MECANICAS-V2.md).
- [Validación 1.2](VALIDACION-1.2.md), [validación 1.3](VALIDACION-1.3.md) y [validación 1.4](../VALIDACION.md).

## Rescate y casa 3D

- **Entradas y contexto.** [Demo 2D → 3D](DEMO-RESCATE.md), [espejo y menú de pruebas](ESPEJO-Y-PRUEBAS.md), [laboratorio histórico](../README-3D-PRUEBAS.md) y [contexto anterior para Codex](CONTEXTO-CODEX-VALETEAMO.md).
- **Diseño del espacio.** [Auditoría inicial](AUDITORIA-3D.md), [casa V3 y QA](CASA-V3-ANALISIS-Y-QA.md), [QA del 7 de noviembre](QA-CASA-3D-2026-11-07.md), [materiales, colisiones y cajón](MATERIALES-COLISIONES-Y-CAJON-3D.md), [casa V4 y armario](CASA-V4-ENTORNO-Y-ARMARIO.md) y [casa V5 y entrada por la ventana](CASA-V5-ESPACIO-ATMOSFERA-Y-ENTRADA.md).
- **Especificaciones de versiones.** [Megaprompt V3](MEGAPROMPT-CASA-V3.md) y [autoprompt V4](AUTOPROMPT-CASA-V4.md).
- **Personajes y controles.** [Modelos chibi](MODELOS-CHIBI.md), [animaciones del personaje](ANIMACIONES-PERSONAJE.md), [animaciones y emotes V2](ANIMACIONES-CUERPO-Y-EMOTES-V2.md) y [corrección de movimiento](CORRECCION-MOVIMIENTO-3D.md).
- **Interacciones y narrativa.** [Reparaciones y teléfono](REPARACIONES-ANTIGRAVITY-Y-TELEFONO.md), [sonido, HUD y emotes](SONIDO-HUD-Y-EMOTES.md), [HUD y mensajes discretos](HUD-DISCRETO-Y-MENSAJES.md), [perseguidor y grabaciones](PERSEGUIDOR-Y-AUDIO-GRABADO.md), [nota y caja fuerte](NOTA-ESPEJO-Y-CAJA-FUERTE.md), [muebles, tele y perseguidor](MUEBLES-TELE-Y-PRESIDENTE.md) y [créditos del 3D](../src/lab/media/CREDITS.md).

## Anotaciones de diseño

El recorrido del 12 de noviembre se organiza por actos. Las ideas para vestir espacios aparecen al final del último tramo.

1. **Entrada y exploración.** Empezar la cinemática directamente fuera. Encontrar la linterna en el cajón de los mandos. Capturar el ratón en PC con un gesto inicial y liberarlo al pausar. La barra muestra los objetos recogidos. Una segunda pulsación deja la mano vacía. La llave del dormitorio se consume al usarla y la nota se puede sostener.
2. **Llegada y primera ronda.** El secuestrador cierra la ventana y pone el pestillo. Recorre la casa con pasos audibles y una comprobación de línea de visión. El armario sirve para esperar a que termine la ronda y se acueste. Un aviso señala cuándo es seguro salir.
3. **Despertar y segunda persecución.** Al salir del dormitorio llega el mensaje de Luis. Su notificación despierta al secuestrador, que coloca el candado de la puerta y vuelve a buscar. Las puertas y los pasos deberían permitir anticipar su posición. Conservar el espejo y el tocador al añadir una ducha junto al retrete, sumar un baúl al estudio y convertir la cocina en una barra tras la que se pueda agachar.
4. **Salida al sótano.** La llave roja se encuentra sobre la barra de la cocina y abre el candado de la trampilla. Conviene que las cadenas cambien de estado al abrirla y que la pista indique en qué zona buscar la llave.
5. **Interacciones secundarias.** Piano antiguo con partitura, teclas animadas y audio sintetizado, emote de «What Is Love?» con audio provisional, y mejora visual y sonora de las puertas. Para llenar espacios, ubicar objetos que cuenten algo o sirvan para orientarse. Un banco con una chaqueta junto a la entrada, un reloj que marque la espera junto al armario y recortes o marcas cerca de la trampilla dan propósito a esos rincones sin bloquear la circulación.
