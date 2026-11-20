# Emy: Churu en 2D y gata animada en la planta alta

La gata toma como referencia las fotos aportadas por el propietario: pelaje gris largo, marcas oscuras en la frente, pecho plateado claro, ojos verdes, nariz rosada y cola tupida. Las fotografías privadas no se incluyen en el repositorio.

## Encuentro 2D

Al recoger el Churu aparece equipado junto a la mano de Kitty. Emy se aproxima cuando Kitty termina de cruzar el puente, sin atravesar el río. El botón «Alimentar a Emy» abre una interacción a pantalla completa. La gata permanece centrada; solo se mueve el Churu.

Arrastra la punta del Churu hasta la boca y mantén pulsado para alimentar. En teclado se mueve con las flechas y se alimenta manteniendo espacio o Enter. Solo aumenta el porcentaje si la punta está en alcance; al alejarla, soltar, cancelar el puntero, cambiar de pestaña o perder el foco deja de aumentar. El envase se comprime mientras Emy alterna lamidos y parpadeos. El progreso requiere 7,5 segundos efectivos de alimentación, con pasos limitados para evitar saltos al reanudar una pestaña suspendida.

Al 100% aparecen los ojos de corazón, una sacudida del panel y vibración donde el navegador la permite; se respeta movimiento reducido y silencio. Suenan la celebración y el cierre. Kitty levanta una patita para despedirse y Emy se aleja caminando con ojos de corazón. Solo entonces se confirma el checkpoint de alimentación. Cerrar antes permite volver a intentarlo conservando el Churu. No se cambian claves de guardado ni los sprites de Louis/Lois.

## Emy 3D

`src/lab/emy-cat.js` contiene un modelo de superficies suaves y articulación anatómica compatible con el renderer actual: torso, patas, cabeza, ojos con parpadeo, orejas con mechones, mejillas, pechera de pelo largo, bigotes y cola articulada. No introduce otra biblioteca de render.

En el piso superior Emy recorre el pasillo evitando geometría sólida; alterna caminar, sentarse, asearse, estirarse y dormir. Se detiene cerca de Kitty, gira la cabeza y se puede acariciar con la interacción contextual existente para provocar una reacción de ronroneo y patita levantada. El modelo no bloquea al jugador. Su API de reacción queda separada de la lógica de puzles para ampliarla después.

El mismo modelo se reutiliza en la gata del final del rescate; la Emy de arriba se oculta cuando se activa la gata de la salida, evitando dos Emy visibles simultáneamente. Los puzles, el perseguidor y Louis conservan sus condiciones.

## Vista previa

`emy-preview.html` ofrece tres entradas: alimentar a Emy, revisar el modelo en la planta alta y probar el encuentro real con Phaser. La prueba usa un checkpoint aislado y no modifica la partida.

## Validación

- `npm test` incluye `tests/emy-cat.cjs`: alcance/soltar el Churu, tiempo de alimentación a 30/60/120 Hz, entradas no finitas, límite de pasos, ruta/colisiones 3D a 30/60 Hz durante 150 segundos, cinco estados, reacción a caricias y visibilidad del final.
- `npm run build` compila la app y las páginas independientes de Louis y Emy.
- Las pruebas de navegador existentes se adaptan al nuevo gesto de alimentación mediante `tests/helpers/feed-emy.cjs`.
- Revisión manual en navegador: Churu equipado, encuentro en el jardín, panel, arrastre, avance al 100%, ojos de corazón, cierre y saludo de Kitty.
- Límite del entorno de revisión: el navegador disponible no permite WebGL. Se comprueba la malla y la simulación por pruebas, pero la apariencia 3D dentro del renderer debe revisarse en un navegador con WebGL. No se ejecutaron las suites automáticas de navegador en este entorno.

Sin fusión a main ni despliegue Firebase.

## Reconstrucción anatómica (revisión del propietario)

Se sustituyeron las piezas angulares por superficies indexadas con normales suaves. La cabeza comparte una jerarquía para ojos almendrados, hocico, nariz, orejas curvas y bigotes. El pelaje incluye capas suaves de cuello, pecho y flancos y fibras finas; la cola es un único tubo curvado, sin esferas separadas. Los colores y las marcas grises se inspiran en las fotos de Emy.

Las poses se calculan desde cadera, hombros, rodillas, patas y cuello. Al sentarse baja la pelvis y sube la cabeza; al asearse levanta una pata al hocico y aparece la lengua; al estirarse adelanta las patas y baja el pecho manteniendo la grupa alta; al dormir recoge las extremidades, baja y gira la cabeza, cierra los párpados y curva la cola alrededor del cuerpo. Las caricias inclinan la cabeza y relajan los ojos. Se mezclan las poses al cambiar de estado.

El renderizador usa un camino exclusivo para deformar las superficies de Emy, con geometría local cacheada y cargas contiguas al GPU. No cambia la geometría ni la animación de Louis, Kitty ni el perseguidor. Las pruebas comparan el resultado de ese camino con una reconstrucción independiente de cada postura y comprueban el límite de índices WebGL1 de la casa completa.

Las imágenes de revisión se renderizan desde los mismos vértices e índices del proyecto en Blender, con luz de estudio. Son vistas de la malla implementada, no imágenes conceptuales ni capturas del juego. El render WebGL sigue sin poder revisarse visualmente en el navegador de este entorno.
