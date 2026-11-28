# Emy · esculpido y pelaje

`sculpt.js` es la salida reproducible de `scripts/emy/build-sculpt.py` (Blender 4.3). La cabeza y las orejas forman una superficie conectada; el torso, cuello y cuatro patas forman otra. Se fusionan los volúmenes antes de suavizar y reducir la malla. No se montan mejillas, hocicos ni articulaciones como esferas visibles. La variante `Low` se usa en la gata distante del final para conservar el límite de índices del renderer WebGL1.

`coat-v2.jpg` es una textura generada con la herramienta integrada de imágenes, a partir del pixel art aprobado y las fotografías de Emy como referencias visuales. **No contiene las fotografías originales.** El atlas de 1024 × 1024 tiene cuatro zonas: patrón frontal tabby sin ojos ni nariz, flancos grises, melena plateada y cola. Es albedo; la iluminación se calcula por separado. Se carga una sola vez, con mipmaps, en la unidad 7.

Brief utilizado: atlas opaco de cuatro regiones iguales, pelo gris plateado largo con hebras finas, M oscura frontal, mejillas claras, melena y cola tupidas; iluminación neutra, sin sombras horneadas, ojos, nariz, boca, textos ni escena fotográfica. El rostro conserva geometría para córnea almendrada, pupila vertical, párpados, nariz triangular y bigotes.

Las fibras finas se generan de forma determinista sobre la malla y comparten sus pesos de articulación. Los colores se desaturan en el shader para conservar el gris de Emy. Las fotografías privadas y el arte 2D se mantienen fuera de este directorio.

Regeneración:

```sh
blender --background --threads 6 --python scripts/emy/build-sculpt.py
node scripts/emy/export-review.mjs
blender --background --threads 6 --python scripts/emy/render-review.py
```

La revisión de Blender usa exactamente los vértices e índices exportados del juego, con iluminación de estudio y un material que aproxima la transmisión del pelo fino. No es una captura dentro de la casa ni una imagen conceptual generada.

## Malla neuronal de Emy para revisión

`emy-neural-20k.glb` es la reconstrucción de TripoSR a partir de las referencias
de arte. Incluye el pulido localizado del rostro, los ojos verde oliva y el
pelaje plateado horneado desde el atlas de esta carpeta. El GLB contiene 20.000
triángulos, índices de 16 bits y un atlas integrado de 1024 × 1024.

Abre `/emy-neural-review.html` con `npm run dev` para verla de cerca y girarla
con el ratón, el toque o las flechas. La página usa el renderizador WebGL1 de la
casa. La malla estática se prueba en esta página de desarrollo. Para sustituir
a Emy en la partida habrá que adaptar su malla al rig de caminata y gestos.
