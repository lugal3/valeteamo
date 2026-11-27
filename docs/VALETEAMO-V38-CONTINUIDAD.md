# V3.8 — Continuidad, inmersión y cierre narrativo

Base publicada: d28fc0eaa26ddc348f60b4e9704aaf275f8fb4c0. Rama independiente feature/v38-continuidad-inmersion-final. No fusionar ni desplegar hasta completar validación y recibir autorización. Conservar Corazones 2 original, fecha pública del cumpleaños (05/12 00:00 Chile), mecánicas, estilos aprobados, guardados y motores.

## Cinco fases amplias
1. Estabilidad y continuidad técnica: línea base, fallos UI, transiciones, carga progresiva, audio y recuperación/guardados; medir rendimiento sin cambiar por intuición. 
2. Narrativa y prólogo 2D vivo: continuidad de personajes, pistas, estados y recuerdos, actuaciones, ambiente reactivo, secuestro y ritmo breve.
3. Enlace 2D/3D y casa: correspondencia espacial, transición de ventana y regreso, audio y tensión, lógica de puzles, Emy y Louis, contactos y cinematografía.
4. Epílogo y universo: picnic vivo libre sin objetivos obligatorios, velas, carta, foto, retorno con recuerdo y revisita. Mantener final alternativo separado. Extras de bajo coste solo si no comprometen calidad.
5. Cierre integral: recorrido real sin atajos, Chromium/WebKit, PC/móvil, guardados, presupuesto de recursos, pruebas de compilación y rendimiento, capturas antes/después y revisión. Solo después considerar merge y publicación.

## Fase 1 — primer bloque
- Evidencia: publicación de base exitosa (46067796614); cosmos-browser falló en el corazón de 01 DIC por bounding box animado (46067796778). Epílogo independiente pasó.
- Corazón conserva la animación en un span visual sin eventos y un botón fijo de 44 px; regresión exige tamaño, animación visual y clic normal.
- Al confirmar entrada por ventana, se inicia importación de casa durante el fundido existente; no se adelanta el avance ni se inicia el motor durante el prólogo. Estado de preparación explícito mientras se importa y monta la casa; se conserva salida y error existente. No afirmar que el primer frame esté garantizado por la resolución del import.
- Pendientes de fase 1: CI de este SHA, capturas reales, medición tiempos entre escenas y FPS, audio y persistencia, revisión de recuperación y controles. No declarar fase completa con solo cambios estáticos.

## Fase 1 — segundo bloque
- Preferencia de silencio compartida para prólogo, casa y epílogo públicos; conserva canales del mezclador 3D y no añade escrituras de preferencias desde las pantallas 2D de LP. La casa de prueba conserva sus preferencias anteriores. Se pasa el estado real de silencio al salir de la casa. El modo privado/bloqueado sigue funcionando en memoria.
- Epílogo: una instancia Sound compartida entre sus cuatro mapas, sin reiniciar la música en cada cambio. Destrucción al abandonar el epílogo. No se modifica Corazones 2.
- Precarga del módulo del rescate durante splash existente; no se inicializa ningún motor en paralelo. Limpieza de entrada 2D al perder foco y pausa si el documento se oculta durante la carga. Regresión del epílogo comprueba silencio conservado tras cambiar capítulo y recargar.
- Verificación pendiente de CI exacto. No se ha medido continuidad sonora, tiempo al primer frame ni FPS en teléfono físico. Persistencia narrativa y auditoría de carga siguen pendientes.

## Fase 1 — tercer bloque
- CI del commit bc4a4fc detectó TS2353 en HouseLaunchOptions: se declara initialMuted y el argumento opcional de onRescue, compatible con callbacks sin argumentos.
- Guardado de prólogo y handoff a casa con snapshot: una pestaña antigua no puede escribir sobre checkpoint interior, rescate terminado ni reinicio. Se informa de fallo y se permite jugar en memoria. Un final cuyo guardado perdió el lease no adopta el epílogo de otra partida. No se cambia versión ni claves.
- Cobertura en rescue.cjs y prologue.cjs de competencia entre pestañas, reinicio, rescate completo, guardado bloqueado y recuperación. Pendiente ejecutar suite de esta revisión; no se da fase por validada.

