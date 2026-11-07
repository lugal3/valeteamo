# Prueba 3D — Valeteamo (rama experimental)

Este módulo añade una **casa explorable en WebGL1** al proyecto sin sustituir React, Phaser ni la historia 2D. No implementa enemigos, combate ni rescate. La prueba está aislada en `src/lab/` y se activa al cargar mediante **una sola etiqueta `<script type="module" src="/src/lab/index.js">`** añadida a `index.html`. Para desactivar el menú experimental basta eliminar esa etiqueta; el juego 2D anterior permanece sin modificaciones.

## Cómo entrar

1. `npm ci`
2. `npm run dev`
3. En el menú de pruebas, elegir planta baja, planta alta, iluminación/sonido, interacciones, transición o juego 2D.
4. Dentro de la casa, pulsar **Entrar / activar sonido** (los navegadores requieren un gesto).

No se despliega a Firebase automáticamente. El juego 2D conserva el avance con su clave anterior; la casa **no lo lee ni lo modifica**. La casa reinicia su propio estado con cada entrada y con el botón **Reiniciar escenario**. Solo se guardan preferencias de audio 3D con la clave `valeteamo-lab-sound-v1`.

## Controles

- **Celular horizontal**: joystick izquierdo caminar; arrastrar lado derecho para mirar; **USAR**, **AGACHAR**, **LUZ**, **MOCHILA**; pausa arriba. El juego pausa en vertical, y guarda en memoria la posición hasta volver a horizontal.
- **Teclado para depuración**: WASD, flechas para mirar, E usar, C agacharse, F linterna, I mochila, Escape pausa.
- El menú de diagnóstico permite calidad media (objetivo 60 FPS) o baja (límite 30 FPS), sensibilidad, reducción de balanceo, volumen de ambiente/efectos y mute.
- La batería solo se consume con la linterna encendida. Se recarga manualmente desde la mochila usando una pila. La llave de prueba abre la puerta del dormitorio.
- La cama permite acostarse y levantarse; el armario y el espacio bajo la cama son escondites independientes, sin perseguidor.

## Organización técnica

- `world.js`: mapa editable determinista, colisiones axis-aligned, alturas y escalera, puertas, muebles y objetos.
- `renderer.js`: WebGL1 con cámara de perspectiva yaw/pitch, superficies 3D, buffer de profundidad, luz ambiente, foco de linterna, atlas de cuatro cuadros creado localmente y resolución limitada; **sin dependencia externa**.
- `house.js`: bucle de juego independiente del 2D, cámara, físicas simples, selección con alcance y oclusión, inventario y gestos táctiles.
- `sound.js`: audio procedimental original con atenuación por distancia, paneo estéreo aproximado y reducción por obstáculos/pisos. No utiliza MP3 ni pistas de terceros.
- `index.js`, `lab.css`: menú experimental, controles y accesibilidad móvil.
- `tests/lab.cjs`: pruebas de diseño y reglas geométricas (`node tests/lab.cjs`).

## Alcance y limitaciones verificables

El renderizador dibuja geometría espacial real (no es una imagen 2D), pero los muebles se construyen con volúmenes simples y los cuadros usan un atlas pixelado. No hay sombras dinámicas ni oclusión exacta de la luz de linterna; el **buffer de profundidad** impide ver a través de paredes, pero ciertas superficies lejanas pueden iluminarse de forma aproximada. El audio espacial emplea paneo/atenuación simples, no binaural ni HRTF. No hay física rígida. Los efectos son sintéticos y provisionales. Los accesos de prueba no conceden progreso narrativo, y la transición a la casa es un puente separado, no un desbloqueo del 2D.

No se puede prometer FPS, compatibilidad Safari o validación en iPhone físico sin probarlos en ese dispositivo. No se añaden paquetes externos, recursos remotos ni modelos pesados. Las opciones de calidad apuntan a 60/30 FPS, **no equivalen a mediciones**. Se recomienda comprobar en iPhone horizontal, repetidos reingresos, audio con auriculares y altavoz, batería, colisiones, pausa, multitáctil y recuperación del contexto WebGL.
