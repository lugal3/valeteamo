# V3.9 — jugabilidad y naturalidad

Base: corrección multitáctil PR #52, SHA 5f79be8a83d0b6b1c20f60bb1ba8a3c6a2aea7b2. Rama separada; integrar sobre main una vez validado el táctil.

## Fase 1 — Puertas
- Hojas abiertas o en movimiento sin colisión; muros y muebles permanecen sólidos. Apertura no reserva arco de giro. Cierre solo si umbral final libre; si entra un actor durante cierre, vuelve a abrir sin solidificar sobre él. Kitty, secuestrador, Emy, Louis y RC considerados. Cerraduras, escotilla, candado y puzles no modificados. Hoja continúa visible y proyectando sombra. Pruebas unitarias de paso cocina, apertura ocupada, cierre y reversión, regresión cajón.
- Pendiente CI y prueba real; la fase no pretende resolver aún toda la navegación.

## Fases siguientes
2. Navegación Emy/secuestrador, mueble linterna, cambios de planta y recuperación cinta, evitando teletransportes.
3. Auto RC, equipamiento/tablet, colisiones y escalera sótano.
4. Louis: levantarse, escaleras, pose anatómica tras barra y final.
5. Vale ~80% de altura visible de Luis en 2D, encuentros y foto.
6. Mando: caja gigante de #lab-focus en captura del usuario, convertir en strip compacto; navegación espacial con cruceta/stick, foco inicial visible y estable, X confirma, cuadrado interactúa, círculo vuelve; Emy, teléfono, inventario y menús. Mantener táctil/PC, controles retenidos y minijuegos.
7. Rendimiento iPhone 14 observado 28–30 FPS: comprobar limitador low antes de optimización, medir, ajustes puntuales.
8. Pruebas integrales, merge y publicación tras aprobación.

## Fase 2 — navegación (primer bloque)
- Corregido nombre duplicado `walker` del test de cocina (CI fase 1 falló por SyntaxError). Emy no omite nodo cercano si el siguiente tramo corta una esquina; replanifica con malla fina en estancamiento, mantiene puertas ordinarias accesibles, detecta progreso real. Búsqueda de cinta actualiza ruta si Kitty se mueve o si se bloquea y permite reintentar sin otorgar llave. Secuestrador prioriza puertas de su recorrido y replanifica antes. Pruebas nuevas de viaje desde mueble de linterna y cinta con puertas cerradas. Pendiente CI; no se afirma resolución completa del checkpoint real.

## Fase 3 — RC y mando
- Colocación alternativa local con muestreo de suelo y colisión; radio jugable .13 m, giro a baja velocidad y frenado contra paredes gradual. Centrado solo con aceleración voluntaria y orientación longitudinal en rampa/túnel abiertos, giro fuerte lo anula. Velocidad allí 2.25 m/s. Cámara busca posiciones libres y HUD compacto con indicador de asistencia. Stick derecho +34% en ambos ejes, teclado, ratón y táctil intactos. Prueba descenso descentrado añadida. Corregido fixture de rejilla (3.4 s, antes 3.2). CI pendiente.

## Fase 4 — Louis
- Retira desplazamientos de compresión de columna (.38 m) y cuello (.265 m). Sentadilla profunda con articulaciones, corrección común de raíz respecto a los tobillos, sin cambiar escala ni textura. Se levanta antes de recorrer la salida del mesón; subida más lenta según pendiente, fase de zancada continua con pasos cortos y mayor flexión de rodillas. Suaviza salida de la escena final manteniendo tiempos y puzles. Pruebas de longitudes de segmentos, pies plantados, altura real de cabeza bajo mesón y marcha en pendiente. Test público espera el manual en lugar del cartel retirado. CI de fase 3: lógica/compilación y epílogo pasaron en workflow cosmos; flujo público fallaba por selector viejo. Nuevo SHA pendiente de QA visual y automático.

## Fase 5 — Proporciones 2D
- Luis conserva .80. Vale pasa de .87 a 48×.80×.80/51 (~.602), calculado sobre siluetas opacas neutras y no sobre lienzo transparente. Ambos tienen origen de pies basado en el bitmap; sombras y enlace de manos adaptados. Prólogo y epílogo comparten las constantes, incluida fotografía real de Phaser. Retratos/arte, Kitty y Corazones original intactos. Prueba de altura de píxeles reales y uso compartido. Fase 4 CI falló por cabello a 1.151m sobre mesón 1.10m: aumenta flexión de cadera/rodilla e inclinación del torso sin acortar huesos; conserva prueba de altura, pendiente revalidación. No hay captura visual nueva todavía.

- Ajuste solicitado: altura visible de Vale del 70% al 80% de Luis; se preserva el sprite original y se actualiza la prueba de proporción. Pendiente CI.

## Fase 6 — mando (primer bloque)
- Barra de ayuda inferior con top:auto y altura intrínseca; navegación espacial por cruceta y stick izquierdo con repetición, selección visible y restauración tras reconstruir controles. Menús Emy/mapa, teléfono, inventario/modal, emotes, ajustes y editor; círculo vuelve por nivel. Snake conserva dirección y reinicio; cruceta arriba abre emotes en baño. Se mantienen RC, X salto, cuadrado interacción y +34% cámara. Pruebas de navegación geométrica y repetición añadidas; falta validar navegador y mando real.

- Fase 5 verificada: lógica y build PASS en SHA b310a83; altura de cabeza 1.031 m bajo mesón 1.10 m y subida inicial 0.0705 m. Fase 6 añade QA de navegador Chromium con mando estándar simulado (HUD, inventario, teléfono, foco tras reconstrucción); no sustituye prueba con mando físico.

## Fase 7 — rendimiento (primer bloque)
- Causa confirmada en fuente: calidad low imponía 1000/30 y el modo automático podía activarla tras tres segundos lentos. Ambos niveles gráficos apuntan ahora a 60 FPS; se mantienen límites de arranque, pausa y práctica de piano. Presupuesto automático escalonado tras tres ventanas activas lentas: medium 100% → 85% → 70% de densidad → low. Pausas, teléfono, cinemáticas y bloqueos no penalizan la calidad; el modo fluido manual permanece fijo. Se conserva resolución especial de captura y relación de aspecto. El diagnóstico indica resolución real, escala y modo automático. Pruebas deterministas añadidas al profiler. No se afirma mejora medida en iPhone físico; falta CI y medición en dispositivo.
