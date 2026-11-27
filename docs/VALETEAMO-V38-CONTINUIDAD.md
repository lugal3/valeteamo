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
