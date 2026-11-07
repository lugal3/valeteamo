# El jardín de los deseos · historia de cumpleaños

Versión 1.4 · React, TypeScript, Vite y Phaser 3. Una aventura de cumpleaños para Valentina que intercala recuerdos editables, preguntas opcionales y tres desafíos breves. El modo anterior de seis salas sigue disponible desde «Jugar la aventura clásica» en la portada.

**Las fotografías, preguntas y carta son contenido de muestra.** No contienen recuerdos personales reales. Para reemplazarlos, sigue [HISTORIA.md](HISTORIA.md); los textos de ejemplo se identifican como editables.

## Iniciar

```powershell
npm ci
npm run dev
```

Abre la dirección local que muestre Vite. Para una partida que no se reinicie al editar fuentes:

```powershell
npm run build
npm run preview -- --port 5173 --strictPort
```

Véase [PROBAR-IPHONE.md](PROBAR-IPHONE.md) para probar desde el teléfono en la misma red. La aplicación no tiene servicio de alojamiento incorporado ni funcionamiento offline garantizado.

## Historia y controles

La portada permite seleccionar Kitty o Louis y controlar el sonido. En una partida nueva, la música empieza tras el primer toque o clic; si se silenció previamente, se respeta esa preferencia. Hay controles de sonido y pantalla completa tanto en la historia como en los desafíos. La historia alterna una primera galería, un desafío de luces, una pregunta que se puede omitir, un desafío con enemigos, una segunda galería, un jefe y una carta. Las galerías admiten botones y deslizamiento táctil. Se puede volver a capítulos anteriores y volver a jugar niveles completados.

Los desafíos se muestran en horizontal. El dedo izquierdo mueve; el derecho apunta/dispara corazones en los niveles de combate. El botón ✦ usa un destello de área limitado. En escritorio: WASD mueve, flechas o ratón disparan, B o Espacio usan el destello y Esc pausa. El daño concede invulnerabilidad breve. El manto opcional muestra su descripción y permite recogerlo o dejarlo; bloquea un golpe. Si se pierde, se puede reintentar el tramo.

El botón ⛶ activa la pantalla completa cuando el navegador lo permite. Safari en iPhone puede mantener la barra del navegador: «Compartir → Añadir a pantalla de inicio» permite abrir el juego como app con más espacio. La franja del sistema puede seguir visible. La página extiende su fondo hasta los bordes disponibles y respeta el notch y las áreas seguras.

El avance por capítulo, las respuestas elegidas, el personaje y el sonido se guardan localmente en ese navegador. Una recarga durante un desafío lo reinicia desde el principio. El guardado no se sincroniza entre dispositivos y puede perderse al borrar datos del navegador; si el almacenamiento no está disponible se muestra un aviso. No se suben respuestas a un servidor.

La portada y los capítulos tienen entradas animadas y detalles ambientales; los botones ofrecen respuesta visual y sonora. El sonido se desactiva con el mismo control de la música, y se respeta la preferencia de movimiento reducido del dispositivo.

El cómic de regalo [«jaja uno XD»](docs/comics/README.md) reúne a Kitty y Louis preparando una sorpresa de cumpleaños.

## Edición de contenidos y sprites

- [HISTORIA.md](HISTORIA.md): pasos exactos para fotos, texto, preguntas, carta, privacidad, guardado, sprites chibi y preparación de Firebase.
- `src/story-content.ts`: contenido editable y orden de los capítulos.
- `src/StoryApp.tsx` / `src/story.css`: historia, carrusel y presentación adaptable.
- `src/story-progress.ts`: guardado local y navegación entre capítulos.
- `src/StoryGame.tsx` / `src/iso-game.ts`: conexión con Phaser, pausa, controles, combate y desafíos.
- `src/isometric.ts`: proyección del tablero 2D. `src/chibi-art.ts` y `src/reference-characters.ts`: personajes de 32 × 40, referencias de Kitty y Louis y hojas PNG opcionales. [docs/ASSETS.md](docs/ASSETS.md) recoge sus instrucciones de generación.
- `public/sprites/templates/`: plantillas editables chibi y clásicas. `npm run sprites` las regenera y sobrescribe; guarda tu dibujo en otra ruta.
- [README-CLASICO.md](README-CLASICO.md): documentación de la versión anterior y sus mecánicas. [chupalo_alexitico.txt](chupalo_alexitico.txt) explica sus sprites clásicos de 16 × 20.

**No subas fotos privadas al repositorio público** sin decidir antes su almacenamiento y acceso. El proyecto contiene `firebase.json` para preparar Hosting, sin credenciales ni despliegue. No se ha configurado ni publicado un sitio nuevo.

## Verificación

```powershell
npm test
npm run build
```

Para las pruebas de navegador, ejecuta `npx playwright install chromium` una vez y luego `npm run test:browser`. Si tienes Edge en la ruta habitual de Windows se usa automáticamente; también puedes definir `BROWSER_EXECUTABLE_PATH` con la ruta de un navegador Chromium. La validación, incluida la distinción entre pruebas de escritorio y pruebas pendientes en un iPhone físico, está en [VALIDACION.md](VALIDACION.md).
