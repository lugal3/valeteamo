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

## Bloque D — combate y ambiente reactivo
- El primer ataque de las sombras se programa desde su aparición (no desde el arranque del juego), con aviso de 650 ms y separación de 520 ms. Colisiones por deslizamiento para sombras. Se conserva Corazones 2.
- Flor de práctica opcional en la mañana: reacciona al disparo de corazón, con sonido y efecto, sin alterar etapas ni duración obligatoria.
- El jardín pierde los reflejos dorados tras el secuestro; animales se inquietan y cantos de aves dan paso a viento/insectos mediante ecología ya existente. Sin emisores nuevos. Pruebas unitarias y de navegador añadidas. No se modifica 3D.

## Revisión visual de capturas de navegador
Se inspeccionaron fotogramas reales del run 46025507103, artefacto 15211573223 (37 PNG). La escena Emy conserva su sprite y aspecto de primer plano pero los indicadores del jardín competían; ahora se ocultan durante alimentación y conversación. Diálogo más compacto, mayor legibilidad, encuadre narrativo 12% más cercano manteniendo cámara original del arcade. Capturas previas no demuestran todavía fidelidad idéntica a la tarjeta; pendiente revisión de nuevas capturas. Pruebas de layout y zoom adaptadas a requisitos de la revisión, conservando límites de interacción y protección del arcade. No se modifica 3D.

## Premium — revisión aprobada de Luis e interfaz
Frente basado en el bitmap alineado que aprobó el usuario; no redibujar. Perfil y espalda derivados del mismo contorno y paleta, conservando ancla y claves. Las vistas no presentes en la tarjeta son interpretaciones. Corrección de lectura de paleta (G es índice 16, base 36). Alimentación: sprite original centrado, Churu inclinado alrededor de su punta, barra con icono de Emy, texto mínimo; no se cambia mecánica. Diálogo: nombre en placa, retrato sin recuadro y caja compacta. Commit de previsualización sin actualizar referencia del PR; no ejecutar pruebas nuevas ni tocar 3D hasta revisión visual.
## Premium — actuación 2D
Frente aprobado de Luis intacto. Vale: 33 cuadros en tres orientaciones. Luis 45, Louis 24. Retratos animados desde las texturas reales y sincronizados con escritura; boca vuelve a reposo al terminar cada frase. Kitty se expresa corporalmente sin agregar boca. Emy conserva sprites originales, caminata y parpadeo breve. Commit de previsualización sin publicar ni ejecutar auditoría. 3D intacto.

## Premium — terreno y composición (previsualización)
Detalles de césped agrupados, bordes de caminos quebrados, acentos alrededor de los seis hitos, cerezos con copa estratificada y sombras de contacto, plaza con bordes de piedra y textura húmeda del arroyo. Casa principal con tejas, marcos y carpintería; se preservan coordenadas de puerta, ventana, rutas y colisiones. Todo en Graphics existentes y construido una vez por mapa. Sin nuevos objetos sólidos ni cambios 3D. Pendiente revisión visual y medición de rendimiento tras aprobación.
## Premium — iluminación y atmósfera (previsualización)
Luces locales con caída en cuatro capas en los buffers existentes; sombras direccionales de árboles, reflejos de río fuera del puente, luces de tarde que se enfrían con la tensión, niebla de suelo en ambos márgenes del bosque, farol del claro y luz de porche. Corrección de posición de los cuatro faroles del sistema ecológico (antes 67 + i*4.5 no correspondía a la lista real). Cristales cerrados más luminosos y ventana de entrada oscura; corrección cromática específica por mapa que preserva el nivel de oscuridad de la narrativa, con menos pérdida de contraste en el centro. No se cambian colisiones, posiciones ni 3D. Pendiente aprobación visual y pruebas; la carga de dibujo adicional es acotada, no se afirma rendimiento medido.

## Premium — efectos y cinematografía (previsualización)
Estela de cuatro puntos por corazón (máximo 32 proyectiles dibujados), impulso visual inicial, destellos de impacto de seis puntas y onda elíptica, celebración al derrotar una sombra; se conserva la trayectoria, daño, cadencia y reglas. Reutilización de FX existente. Cinemática 2D: asentamiento de suspensión, inclinaciones suaves al caminar y polvo estratificado; no se altera duración, diálogos, posiciones o secuencia. Transiciones con tipografía y ornamento refinados, sin añadir esperas. Movimiento reducido conserva versión simple. Sin modificar el arcade ni 3D. Pendiente revisión del resultado integrado y pruebas tras aprobación expresa; no se publica la rama.

