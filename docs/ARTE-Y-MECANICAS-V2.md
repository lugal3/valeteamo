# Kit visual reinterpretado · VALETEAMO v2

Estos recursos fueron reinterpretados a partir de las ilustraciones de referencia entregadas en la conversación. Se preservan los 19 JPEG originales de la entrega previa en `assets/originales/` y las versiones WebP anteriores en `public/demo-assets/referencias/`.

## Recursos nuevos

| Archivo | Uso | Distribución | Estado |
|---|---|---|---|
| `public/demo-assets/portada-v2.webp` | Portada viva, 16:9, ilustración centrada y con más contraste | Imagen completa | **Integrado en Splash.tsx** |
| `kitty-poses.webp` | Gatita en 8 poses: frente, caminata, lateral, espalda, patita y linterna | 4 columnas × 2 filas | Kit para futuros sprites |
| `iconos-aventura.webp` | Linterna, mano-gatita, slimes, fantasma, farol, poción, corazón, moneda, brillo, llave y cursor | 4 columnas × 3 filas | Kit para futuro HUD |
| `casa-y-jardin.webp` | Escaleras, puertas, umbrales, suelos, muebles, vegetación y jardín | 5 columnas × 4 filas | Referencia modular, **no** mallas 3D listas |

Las láminas se entregan en WebP para mantener liviano el repositorio. Los personajes todavía pueden necesitar recorte fino de alfa, alineación y revisión de fotogramas antes de usar el atlas en Phaser. El kit isométrico es **arte de referencia**; no se debe usar como atlas de texturas 3D repetibles sin preparar piezas individuales.

## Motor 3D

La mano y la linterna visibles en la cámara **no** son un recorte plano del kit; son geometría 3D procedimental nueva, con tonos pastel, almohadillas, cuerpo de linterna, interruptor y lente. La ambientación usa la iluminación de WebGL existente. Las nuevas láminas son una biblioteca visual para el siguiente paso artístico.

## Objetivo de la mejora

- Recorrer cómodamente los pasillos y las escaleras sin tener que acertar exactamente al picaporte.
- Aceleración gradual en joystick con zona muerta y escala de velocidad progresiva.
- Puertas no cerradas por puzzles que se abren al acercarse; el dormitorio bloqueado mantiene las dos pistas.
- Portada a color, partículas superpuestas y un sonido de entrada original que respeta «silenciar».

### Limitaciones y validación

Las pruebas automatizadas prueban colisiones, ascenso/descenso y flujo del juego en Chromium. Esto no sustituye un recorrido manual en dispositivo iPhone/Android, especialmente para multitouch y rotación de pantalla.
