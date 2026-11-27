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
