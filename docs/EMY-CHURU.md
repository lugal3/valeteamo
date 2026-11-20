# Emy: Churu en 2D y gata animada en la planta alta

La gata toma como referencia las fotos aportadas por el propietario: pelaje gris largo, marcas oscuras en la frente, pecho plateado claro, ojos verdes, nariz rosada y cola tupida. Las fotografías privadas no se incluyen en el repositorio.

## Encuentro 2D

Al recoger el Churu aparece equipado junto a la mano de Kitty. Emy se aproxima cuando Kitty termina de cruzar el puente, sin atravesar el río. El botón «Alimentar a Emy» abre una interacción a pantalla completa. La gata permanece centrada; solo se mueve el Churu.

Arrastra la punta del Churu hasta la boca y mantén pulsado para alimentar. En teclado se mueve con las flechas y se alimenta manteniendo espacio o Enter. Solo aumenta el porcentaje si la punta está en alcance; al alejarla, soltar, cancelar el puntero, cambiar de pestaña o perder el foco deja de aumentar. El envase se comprime mientras Emy alterna lamidos y parpadeos. El progreso requiere 7,5 segundos efectivos de alimentación, con pasos limitados para evitar saltos al reanudar una pestaña suspendida.

Al 100% aparecen los ojos de corazón, una sacudida del panel y vibración donde el navegador la permite; se respeta movimiento reducido y silencio. Suenan la celebración y el cierre. Kitty levanta una patita para despedirse y Emy se aleja caminando con ojos de corazón. Solo entonces se confirma el checkpoint de alimentación. Cerrar antes permite volver a intentarlo conservando el Churu. No se cambian claves de guardado ni los sprites de Louis/Lois.

## Emy 3D

`src/lab/emy-cat.js` articula un esculpido conectado de Emy: cabeza y orejas en una superficie; torso, cuello y patas en otra, con pesos de deformación. El rostro tiene ojos almendrados, pupilas verticales, párpados, nariz triangular y bigotes. El pelaje combina un atlas generado de hebras grises, melena clara y fibras geométricas finas. No introduce otra biblioteca de render.

En el piso superior Emy recorre el pasillo evitando geometría sólida; alterna caminar, sentarse, asearse, estirarse y dormir. Se detiene cerca de Kitty, gira la cabeza y se puede acariciar con la interacción contextual existente para provocar una reacción de ronroneo y patita levantada. El modelo no bloquea al jugador. Su API de reacción queda separada de la lógica de puzles para ampliarla después.

El mismo modelo se reutiliza en la gata del final del rescate; la Emy de arriba se oculta cuando se activa la gata de la salida, evitando dos Emy visibles simultáneamente. Los puzles, el perseguidor y Louis conservan sus condiciones.

## Vista previa

`emy-preview.html` ofrece tres entradas: alimentar a Emy, revisar el modelo en la planta alta y probar el encuentro real con Phaser. La prueba usa un checkpoint aislado y no modifica la partida.

## Validación

- `npm test` incluye `tests/emy-cat.cjs`: alcance/soltar el Churu, tiempo de alimentación a 30/60/120 Hz, entradas no finitas, límite de pasos, ruta/colisiones 3D a 30/60 Hz durante 150 segundos, cinco estados, reacción a caricias y visibilidad del final.
- `npm run build` compila la app y las páginas independientes de Louis y Emy.
- Las pruebas de navegador existentes se adaptan al nuevo gesto de alimentación mediante `tests/helpers/feed-emy.cjs`.
- Revisión manual en navegador: Churu equipado, encuentro en el jardín, panel, arrastre, avance al 100%, ojos de corazón, cierre y saludo de Kitty.
- La compilación/enlace de los shaders de calidad media y baja se verificó en OpenGL ES 2 real mediante EGL sin pantalla; también se dibujaron las seis poses con el shader y la textura del juego, sin errores GL. La prueba detectó y corrigió falta de precisión en la transformación de vértices.
- Chromium no pudo arrancar por restricciones de sockets del entorno; queda pendiente la comprobación integrada de WebGL y rendimiento en el dispositivo real. Las vistas de estudio usan los mismos vértices del juego en Blender.

Sin fusión a main ni despliegue Firebase.

## Esculpido continuo y pelaje de mayor detalle

La revisión reemplaza los volúmenes visibles separados por dos superficies esculpidas conectadas. `scripts/emy/build-sculpt.py` fusiona y suaviza el cuerpo y el rostro; `src/lab/emy-sculpt.js` asigna cuatro influencias normalizadas por vértice y genera fibras curvas, finas y afiladas en dirección al pelo. Se mantienen las señas del pixel art y las fotos: pelaje gris, frente tabby, ojos verdes, nariz rosada, mejillas y melena plateadas y cola larga tupida. No se incluyen fotos privadas en los assets.

El cuerpo se deforma con los apoyos de hombros, caderas, rodillas y patas. La cabeza tiene su propio marco para conservar la forma del rostro al girar. Al dormir o ronronear se cierran los párpados con la misma textura del rostro. Una compresión suave del pelaje del vientre evita que atraviese el suelo al recogerse; las patas conservan sus apoyos. Las animaciones existentes quedan como base para una próxima revisión de actuación.

La Emy principal tiene 30.836 vértices y 48.526 triángulos, incluidas las fibras de doble cara. La casa completa, con pickups y la gata distante del final, ocupa 64.837 vértices dinámicos y conserva el límite de 65.536 índices de WebGL1. La gata del final usa una versión reducida del mismo esculpido, colores y textura; solo una de las dos es visible a la vez. El renderer comprueba el límite antes de subir los buffers.

La textura se carga una sola vez en una unidad libre, con mipmaps. Los materiales propios de Emy no alteran las texturas de Louis, Kitty o el perseguidor. La transformación de vértices usa precisión alta para evitar interferencias entre córnea, párpados y capas finas de pelo, conservando las precisiones existentes en la etapa de fragmentos.

`tests/emy-cat.cjs` comprueba conectividad de las superficies, suma de pesos, normales, orientación de triángulos, contacto con el suelo, correspondencia entre escritura dinámica y geometría reconstruida, límite de la casa completa, estados y ruta. En este host, una muestra de 119 pasos tras calentamiento dio 3,45 ms de mediana y 5,86 ms de percentil 95 para calcular la pose y escribir sus vértices. Esto mide CPU local; no acredita FPS en un teléfono ni incluye dibujo GPU.

`export-review.mjs` y `render-review.py` producen vistas del esculpido implementado. La luz y transmisión del pelo de Blender son una presentación de estudio; no equivalen a una captura de la casa. No se modificó el 2D en esta revisión.

## Rostro más suave y pelaje con volumen

Se elimina el relieve separado de las cejas y se reduce el hundimiento orbital de 18 a 4 mm. Se amplía el manto de mejillas, sienes y cuello para cubrir el relieve anatómico, conservando superficies conectadas. Los ojos quedan rodeados por una abertura oscura más fina. Se mantiene el atlas de hebras existente, pero el volumen procede también de la malla y del pelo geométrico.

Las fibras ahora tienen tres tramos curvos en vez de dos, con mayor longitud en las mejillas y la melena y pelo corto en la frente. Solo quedan despejadas las aberturas de ojos y boca: ya no se excluye toda la cara del pelaje. El presupuesto de triángulos de la prueba sube a 50.000 por la subdivisión de las fibras, conservando los límites de vértices individuales y de la escena WebGL1.
