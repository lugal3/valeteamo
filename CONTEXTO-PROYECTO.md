# Contexto para continuar El jardín de los deseos

Este archivo reúne lo necesario para retomar el proyecto en otro chat o con otra persona. El código y las guías especializadas son la fuente de verdad; si algo aquí queda desactualizado, revisa los archivos y el estado de Git antes de hacer cambios.

## Qué es y qué quiere conseguir

Es un juego de cumpleaños para Valentina. La experiencia principal combina una portada, selección de Kitty o Louis, recuerdos editables, una pregunta opcional, tres pequeñas aventuras isométricas y una carta final. Al terminar también se puede abrir el cómic «jaja uno XD». Existe un juego clásico de seis salas accesible desde la portada; es una experiencia separada que se conservó.

El estilo buscado es tierno, chibi, pixel art y con ambiente de jardín. El usuario quiere una experiencia cuidada y fluida: botones que respondan al tocarlos, sonidos y animaciones agradables, escenarios decorados y controles cómodos en iPhone. Los efectos deben respetar el silencio, la preferencia de movimiento reducido y no dificultar la lectura ni el juego.

**Lo personal sigue pendiente:** las fotos, los textos, las preguntas y la firma actuales son ejemplos o espacios reservados. No describen recuerdos reales. Hay que sustituirlos con material proporcionado por el usuario; no inventar anécdotas. El repositorio es público, así que no subir fotos personales sin decidir antes cómo se protegerán.

## Tecnologías y organización

- **React 19 y TypeScript:** pantallas, historia, controles HTML, diálogos y estado de la interfaz.
- **Phaser 3:** dibujo, animación y reglas de los niveles jugables en un lienzo. La historia usa proyección isométrica 2D, no un motor 3D.
- **Vite:** servidor de desarrollo y compilación. `dist/` es salida generada; no se edita como fuente.
- **CSS:** diseño adaptable, animaciones de portada y capítulos, pantallas de pausa y áreas seguras.
- **Web Audio:** música original y efectos generados por código; no hay MP3 ni canciones de One Direction.
- **localStorage:** guarda el avance en ese navegador y dispositivo, sin servidor ni sincronización.
- **Playwright:** pruebas de navegador automatizadas. La compilación valida tipos con TypeScript.

## Rutas de código importantes

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Entrada HTML, viewport, metadatos para iPhone e iconos. |
| `src/main.tsx` | Punto de entrada React y aplicación clásica; monta la historia como experiencia principal. |
| `src/StoryApp.tsx` | Portada, navegación, personajes, recuerdos, pregunta, carta y cómic. Comparte la instancia de audio con el juego. |
| `src/story-content.ts` | Orden de capítulos, textos, respuestas, rutas de fotos y bandera de contenido de muestra. |
| `src/story-progress.ts` | Validación, lectura y escritura del avance local; clave `valeteamo-story-v1`. |
| `src/story.css` | Estilos y animaciones de la historia, capas de juego, adaptación a móvil y movimiento reducido. |
| `src/StoryGame.tsx` | Crea y destruye Phaser, gestiona pausa, orientación, HUD, carga y ventana del manto. |
| `src/iso-game.ts` | Los tres niveles: movimiento, enemigos, jefe, proyectiles, recolección, escenario y efectos. |
| `src/isometric.ts` | Proyección del tablero de 8 × 8 y conversión de dirección de pantalla a coordenadas del mundo. |
| `src/reference-characters.ts` | Recorta las hojas de referencia de Kitty y Louis en texturas de 32 × 40 para Phaser. |
| `src/chibi-art.ts` | Sprites chibi generados por código y respaldo; también integra hojas personalizadas. |
| `src/characters.ts` | Nombre y rutas opcionales de sprites clásicos y chibi de cada personaje. |
| `src/audio.ts` | Temas, tonos, sonidos, silencio y ciclo de vida de un único contexto de audio compartido. |
| `src/FullscreenControl.tsx` | Pantalla completa y explicación alternativa para iPhone. |
| `src/game.ts`, `src/art.ts`, `src/garden-art.ts`, `src/effects.ts`, `src/config.ts` | Mecánicas, arte, escenarios, efectos y configuración del juego clásico. |
| `tests/` | Pruebas de lógica clásica, historia, sonido y recorrido real en navegador. |

El juego de historia se carga de forma diferida al comenzar un desafío. Phaser se inicializa con audio propio desactivado para no crear otro contexto de sonido. El canvas se redimensiona con `Scale.NONE` y tamaños positivos desde `StoryGame.tsx`; esto evita que un contenedor desmontado cree un framebuffer de tamaño cero. La cámara ajusta el escenario sin estirarlo.

## Imágenes, texturas y animaciones