## Refinamiento A — coherencia de sprites y HUD
Bitmap frontal neutral aprobado de Luis intacto; hash de píxeles fijado en prueba pendiente, máscaras de parpadeo preservan montura, paso alterno y poses traseras diferenciadas. Mechones laterales/traseros de Vale y parpadeos independientes. Emy: diseño horizontal dedicado, zona cuadrada de interacción, punta visible del Churu y respeto de movimiento reducido. Sprite original, controles y duración sin cambios. Se actualizan comprobaciones antiguas sin ejecutarlas. Pendiente previsualización y auditoría, sin modificar rama ni 3D.

## Refinamiento B — profundidad y vegetación reactiva
Árboles de hombros y sólidos comparten un dibujo por capas: tronco y sombra fijos, copa independiente. La copa se atenúa a 28% cuando su proyección oculta a Kitty y vuelve suavemente al 100%; con movimiento reducido el cambio es inmediato. Oscilación leve de copa en árboles cercanos; paleta verde matinal, rosada de tarde y fría de bosque. Las plantas ya reactivas recuperan su postura con interpolación, y los mismos pétalos/hojas se apartan ligeramente con el movimiento de Kitty. Se precalculan posiciones de partículas y farol del claro. Sin nuevos colliders, sin cambiar rutas, sin añadir emisores ni modificar 3D. Se prepara cobertura de oclusión y recuperación vegetal, sin ejecutarla. Pendiente evaluación visual y rendimiento.

## Refinamiento C — momentos opcionales y postales
Se reutilizan actores presentes y seis hitos; en etapas tranquilas aparecen acciones independientes para acariciar a Emy (expresión de cariño), compartir un instante con Luis/Vale o Louis, contemplar el río, descansar y disfrutar flores. No altera etapas, vida ni desbloqueos. Descansar usa una postura corporal breve, no un sprite sentado nuevo. Botón Postal solo donde hay un momento disponible; captura del renderer Phaser, marco PNG, vista previa y descarga explícita local. Se usa modal nativo para bloquear controles, con timeout/error de captura y salida sin penalización. No se guardan fotos automáticamente ni se toca 3D. Pendiente revisión visual, compilación y pruebas por autorización del usuario.

## Refinamiento D — transición sonora narrativa
Mezcla optativa de rescate, controlada por etapa y escena. Dos buses Web Audio (música y ambiente) con atenuación gradual, sin afectar grabaciones del usuario, diálogos, pasos ni pistas. Jardín conserva melodía original; la tensión previa enfría el motivo y reduce aves, desaparición corta música/ambiente mediante caída breve, bosque y calle usan motivos originales graves y espaciados con silencios. Conversación atenúa fondo a 32%. Se utiliza el intervalo musical ya existente, no se crea otro. Se desconectan nodos al finalizar y se aplica mute inmediato a buses narrativos. Corazones clásico conserva la ruta musical previa. Se agregan comprobaciones puras de perfil, sin ejecutarlas. Pendiente revisión auditiva y compilación, no publicar ni modificar 3D.

## Refinamiento E — rendimiento sin recorte visual
Se precalculan proyecciones del río, reflejos, faroles, niebla, luces, salida y posiciones base de fauna. Oclusión de copas evita setters redundantes y converge exactamente al objetivo. Con movimiento reducido se reutilizan gráficos estáticos hasta cambiar la iluminación; fauna conserva su estado de alerta. Reloj de retratos y navegación evitan trabajo oculto/inactivo; Emy deja de programar frames tras completar alimentación. Se recalcula el perfil de mezcla sonora solo al cambiar etapa, mapa, oscuridad o presencia de diálogo. No se cambian densidad de partículas, resolución, colisiones, controles ni cadencia de juego. No se ejecutan pruebas, compilaciones ni mediciones de FPS; ahorro esperado por análisis estático, pendiente verificación real. Sin publicar ni tocar 3D.

## Refinamiento F2 — correcciones tras revisión visual
Luis: se conserva bitmap frontal literal y se eliminan colores de piel residuales en pelo trasero; se invierte detalle de brazos al girar. Vale: torso lateral independiente, pasos escalonados y un brazo visible. Louis: apertura intermedia de boca distinta del reposo. Kitty: tres fotogramas de sentarse/levantarse derivados del sprite real y una pose de saludo para postales. Fotografía: prepara poses de actores cercanos, congela el reloj de escena sin detener el renderer y restaura texturas, ángulos y escalas al salir; no cambia coordenadas. Emy: agarre conserva desplazamiento del dedo respecto a punta y layout horizontal acotado. Se bloquean bombas/pausa por teclado en diálogo/foto. Se cachea la longitud de la línea de diálogo. Sin ejecución de pruebas, compilación ni publicación; falta ver en juego. 3D y arcade no reciben texturas nuevas.
