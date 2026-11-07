# Assets generados para la aventura

Se utilizó la herramienta integrada de generación de imágenes de Codex, no una API ni CLI externa. Los PNG originales conservan transparencia y se cargan solo al necesitarse. Las referencias aportadas por el usuario guiaron el aspecto de Kitty; el Louis chibi se diseñó para compartir estilo, con ropa de rayas y pantalones rojos. No se incluyeron las imágenes originales del usuario en el repositorio.

| Archivo | Contenido |
| --- | --- |
| `public/sprites/kitty-reference-sheet.png` | Kitty: reposo, perfil, espalda, parpadeo, pasos frontales, ataque y daño. Generado en la fase anterior a partir de las cinco referencias del usuario. |
| `public/sprites/kitty-walk-sheet.png` | Cuatro pasos de perfil y cuatro pasos de espaldas para Kitty. |
| `public/sprites/louis-reference-sheet.png` | Louis chibi: reposo, perfil, espalda, parpadeo, pasos frontales, ataque y daño. |
| `public/sprites/louis-walk-sheet.png` | Cuatro pasos de perfil y cuatro pasos de espaldas para Louis. |

Las hojas nuevas se adaptan a texturas de 32 × 40 en `src/reference-characters.ts` y luego se liberan las texturas grandes de Phaser. No se modifica el PNG original. Las imágenes de referencia se cargan para el personaje elegido; la portada carga sus retratos. Para diseñar tus propias hojas de 192 × 320 y reemplazar el arte integrado, consulta [HISTORIA.md](../HISTORIA.md).

## Instrucciones empleadas en esta fase

### Louis, hoja principal

```text
Create one 4-column by 2-row pixel-art sprite sheet for a playable chibi character inspired by Louis Tomlinson of One Direction. Use the supplied image solely as the style, scale, outline, color rendering and pose grid reference: the new character is a human male, NOT the white cat. Warm skin, expressive dark eyes, recognizable swept brown quiff, dark navy-and-cream striped short-sleeve shirt, red trousers and dark shoes, early 2010s look. Oversized head, compact body and friendly face, matching the cozy clean pixel game reference. Eight isolated full-body poses on a regular 4 by 2 grid, same size and feet baseline in each cell: first row front idle, right side, back, front blinking; second row two alternating walking poses, front attack with raised arm, hurt recoil. Clearly separate and consistently position all figures. Transparent background and transparent empty space, no checkerboard, no labels, no grid lines, no text or watermark; no extra characters, no extra accessories.
```

Referencia: hoja existente de Kitty (`kitty-reference-sheet.png`).

### Kitty, extensión de caminata

```text
Using the supplied Hello Kitty pixel sprite sheet as the strict character and style reference, create a matching animation extension sprite sheet for a 2D isometric game. Same exact white cat, red bow on viewer's right, pink sleeves, blue overalls, yellow buttons, brown outlines, head and body size, palette and crisp pixel art. Transparent background. EXACTLY a regular 4-column by 2-row grid with one complete character in each equal cell, no labels or lines. TOP ROW: four sequential poses of walking while facing RIGHT in side view, showing alternating left/right feet and natural arm swing (contact, passing, opposite contact, passing). BOTTOM ROW: four sequential poses of walking AWAY from viewer in back view, again with alternating feet and arm swing. Keep the center and the feet baseline consistently aligned in every cell, ample transparent margin around each character. No characters facing camera, no checkerboard, no text, no background, no duplicates outside cells.
```

Referencia: hoja existente de Kitty (`kitty-reference-sheet.png`).

### Louis, extensión de caminata

```text
Using the supplied Louis Tomlinson inspired pixel sprite sheet as strict style and character reference, create a matching animation extension sprite sheet for a cozy 2D isometric game. Same exact human male chibi, swept brown hair, navy and cream striped shirt, red trousers, dark shoes, brown outline, consistent scale, head proportions, colors and pixel rendering. Transparent background. EXACTLY a regular 4-column by 2-row grid with one complete character in each equal cell, no labels or lines. TOP ROW: four sequential poses of walking while facing RIGHT in side view, alternating feet with natural arm swing (contact, passing, opposite contact, passing). BOTTOM ROW: four sequential poses of walking AWAY from viewer in back view, alternating feet and arm swing. Keep center and feet baseline aligned in every cell, ample transparent margins. No characters facing camera, no checkerboard, no text, no background, no duplicates outside cells.
```

Referencia: hoja nueva de Louis (`louis-reference-sheet.png`).
