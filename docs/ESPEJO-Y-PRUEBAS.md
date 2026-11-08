# Espejo de Kitty y menú de pruebas

Solicitud autorizada: añadir un modelo de Kitty con linterna reflejado en el baño, agrupar pruebas, dar acceso directo al 2D de corazones y eliminar la superposición musical al entrar al 3D. Publicación solicitada en `main`.

## Prompt de implementación y continuidad

> Trabaja en `lugal3/valeteamo`. Mantén las mecánicas, sprites y guardados de los juegos 2D. Añade en la casa WebGL1 un espejo de baño de prueba con un modelo procedural de Hello Kitty reconocible: cabeza blanca sin boca, orejas, ojos oscuros, nariz amarilla, bigotes, moño rosa, vestido y linterna sostenida con la pata derecha. Refleja posición y orientación respecto al plano del espejo. Mantén el modelo dentro del marco mediante stencil y respeta las oclusiones de la escena. Incluye balanceo y pasos discretos. La linterna reflejada es visible, sin haz reflejado, sombras nuevas, interacción ni recursión. Usa una copia acotada del baño, geometría de bajo detalle y buffers reutilizados; omite el pase fuera del baño o al mirar en otra dirección. No agregues otro motor ni dependencias al juego.
>
> En Pruebas presenta tres tarjetas: 2D de corazones con Kitty animada (desafío isométrico nivel 2), recorrido completo de rescate 2D → 3D y casa 3D directa. Agrupa los checkpoints restantes en botones secundarios: Espejo, Cajón y pistas, Dormitorio y rescate, Aventura clásica, Historia y preguntas. No borres escenas. El modo de corazones no debe avanzar ni reemplazar la historia guardada. Añade un botón Espejo al HUD de las pruebas 3D para volver al baño, sin colocarlo en el recorrido normal.
>
> Al abandonar portada/historia para entrar en rescate, pruebas o clásico, cierra el sintetizador de historia y el jingle inicial. No vuelvas a mostrar la portada musical al abrir cada checkpoint. Conserva los controles independientes de ambiente, efectos y música de tensión de la casa. Verifica limpieza al salir, navegar repetidamente, pausar y recuperar foco. Ejecuta tests, build y pruebas visuales de navegador antes de publicar.

## Implementación

- `src/lab/mirror.js`: modelo procedural de bajo detalle, baño reflejado acotado, transformación especular, animación y posición de prueba.
- `src/lab/renderer.js`: un pase local con máscara stencil y profundidad; no se renderiza la casa completa por segunda vez. Conserva buffers, respeta puertas/oclusiones y libera recursos al salir. Si no hay stencil, conserva la superficie de cristal sin el efecto.
- `src/lab/house-layout.js`: espejo en la pared este del baño, marco y spawn seguro.
- `src/lab/house.js`: acceso del HUD exclusivo de pruebas y diagnóstico de visibilidad/soporte.
- `src/StoryApp.tsx`: tres accesos principales, herramientas secundarias, acceso directo al combate de corazones y propiedad del audio por experiencia.
- `src/demo/RescueDemo.tsx`: checkpoint del espejo y regreso al menú de pruebas. Se conserva el recorrido completo del jardín.
- `src/demo/welcome-melody.ts`: jingle cancelable al cambiar de experiencia.

Las preguntas siguen en la historia; el clásico sigue accesible; no se modificaron los motores `game.ts`, `iso-game.ts`, el arte ni las claves de guardado. El único cambio de CSS del rescate añade selectores del menú de pruebas.

## Alcance y límites

Es una prueba visual geométrica, sin luces reflejadas ni modelo externo descargable. El baño reflejado es una reconstrucción simplificada: la puerta y otros objetos móviles no se duplican dinámicamente. La ropa y la linterna no simulan física. La cámara en primera persona sigue igual. El costo depende de GPU, tamaño del espejo y dispositivo; las pruebas de Chromium no certifican FPS ni compatibilidad de Safari en un iPhone físico.

## Verificación

- `npm test`: pruebas existentes de combate, historia, guardados, audio, navegación, cámara, colisiones y ventana; nueva prueba de reflexión, colores, linterna y spawn.
- `npm run build`: TypeScript y producción Vite.
- `npm run test:browser`: recorrido de historia, audio real, sprites, táctil, rotación y recuperación.
- `node tests/mirror-browser.cjs`: tres tarjetas, acceso directo a Kitty/combate, desplazamiento lateral y frontal ante el espejo, ocultación al girar, exclusividad de AudioContext, guardados intactos, entrada por ventana y pérdida del contexto WebGL.
- Capturas en `docs/capturas/espejo/`.

En entornos con Chromium instalado fuera de Playwright, las pruebas aceptan `BROWSER_EXECUTABLE_PATH`.
