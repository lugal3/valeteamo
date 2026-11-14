# Fase 3 · Banco de íconos adicionales de ValeTeAmo

**Estado:** disponibles como assets estáticos, **reservados para usos futuros**. No se activó ninguna sorpresa nueva ni se alteró el diseño, el contador, la galaxia, la postal 3D o los juegos.

## Origen y tratamiento

- Procedencia: segunda imagen compartida junto a la postal de Robin y Starfire, IMG_2490.jpeg, de **1408 × 3042 píxeles**.
- La imagen original reúne cuatro recuadros redondeados sobre un fondo rosa.
- Cada icono adicional se extrajo directamente de su propio recuadro, conservando colores, pixel art y fondo rosa. No se recreó ni se utilizó generación de IA.
- Archivos optimizados: **WebP 384 × 384 píxeles**, para interfaz móvil. No son transparentes: conservan el recuadro rosa original.
- El icono chica + gato + globo ya es el icono oficial de la PWA. Su manifest, favicon y recursos actuales quedan INTACTOS.

## Inventario

| ID | Archivo dentro de public/experience/icons/ | Recorte aproximado (x1,y1,x2,y2) | Uso sugerido | Estado |
|---|---|---|---|---|
| cat-birthday-cake | cat-birthday-cake.webp | (724,845,1365,1513) | Otra sorpresa o premio de cumpleaños | Reservado |
| cat-on-gift | cat-on-gift.webp | (45,1596,686,2264) | Acceso a un regalo o sorpresa interactiva | Reservado |
| cat-portrait-party | cat-portrait-party.webp | (724,1596,1365,2264) | Avatar, guía o sticker de un recuerdo | Reservado |

Los recortes se centran y convierten a 384×384 para conservar el marco. El icono chica + gato + globo, que está arriba a la izquierda del collage, NO se duplica: ya está instalado como icono principal.

## Cómo reutilizarlos

El registro tipado está en src/experience/extra-birthday-assets.ts. Cada ID se obtiene con getExtraBirthdayIcon y devuelve title, src, alt, suggestedPlacement y status.
Ejemplo para una futura escena de React: getExtraBirthdayIcon('cat-on-gift').src devuelve /experience/icons/cat-on-gift.webp. Añadir una etiqueta img usando esa ruta solo al elegir la ubicación definitiva.

Los tres están marcados status: reserved, por lo que no aparecen inesperadamente en la galaxia, el sobre o la portada. Cuando se active uno, actualizar el registro y agregar una prueba de interfaz.

## Calidad y seguridad

- node tests/birthday-icon-assets.cjs verifica que cada asset es WebP válido de 384×384, que está registrado y que se mantienen las referencias existentes del icono de la pantalla de inicio.
- npm run build comprueba que el proyecto compila.
- Las pruebas de la experiencia cósmica y del juego permanecen activas.
- Solo se publican los recortes optimizados, no la imagen vertical completa.
