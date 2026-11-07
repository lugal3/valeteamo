# Personalizar la historia de Valentina

La historia incluye **textos, preguntas y espacios para fotos provisionales**. No hay fotos ni recuerdos personales en el repositorio. El contenido está en `src/story-content.ts`: puedes cambiar los textos de cada capítulo sin editar la escena de Phaser.

## Añadir fotos y textos

1. Copia las imágenes a `public/memories/`, con nombres simples como `primera-foto.jpg`. Crea la carpeta si no existe. Es preferible usar imágenes optimizadas y de tamaño razonable para teléfono.
2. En `src/story-content.ts`, busca la foto que tiene `src:null` y cámbiala por `src:'./memories/primera-foto.jpg'`.
3. Escribe una descripción en `alt` (para lectores de pantalla) y el pie en `caption`. Cambia el `title` y el `text` del recuerdo por tus propias palabras.
4. Repite con las fotografías que quieras. El carrusel admite botones y deslizamiento táctil. Un array `photos:[]` no muestra galería. Si una imagen no carga se indica en su lugar.
5. Edita la pregunta, sus respuestas, la carta final y su firma en el mismo archivo. La pregunta puede omitirse; las respuestas son opcionales y no determinan si la historia continúa.

**Privacidad:** este repositorio es público. Una foto añadida al repositorio público queda accesible públicamente. Un sitio web público puede exponer sus archivos a quien tenga acceso a la dirección. No subas fotos personales hasta decidir dónde se alojarán y qué protección necesitas. No aparecer en buscadores no equivale a protección.

Después de editar, `npm run dev` permite revisar los cambios. Para una versión estable vuelve a ejecutar `npm run build` y abre `npm run preview`. No coloques originales en `dist/`: esa carpeta se regenera al compilar.

## Progreso

Se guarda en el navegador del dispositivo: capítulo actual y más avanzado, personaje, sonido y opciones seleccionadas. No se envía a un servidor. Se guarda al avanzar y en las elecciones; los desafíos se reinician desde el comienzo del tramo si se recarga durante ellos. El guardado puede borrarse si se borran los datos del navegador, si el navegador los elimina o si se elige «Empezar de nuevo». No se sincroniza entre dispositivos. Si el almacenamiento está bloqueado aparece un aviso y se puede seguir jugando sin guardado.

## Personajes chibi y perspectiva

La historia usa sprites de **32 × 40 píxeles**. Kitty usa de forma predeterminada `public/sprites/kitty-reference-sheet.png`, una hoja nueva generada a partir de las cinco imágenes de referencia aportadas. Contiene frente, perfil derecho, espalda, parpadeo, dos pasos frontales, ataque frontal y daño. `src/kitty-reference.ts` recorta las celdas en memoria y las adapta a las texturas del juego; el PNG original se conserva intacto. La portada también usa esa hoja. Para perfil y espalda se reutilizan las poses base al caminar; todavía no tienen pasos específicos. Izquierda refleja el perfil derecho. El asset original mide 1774 × 887 y pesa aproximadamente 0,9 MB; conviene revisar el tiempo de carga en un iPhone real.

Louis y el respaldo de Kitty se dibujan por código en `src/chibi-art.ts`. Las plantillas editables `public/sprites/templates/chibi-kitty.png` y `chibi-louis.png` contienen esas versiones generadas por código, no una exportación de la hoja de referencia. Tienen 6 columnas × 8 filas, **192 × 320 píxeles** en total. Conserva transparencia, celdas alineadas y los pies en la misma posición.

| Fila, desde 0 | Fotogramas, de izquierda a derecha |
| --- | --- |
| 0 | Abajo: reposo, cuatro pasos, parpadeo |
| 1 | Abajo disparando: las mismas seis posiciones |
| 2 | Arriba: reposo, cuatro pasos, parpadeo |
| 3 | Arriba disparando: las mismas seis posiciones |
| 4 | Derecha: reposo, cuatro pasos, parpadeo |
| 5 | Derecha disparando: las mismas seis posiciones |
| 6 | Recibir daño: solo se usa la primera celda |
| 7 | Muerte: solo se usa la primera celda |

Las filas 6 y 7 se repiten en las plantillas para facilitar el dibujo, pero se usa la primera celda. Actualmente izquierda se obtiene reflejando derecha, y las direcciones diagonales usan una de estas vistas; no hay ocho vistas dibujadas independientes. Mantén el anclaje de pies y dibuja la silueta completa dentro de cada celda.

Copia la plantilla a `public/sprites/chibi-kitty.png` o `chibi-louis.png`; edita la copia. En `src/characters.ts`, cambia `chibiSpriteSheet:null` por `chibiSpriteSheet:'./sprites/chibi-kitty.png'` o la ruta correspondiente a Louis. La hoja debe medir exactamente 192 × 320 y contener todas las poses. Una hoja personalizada tiene prioridad sobre la referencia predeterminada de Kitty. Si falta o tiene otro tamaño, la escena conserva el sprite generado por código. Una celda vacía no se detecta y hará invisible al personaje en esa pose. Los retratos de portada y tarjetas siguen mostrando la referencia de Kitty o el dibujo por código de Louis; cambiar una hoja personalizada no cambia esos retratos.

`npm run sprites` regenera y **sobrescribe las cuatro plantillas**, no las copias fuera de `templates/`. Las plantillas clásicas de 16 × 20 y la aventura clásica siguen explicadas en `public/sprites/README.md` y `chupalo_alexitico.txt`.

La sala proyecta coordenadas de un tablero 2D en forma de rombo (`src/isometric.ts`). La posición de los pies determina la profundidad de personajes, enemigos y árboles. Los árboles son decorativos y no bloquean el movimiento. `src/iso-game.ts` contiene los tres desafíos y `src/StoryGame.tsx` la capa de controles y pausa. El primer desafío recoge luces; el segundo resuelve tres enemigos; el tercero presenta un jefe.

## Firebase Hosting: preparación, no publicación

`firebase.json` prepara `dist/`, el fallback a `index.html` y la caché de assets versionados. No contiene identificador de proyecto ni credenciales y **no ha publicado nada**. Para desplegar más adelante en un proyecto de Firebase que controles:

1. Decide primero dónde irán las fotos privadas y qué acceso se permitirá. Firebase Hosting estático no convierte el contenido en privado por ocultar su enlace.
2. Instala/configura Firebase CLI según sus instrucciones oficiales e inicia sesión con la cuenta correcta.
3. Ejecuta `npm ci` y `npm run build`.
4. Verifica el proyecto y destino con `firebase projects:list` y usa `firebase deploy --only hosting --project ID_DEL_PROYECTO` solo cuando quieras publicar esa compilación.

No hay proyecto vinculado automáticamente; usar un proyecto o canal de prueba antes del sitio definitivo permite revisar el resultado. Consulta la documentación oficial vigente de Firebase para configurar dominio, canales y permisos.

Referencias oficiales: [primeros pasos de Firebase Hosting](https://firebase.google.com/docs/hosting/quickstart) y [configuración de Hosting](https://firebase.google.com/docs/hosting/full-config). Ejecutar `firebase init hosting` sobre este proyecto puede sobrescribir la sección de Hosting ya preparada en `firebase.json`; guarda una copia de tu configuración antes de usarlo.

## Pruebas y límites

`npm test` verifica la lógica de la historia y del juego clásico; `npm run build` valida tipos y compila. `VALIDACION.md` indica qué se probó en navegador y qué falta en un iPhone físico. El modo pantalla de inicio es opcional, no garantiza funcionamiento sin conexión y no obliga a jugar fuera de Safari.
