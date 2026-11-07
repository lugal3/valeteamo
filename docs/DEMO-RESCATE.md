# Demo jugable VALETEAMO · rescate 2D → 3D

**Rama:** `feature/demo-rescate-2d-3d`. **No fusionar a `main` ni desplegar** durante la revisión. El workflow `demo-rescue-checks.yml` solo ejecuta pruebas y compilación.

## Tecnologías y decisión 3D

- La aventura de cumpleaños y el juego clásico siguen en React 19, TypeScript y Phaser 3, sin modificar su progreso ni su contenido.
- La demo usa Phaser para un tramo 2D autocontenido, y el motor WebGL1 ligero ya existente para la casa.
- **No se migra a Three.js por ahora:** evitar dependencias y reescritura permite reutilizar los dos pisos, las interacciones, colisiones, texturas y audio espacial existentes con menor riesgo de regresiones. La geometría 3D de la patita y linterna se dibuja en una segunda pasada de profundidad.
- Limitación reconocida: el renderizador WebGL propio es menos fácil de ampliar con animaciones y modelos complejos; si crece el arte 3D, evaluar Three.js en una habitación representativa antes de migrar más.

## Ejecutar

```sh
npm ci
npm run dev
npm test
npm run build
```

Abre el enlace local de Vite. Aparece la portada común *VALETEAMO*; un clic, toque o tecla válida lleva a la interfaz original de **Feliz cumpleaños**. Pulsa **Jugar la demo de rescate 2D → 3D** para iniciar. La aventura clásica y todos los capítulos antiguos permanecen disponibles.

> **Imagen de portada:** el componente ya tiene la ruta `public/demo-assets/005-portada-valeteamo.jpeg`. Aún debe copiarse el JPEG del catálogo 005 allí; mientras tanto se muestra una portada ilustrativa temporal sin bloquear el inicio. Las demás 18 imágenes siguen pendientes de adaptar. Ver [RECURSOS-DEMO.md](RECURSOS-DEMO.md).

## Recorrido corto

1. **Jardín 2D:** controla a Kitty (WASD, flechas o joystick táctil); acércate al corazón, pulsa **Recoger corazón / E**.
2. **Secuestro:** aparece una sombra y Louis desaparece ante el jugador; es una animación no violenta.
3. **Pistas 2D:** sigue el pétalo luminoso y pulsa **Seguir pétalos**, después ve a la casa y pulsa **Abrir puerta**.
4. **Puente 2D→3D:** lee el mensaje de transición y pulsa **Entrar a buscar a Louis**. Se desmonta Phaser antes de arrancar WebGL.
5. **Casa 3D, primer puzzle:** lee la nota doblada del pasillo, accede al estudio y abre el cajón; recoge la llave con lazo.
6. **Segundo puzzle:** examina el cuadro del salón con la marca en forma de corazón, luego sube las escaleras y abre el dormitorio con la llave y el símbolo.
7. **Rescate y cierre:** acércate a Louis en el dormitorio, pulsa el botón contextual **Rescatar**, luego **Terminar la demo**. Aparece el cierre con opción de reiniciar.

En 3D mueve con joystick izquierdo y mira arrastrando en el lado derecho; usa **E** en teclado. El botón de acción aparece solo frente a un objeto a distancia y con línea de visión. El cuerpo del personaje se mueve mediante pasos cortos y deslizamiento por ejes. El inventario se abre con **I**; pausa con Esc. La linterna en esta demo es ilimitada para evitar bloqueos.

## Menú de pruebas (no modifica la partida normal)

Desde la portada del cumpleaños pulsa el botón pequeño **Pruebas**: inicio 2D, secuestro, pista, casa, cajón, cerradura y rescate. Cada punto prepara su propio estado y no escribe el guardado normal de la demo.

El progreso de la demo usa `valeteamo-rescue-v2` en localStorage, independiente del original `valeteamo-story-v1`. Un guardado mal formado reinicia solamente la demo. **Volver a jugar** desde el cierre elimina exclusivamente el progreso de la demo.

## Pruebas y limitaciones

- `npm test`: incluye transiciones de la demo, guardado inválido y condiciones de los dos puzzles.
- `npm run build`: valida TypeScript y empaqueta Vite.
- CI de esta rama: **sin Firebase**; el pipeline de Hosting de `main` no se ejecuta por estos commits.
- Pendiente de verificación con navegador real: interacción táctil simultánea, recarga, cambio de orientación, ciclo de pausa, audio real y recorridos con todos los muebles. Los tests de Node no prueban renderizado visual ni Safari.
- Pendiente artístico: los 19 JPEG no se han transferido a GitHub, no son hojas de sprites listas para usar; el 2D provisional reutiliza las hojas ya presentes y la casa usa materiales simples existentes.
- La salida 3D y la vuelta a la portada detienen el bucle y liberan el renderizador; no se inicia la pantalla de bienvenida del 3D de nuevo durante el cambio natural de modo, aunque sí aparece su mensaje contextual de entrada.

## Referencia de la interfaz

La presentación de cumpleaños existente se conserva selectivamente desde `src/StoryApp.tsx` de la línea base (`b64f82c53ac519ec103a61f3cfcf13ae50c1676f`). El commit `de794dfc75700c7bedc0c6f16255018a04fe01da` introdujo el script del menú de pruebas como overlay global; esta rama lo desactiva exclusivamente en `index.html`, sin revertir el resto del juego ni los arreglos del shader `uEye`.
