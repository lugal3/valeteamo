# V3.9 — jugabilidad y naturalidad

Base: corrección multitáctil PR #52, SHA 5f79be8a83d0b6b1c20f60bb1ba8a3c6a2aea7b2. Rama separada; integrar sobre main una vez validado el táctil.

## Fase 1 — Puertas
- Hojas abiertas o en movimiento sin colisión; muros y muebles permanecen sólidos. Apertura no reserva arco de giro. Cierre solo si umbral final libre; si entra un actor durante cierre, vuelve a abrir sin solidificar sobre él. Kitty, secuestrador, Emy, Louis y RC considerados. Cerraduras, escotilla, candado y puzles no modificados. Hoja continúa visible y proyectando sombra. Pruebas unitarias de paso cocina, apertura ocupada, cierre y reversión, regresión cajón.
- Pendiente CI y prueba real; la fase no pretende resolver aún toda la navegación.

## Fases siguientes
2. Navegación Emy/secuestrador, mueble linterna, cambios de planta y recuperación cinta, evitando teletransportes.
3. Auto RC, equipamiento/tablet, colisiones y escalera sótano.
4. Louis: levantarse, escaleras, pose anatómica tras barra y final.
5. Vale ~70% de altura visible de Luis en 2D, encuentros y foto.
6. Mando: caja gigante de #lab-focus en captura del usuario, convertir en strip compacto; navegación espacial con cruceta/stick, foco inicial visible y estable, X confirma, cuadrado interactúa, círculo vuelve; Emy, teléfono, inventario y menús. Mantener táctil/PC, controles retenidos y minijuegos.
7. Rendimiento iPhone 14 observado 28–30 FPS: comprobar limitador low antes de optimización, medir, ajustes puntuales.
8. Pruebas integrales, merge y publicación tras aprobación.

## Fase 2 — navegación (primer bloque)
- Corregido nombre duplicado `walker` del test de cocina (CI fase 1 falló por SyntaxError). Emy no omite nodo cercano si el siguiente tramo corta una esquina; replanifica con malla fina en estancamiento, mantiene puertas ordinarias accesibles, detecta progreso real. Búsqueda de cinta actualiza ruta si Kitty se mueve o si se bloquea y permite reintentar sin otorgar llave. Secuestrador prioriza puertas de su recorrido y replanifica antes. Pruebas nuevas de viaje desde mueble de linterna y cinta con puertas cerradas. Pendiente CI; no se afirma resolución completa del checkpoint real.
