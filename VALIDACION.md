# Validación · versión 1.4

Base de trabajo: `e999d2757d62d61f9806d28aa327dae4b7fe9454`. La validación anterior se conserva en `docs/VALIDACION-1.3.md`.

## Código y pruebas reproducibles

- `npm test`: lógica de la aventura clásica y de la historia, recorrido, combate, decisiones de objetos, manto, pausa, muerte, reinicio, proyección, guardado corrupto y navegación. `tests/audio.cjs` comprueba creación, reproducción, silencio, temas, suspensión, reanudación y limpieza de la sesión de audio con un contexto simulado.
- `npm run test:browser`: levanta Vite localmente y usa Playwright con Chromium o Edge sin ventana. Comprueba la historia, guardado tras recarga, manto y decisión, dos toques simultáneos, giro, pausa, pantalla completa, alternativa en navegadores sin esa API, animaciones y recuperación cuando el almacenamiento se bloquea.
- El test de navegador mide una señal de audio distinta de cero con un `AnalyserNode` real en el navegador; verifica que un único `AudioContext` sobrevive entre historia y juego y que pausa, silencio y reactivación cambian su estado. Phaser no crea otro contexto de audio.
- Para avanzar rápidamente durante el recorrido se inserta una referencia de prueba a la escena en la respuesta local de Vite y se posiciona el jugador en objetivos o se crean proyectiles. Esta instrumentación no existe en el código entregado. El control por dos dedos sí se simula mediante eventos táctiles del navegador, sin mover el personaje por código durante esa comprobación.
- Se comprueban fotogramas diferentes de caminar de lado y de espaldas para Kitty y Louis y se verifica que las hojas grandes de Phaser se liberan tras generar las texturas pequeñas. Una hoja ausente mantiene los sprites de respaldo.
- La ampliación de ambientación comprueba que el joystick permite movimiento fino, que los avisos temporales se congelan con la pausa y se eliminan, y que el sonido de los botones respeta el silencio. El recorrido abre el cómic, verifica la imagen y el foco, y lo cierra con Escape. También verifica el inicio del audio desde el teclado.
- `npm run build`: TypeScript y Vite. Phaser se descarga por separado al entrar en juego. Vite informa del tamaño del chunk del motor; no impide la compilación.

Para ejecutar la prueba de navegador en otro equipo instala Chromium con `npx playwright install chromium`, o indica una ruta con la variable de entorno `BROWSER_EXECUTABLE_PATH`. En Windows se detecta Edge cuando está en la ruta habitual. Playwright es dependencia de desarrollo; no se incluye en la página compilada.

## Pantalla y dispositivos

En navegador de escritorio se comprobaron portada, recuerdos, pregunta, juego y diálogo; el canvas ocupa el viewport y se ajusta al girar sin deformar la sala. El modo fullscreen nativo se probó en Edge headless. Se simuló la falta de soporte para comprobar las instrucciones de pantalla de inicio y el cierre accesible del diálogo.

Se inspeccionaron capturas de portada, juego, carta y cómic en vistas de escritorio y móvil simuladas. La presentación del cómic en el tamaño móvil se conserva en `docs/capturas/comic-iphone.png`; es una simulación, no una captura de Safari en un iPhone físico.

**No se ha probado en iPhone físico ni en Safari real.** No se puede afirmar que desaparezca la barra superior de Safari; el botón ofrece Añadir a pantalla de inicio cuando la API no está disponible. Los controles usan áreas seguras para el notch y el fondo alcanza la zona disponible. La escucha física y el comportamiento de audio en iPhone siguen pendientes.

## Contenido y publicación

Los recuerdos, las fotos, la pregunta y la carta incluyen contenido provisional identificado como muestra; el usuario debe proporcionar y revisar las fotografías y palabras finales. El progreso se guarda por capítulo en el navegador; recargar durante un desafío lo reinicia. No hay sincronización ni garantía de persistencia si se borran los datos del navegador.

Las imágenes de referencia de los personajes y sus indicaciones se documentan en `docs/ASSETS.md`. El archivo `firebase.json` prepara Hosting, pero no se ha vinculado una cuenta ni se ha publicado un sitio. No se agregaron fotos personales ni secretos.
