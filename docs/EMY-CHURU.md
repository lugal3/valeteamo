# Emy: Churu en 2D y gata animada en la planta alta

La gata toma como referencia las fotos aportadas por el propietario: pelaje gris largo, marcas oscuras en la frente, pecho plateado claro, ojos verdes, nariz rosada y cola tupida. Las fotografías privadas no se incluyen en el repositorio.

## Encuentro 2D

Al recoger el Churu aparece equipado junto a la mano de Kitty. Emy se aproxima cuando Kitty termina de cruzar el puente, sin atravesar el río. El botón «Alimentar a Emy» abre una interacción a pantalla completa. La gata permanece centrada; solo se mueve el Churu.

Arrastra la punta del Churu hasta la boca y mantén pulsado para alimentar. En teclado se mueve con las flechas y se alimenta manteniendo espacio o Enter. Solo aumenta el porcentaje si la punta está en alcance; al alejarla, soltar, cancelar el puntero, cambiar de pestaña o perder el foco deja de aumentar. El envase se comprime mientras Emy alterna lamidos y parpadeos. El progreso requiere 7,5 segundos efectivos de alimentación, con pasos limitados para evitar saltos al reanudar una pestaña suspendida.

Al 100% aparecen los ojos de corazón, una sacudida del panel y vibración donde el navegador la permite; se respeta movimiento reducido y silencio. Suenan la celebración y el cierre. Kitty levanta una patita para despedirse y Emy se aleja caminando con ojos de corazón. Solo entonces se confirma el checkpoint de alimentación. Cerrar antes permite volver a intentarlo conservando el Churu. No se cambian claves de guardado ni los sprites de Louis/Lois.

## Emy 3D

`src/lab/emy-cat.js` contiene un modelo de malla procedural compatible con el renderer actual: torso, patas, cabeza, ojos con parpadeo, orejas con mechones, mejillas, pechera de pelo largo, bigotes y cola articulada. No introduce otra biblioteca de render.

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