Las hojas de referencia están en `public/sprites/` y se cargan solo para el personaje seleccionado. Los cuatro PNG de Kitty y Louis tienen una hoja principal y otra de caminata. En tiempo de ejecución `reference-characters.ts` toma las celdas, las adapta a 32 × 40 y libera las imágenes grandes de Phaser; los PNG originales no se modifican. La izquierda refleja el perfil derecho. La portada utiliza un recorte de la hoja principal. Algunos efectos, el balanceo y el daño son transformaciones por código; no todas las acciones cuentan con dibujos únicos.

Para dibujar una hoja propia integrada, copia `public/sprites/templates/chibi-kitty.png` o `chibi-louis.png` fuera de `templates/`. Usa 6 columnas × 8 filas, celdas de 32 × 40, total 192 × 320 píxeles, fondo transparente y pies alineados. Actívala en `src/characters.ts` mediante `chibiSpriteSheet`. **No ejecutes `npm run sprites` sobre plantillas que hayas editado:** las regenera y sobrescribe. El detalle de las filas, prioridades y limitaciones está en [HISTORIA.md](HISTORIA.md); los prompts y las referencias originales están en [docs/ASSETS.md](docs/ASSETS.md).

Las plantillas clásicas son distintas: celdas de 16 × 20. [chupalo_alexitico.txt](chupalo_alexitico.txt) documenta ese modo anterior; para la historia principal usa la guía chibi de [HISTORIA.md](HISTORIA.md).

La imagen del cómic está en `public/comics/jaja-uno-xd.png`, con su descripción en [docs/comics/README.md](docs/comics/README.md). Se abre desde la carta final. Los archivos dentro de `public/` se sirven desde la raíz pública: por ejemplo, `public/comics/jaja-uno-xd.png` corresponde a `./comics/jaja-uno-xd.png` en la aplicación.

## Edición de recuerdos

Los capítulos se definen en `src/story-content.ts`. Cada foto tiene `src`, `alt` y `caption`. Una foto sin `src` muestra un espacio reservado; una ruta que falla muestra un aviso. Cambia `CONTENT_IS_SAMPLE` solo después de sustituir todos los textos de ejemplo. [HISTORIA.md](HISTORIA.md) incluye los pasos completos y recomendaciones de privacidad.

## Sonido, móvil y guardado

El navegador requiere una interacción del usuario para iniciar audio. El botón de sonido controla música y efectos, y esa preferencia se conserva. El sonido se suspende al ocultar la aplicación o pausar la aventura; se intenta reanudar con una interacción. Si el navegador bloquea el audio, se muestra un aviso.

La aventura usa el espacio disponible, reservas para el notch y un botón de pantalla completa. Safari en iPhone puede mantener barras del navegador o sistema: el botón explica cómo añadir el sitio a la pantalla de inicio, sin prometer que desaparezcan todos los elementos del sistema. No hay funcionamiento sin conexión garantizado. La orientación vertical pausa los desafíos y propone girar el dispositivo.

El progreso guarda capítulo, desbloqueos, respuestas, personaje y sonido. Un desafío recargado comienza de nuevo; al borrar los datos del navegador también puede perderse el avance. Si localStorage falla, se permite seguir jugando con un aviso.

## Ejecutar, verificar y publicar código

Desde la raíz del proyecto:

```powershell
npm ci
npm run dev
npm test
npm run test:browser
npm run build
```

Para Playwright se puede usar Edge instalado o instalar Chromium con `npx playwright install chromium`. `npm run preview -- --port 5173 --strictPort` muestra la versión ya compilada. Las pruebas simulan audio, pantalla completa, tacto y rotación, pero **no sustituyen** una revisión con sonido real y Safari en un iPhone físico. Consulta [VALIDACION.md](VALIDACION.md).

El repositorio es `lugal3/valeteamo`. La historia ha trabajado en `demo/historia-cumpleanos-chibi` y también se ha integrado en `main`. Antes de trabajar, consulta `git status`, la rama actual y los cambios remotos; no sobrescribas cambios ajenos. Subir commits a GitHub no publica automáticamente un sitio. `firebase.json` prepara Hosting, pero no implica que exista un proyecto vinculado ni un despliegue activo.

## Pendientes y siguientes pasos útiles

1. Probar el juego en iPhone real: notch, pantalla completa, orientación, rendimiento, dos dedos y sonido audible.
2. Recibir los recuerdos y decidir cómo alojar las fotos con privacidad antes de integrarlas.
3. Ajustar el arte con las referencias que quiera crear el usuario; una guía de frente, perfil, espalda y cuatro pasos sirve para discutir el estilo antes de completar toda una hoja.
4. Seguir puliendo escenarios, respuesta de los controles y animaciones según pruebas reales; mantener pausas, accesibilidad, movimiento reducido y silencio.
5. Si el usuario desea una web pública, configurar y desplegar el hosting elegido después de revisar datos y fotos.

Para iniciar otro chat, basta con pedirle que lea este archivo, [README.md](README.md) y [HISTORIA.md](HISTORIA.md), revise `git status` y continúe desde el estado actual del repositorio.
