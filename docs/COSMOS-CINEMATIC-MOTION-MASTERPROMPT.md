# Galaxia de ValeTeAmo — ingeniería inversa y megaprompt aplicado

Referencia principal: MP4 entregado en la conversación (131 fotogramas, 30 fps, 4,3667 s). Se analizó el segmento animado dentro del recuadro negro superior; la interfaz TikTok, el editor y marcas de agua NO son parte de la escena.

## Evaluación y hallazgo

La versión anterior era bonita, pero NO tenía la misma vida: la cámara y las partículas parecían comportamientos independientes. El video combina avance acelerado, rotación, perspectiva angular, revelación de un disco y nacimiento de un corazón en una sola toma continua, con pausas y cambios de velocidad. El fallo era de coreografía, no de tipos de partículas.

## Fotogramas de referencia, estudiados por grupos

- Frames 000–007 (0.00–0.23 s): portada oscurece, aparecen luces remotas.
- Frames 008–019 (0.27–0.63 s): aparece un punto de fuga negro rodeado de estrellas en perspectiva radial.
- Frames 020–035 (0.67–1.17 s): luces periféricas grandes, corrientes curvas giran alrededor del punto y la cámara parece avanzar con rapidez.
- Frames 036–043 (1.20–1.43 s): aparece un óvalo brillante diminuto dentro del centro; el túnel cambia de profundidad.
- Frames 044–052 (1.47–1.73 s): óvalo más grande; cámara parece inclinarse, el núcleo de una galaxia se manifiesta.
- Frames 053–067 (1.77–2.23 s): se abre progresivamente una espiral horizontal rosa; estrellas exteriores se atenúan.
- Frames 068–078 (2.27–2.60 s): del núcleo sale una columna de polvo estelar que comienza a abrirse.
- Frames 079–094 (2.63–3.13 s): las partículas forman dos lóbulos y la punta del corazón.
- Frames 095–110 (3.17–3.67 s): el corazón queda definido por encima del disco; el movimiento se estabiliza.
- Frames 111–130 (3.70–4.33 s): aparecen textos y elementos orbitando, con movimiento lento.

Se revisó la totalidad de 131 fotogramas y se calcularon campos de flujo óptico para contrastar la evolución radial y tangencial. No son medidas de cámara originales: son observaciones de un video comprimido.

## MEGAPROMPT aplicado

ROL: Eres director de cinemáticas e ingeniero de gráficos en tiempo real especialista en reconstrucción de movimiento a partir de video. Debes modificar la experiencia cósmica EXISTENTE en React/TypeScript/Canvas de ValeTeAmo. NO rediseñes el universo.

OBJETIVO: Reproducir una única toma continua: entrar por un túnel profundo de estrellas curvadas, girar y avanzar hacia un punto de fuga, descubrir que ese punto es un núcleo galáctico, ver el disco que se despliega armónicamente, y observar un flujo de polvo que forma un corazón luminoso. Después la cámara descansa, la galaxia sigue viva y el usuario puede explorar.

RESTRICCIONES: Mantén la distribución orgánica preferida del PR #9 y el diseño final, fucsia sobre negro. Sin nuevas librerías, sin otros motores, sin imágenes copiadas de la referencia, sin panel de carga, sin overlay. No tocar iconos PWA, favicon, contador, Firebase, interfaz LP, recuerdos, tarjetas, juego Phaser ni conexión corazón → 2D. Mantén una sola instancia Canvas durante la transición de carga a galaxia.

SECUENCIA ANIMADA:
1. 0.00–0.23 s: oscuridad profunda, estrellas pequeñas y dispersas en centro.
2. 0.23–1.32 s: dolly-in ACELERADO y suave descenso. Perspectiva radial real, no puntos moviéndose simplemente en círculos; la velocidad de expansión aumenta cerca de la cámara. Filamentos curvos SUAVES y polvo libre para conservar naturalidad. Rotación progresiva, estelas discretas.
3. 1.32–1.72 s: breve máxima aproximación, contracción controlada del campo de luces y aparición del núcleo ovalado. La cámara se inclina y comienza la transformación de perspectiva.
4. 1.72–2.28 s: UNFOLD del disco: estrellas originales se interpolan a su posición proyectada de galaxia, anillos comienzan pequeños y crecen. La cámara se aleja un poco con curva easing, no corte brusco.
5. 2.28–3.21 s: polvo brota desde el mismo núcleo y asciende para formar el corazón, con microdesfases individuales.
6. 3.21–4.55 s: cámara amortigua su movimiento, frases aparecen en órbita y queda la galaxia interactiva.

MATEMÁTICA: usa tiempo absoluto determinista en requestAnimationFrame. Cámara con movimientos suaves C0/C1, dolly no monótono (avanzar y retroceder). Coordenada de profundidad que avanza con aceleración; proyección radial con potencia cercana a 2.2. Ángulo compuesto de orientación orgánica inicial, atracción parcial hacia filamentos, rotación temporal y pequeña curvatura dependiente de profundidad. Usar amplitud de lente que crece y después se estrecha. Al revelar la galaxia, mezclar posición del túnel y posición proyectada de cada estrella; mismas partículas, sin cambio de escena. El corazón se crea desde el centro con curvas escalonadas. Conservar lenta rotación orbital después del final.

ACEPTACIÓN: a 0.8s se reconoce el viaje y el giro hacia el punto de fuga. A ~1.4s se distingue el óvalo del núcleo. A ~2.0s se abre el disco. A ~2.8s se forma parcialmente el corazón; a ~3.6s el movimiento se estabiliza. Sin salto entre loading/galaxy, sin regreso al zoom inicial. Respetar rendimiento móvil (3500 puntos auto) y reduced motion. Conservar pellizco, rueda, arrastre, corazón seleccionable. Pruebas automáticas y recorrido completo contador→galaxia→corazón→2D.

ENTREGA: modificar código REAL, guardar commit, probar build, pruebas unitarias y Playwright en móvil y horizontal. Guardar capturas de la secuencia y confirmar CI antes de publicar. No entregar solo localhost ni un prompt sin aplicar.

## Archivos implementados

- src/experience/galaxy-arrival.ts: 4.55 s, dolly hacia el centro y retroceso, pitch/yaw en continuidad, parámetro de lente y aceleración.
- src/experience/VideoGalaxyCanvas.tsx: flujo óptico radial acelerado, trayectoria ligeramente curvada, revelación continua del disco y formación adelantada del corazón.
- tests/galaxy-arrival.cjs: verifica timings, zoom no monótono, progresos suaves y continuidad entre fotogramas.

No se puede garantizar identidad cuadro a cuadro sin el proyecto gráfico original; el objetivo comprobable es la fidelidad de la coreografía, no el tipo ni el número de partículas.
