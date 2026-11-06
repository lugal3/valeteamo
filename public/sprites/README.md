# Sprites para dibujar

Las plantillas en `templates/kitty.png` y `templates/louis.png` contienen los píxeles reales del juego. Son PNG con transparencia de **96 × 160 px**, seis columnas y ocho filas de celdas de **16 × 20 px**, sin separación.

| Fila (desde 0) | Contenido |
| --- | --- |
| 0 | Abajo: reposo, paso 1, paso 2, paso 3, paso 4, parpadeo |
| 1 | Abajo disparando: los mismos seis fotogramas |
| 2 | Arriba: los mismos seis fotogramas |
| 3 | Arriba disparando: los mismos seis fotogramas |
| 4 | Derecha: los mismos seis fotogramas |
| 5 | Derecha disparando: los mismos seis fotogramas |
| 6 | Daño: se usa solo la primera celda |
| 7 | Muerte: se usa solo la primera celda |

Izquierda se obtiene reflejando derecha. Conserva la posición de los pies entre celdas. Edita a 1× con lápiz duro, sin suavizado; amplía la vista a 800% para trabajar.

Copia una plantilla a `public/sprites/louis.png` o `kitty.png`, edítala y configura `spriteSheet:'./sprites/louis.png'` en `src/characters.ts`. Una imagen ausente o de dimensiones incorrectas conserva el arte generado como respaldo. Esto reemplaza el personaje del juego; los retratos de la portada conservan la vista dibujada en código.

`npm run sprites` regenera **solo las plantillas**, sobrescribiendo su contenido. Guarda tu trabajo fuera de `templates/`. La explicación completa está en `chupalo_alexitico.txt` en la raíz.