## Fase 1/2 — instrumentación y primeros enlaces narrativos
- La fase 1 sigue pendiente de pruebas del SHA. Medición DEV del inicio de StoryGame hasta el callback real de escena lista; el navegador del epílogo registra cuatro tiempos en epilogue-load-timings.json. No equivale a tiempo de primer fotograma visible ni FPS físico.
- El prólogo confirma memoria de viaje al completar la ventana; el epílogo recuerda Churu, encuentro y descubrimientos válidos mediante sustitución de frases ya existentes. Previews directas y guardados antiguos sin hechos confirmados usan diálogo neutro. La línea de ventana anticipa los mensajes de teléfono existentes sin cambiar el teléfono ni las etapas.
- Se amplían tests puros de memoria, compatibilidad y datos desconocidos. Pendientes CI, ritmo/actuaciones y verificación visual. No merge/publicación.

## Fase 2 — actuaciones y continuidad de ambiente
- Kitty mira al interlocutor real; Louis orienta la mirada al hablante presente. Histéresis de dirección y respiración en reposo durante paseo. El claro permite hasta 1.8 s de acercamiento antes de la advertencia sin bloqueo permanente. Limpieza de entrada al iniciar diálogo.
- Oscurecimiento gradual durante desaparición incluso con controles bloqueados; notificación por umbral y cambio inmediato con movimiento reducido. Pruebas puras de dirección, espera y luz.
- Auditorías anteriores interrumpidas por commits posteriores; epílogo de 22de79c pasó. Pendiente CI de esta revisión, rendimiento y revisión visual. No publicar.

## Fase 3 — enlace entre motores
- Cortina compartida de campaña (#0b0a16) desde la ventana; el 3D revela su escena tras el primer render exitoso, no al terminar el import. Error gráfico sigue accesible; la salida final tiene fundido cancelable y guardia contra doble acción, sin tocar LP 3D independiente.
- El regreso 2D comienza en el portón compartido de la referencia espacial (no en el porche), coherente con la reunión exterior 3D. Se conserva el recorrido y se adapta objetivo/diálogo. Regresión del checkpoint comprueba la posición real de arranque.
- No se afirma igualdad métrica entre proyecciones ni se ha medido la calidad visual. CI y revisión pendientes; no merge.

## Fase 3 — conversación y correcciones de CI
- CI de 544eb74: TS2304 en anotación de burbujas (1108); sustituida por tipo indexado de IsoAdventure. CI de 1d737aa: prueba rescue-world no conocía la dependencia night-house-layout; usa el mismo módulo ya cargado para verificar colisiones. El navegador del epílogo pasó en ambas revisiones; no se confunde con compilación aprobada.
- Louis conserva atención y posición durante toda la conversación opcional (incluidas frases de Kitty y espera de lectura), gira suavemente hacia ella, y recupera seguimiento al alejarse. Cierre/reset libera estado. Conversación disponible solo fuera de persecución directa; no pausa IA ni elimina peligro. Se conserva rig, rutas, velocidad y puzles.
- Reencuentro exterior: señal narrativa coordinada con ronroneo y alivio ya existentes. Pruebas de sesión de conversación y seguimiento añadidas. Revalidación del nuevo SHA pendiente; no publicación.

## Fase 4 — picnic vivo y regreso
- Tras soplar las velas, Kitty recupera el movimiento; actores permanecen cerca del picnic, alternan gestos/conversación sin diálogo obligatorio. Decoración física adicional, descanso y caricia de Emy. La acción Terminar aventura guarda complete sin destruir Phaser; regreso al universo o reinicio explícito. Guardado completo abre de nuevo el picnic sin repetir rescate/velas. El corazón público reconoce complete; previews aisladas.
- Se conservan carta, fotografía real y descarga. Controles compactos laterales; sin enemigo ni límite temporal. Tests de escena viva, reapertura y persistencia ampliados. CI y capturas aún pendientes; no afirmar resultado visual probado.

## Fase 5 — primera revisión de cierre
- Corrección de recreación del escenario después de velas: la escena restaurada mantiene el estado del picnic, en lugar de reactivar las llamas tras reintentar.
- Sentarse ahora persiste hasta una orden de movimiento; los botones de picnic se sitúan arriba a la derecha, liberan el área táctil izquierda y mantienen objetivos de 44px. Prueba real de teclado tras completar, asiento prolongado y comprobación DOM de zona táctil a 844×390.
- Evidencia del SHA 1f368fe: lógica/compilación de auditoría integral y epilogue-browser exitosos; ramas de navegador canceladas al siguiente commit. En 2baab67 se observaron altar y retrato Louis exitosos, otros jobs aún en curso. Nueva revisión requiere CI propio. No declarar FPS físico ni capturas aprobadas. No fusionar ni publicar antes de verificar.
