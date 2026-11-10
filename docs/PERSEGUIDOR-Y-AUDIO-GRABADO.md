# Tramo del perseguidor y grabaciones recortadas

10 de noviembre de 2026. Base `b896135`, rama `codex/perseguidor-y-audio-grabado`. Encargo: analizar/recortar los archivos aportados, implementar su uso y continuar el tramo de la casa tras el aviso del teléfono. **Sin merge, push ni despliegue.** Las fuentes de producto y los assets nuevos están exclusivamente en `src/lab/`; no cambian `public/`, dependencias del juego, orquestación, sprites, CSS compartido, código 2D ni claves de guardado.

## Secuencia jugable

1. Llave y pista del cuadro generan el aviso de Mi Luis y su respuesta automática existentes, ahora con la notificación grabada.
2. Al abrir el dormitorio se encadena la llegada: plano de la entrada, desbloqueo grabado, forcejeo y movimiento de la hoja. Se conserva el breve plano de Kitty. La música cambia mediante fundido a la pista de tensión aportada.
3. Regresa el control con diez segundos de preparación. Armario y bajo la cama siguen siendo escondites físicos con sus animaciones. El teléfono no pausa el peligro; pausa, ajustes, editor de HUD, pérdida de foco y orientación vertical sí lo detienen.
4. Terminado el aviso entra una figura encapuchada por la puerta principal. Sube la escalera, abre puertas y registra el distribuidor/dormitorio. Avisos distintos indican búsqueda, sospecha y persecución; los pasos tienen posición y atenuación. No se añade un susto visual automático ni se reproduce el tramo fuerte completo del posible screamer.
5. La visión depende de distancia, orientación, paredes/puertas y altura. Agacharse reduce la distancia de detección. Corre más lentamente que Kitty de pie; perder la línea de visión durante tres segundos permite despistarlo. Sigue la última posición observada, no la posición oculta real del jugador.
6. Si ve entrar en un escondite recuerda cuál fue y puede encontrarte al acercarse. Entrar sin ser visto protege también si el personaje pasa cerca. No se permite cerrar una puerta sobre el cuerpo del perseguidor.
7. La búsqueda dura al menos 28 segundos activos y exige que haya llegado a la planta alta y al distribuidor; no termina por agotar un reloj si la IA no ha llegado. Tras perderte de vista y calmarse, se retira. Un nuevo mensaje y objetivo autorizan buscar a Louis en el dormitorio. Interactuar con él muestra **Tramo superado**.
8. Si te alcanza, **Te descubrieron** permite reintentar desde la llegada, conservando llave, pistas y conversación de esta sesión. Se limpian sospecha, memoria, ruta, escondite y animación. Reiniciar la casa limpia el tramo completo. No se escribe progreso nuevo en los guardados 2D/rescate. El checkpoint avanzado de rescate conserva su comportamiento previo.

## IA y representación

`pursuer.js` crea una cuadrícula de 40 cm con niveles conectados por la rampa real de la escalera. Comprueba volumen corporal y muestras entre celdas para no cruzar paredes finas. Calcula rutas A*, abre las hojas por el sistema de muebles existente y desplaza al personaje con el mismo movimiento barrido del jugador. Las hojas abiertas también intervienen al recalcular la ruta. La ruta se prepara al comenzar la búsqueda, no en cada fotograma.

`pursuer-model.js` es una malla propia de abrigo/capucha y extremidades animadas por distancia. Se dibuja con profundidad en el mundo y en el espejo, con buffers reutilizados que se liberan al salir. No es una imagen pegada a la cámara. El HUD de amenaza se compacta y separa de los avisos para dejar visible la escena.

## Procesamiento del audio

Los once originales se leen desde la carpeta proporcionada y **no se modifican**. El archivo sin extensión es decodificable: dura aproximadamente 80,25 s. Se documentan forma de onda, envolvente RMS, duración, zonas activas y hash SHA-256; esto no sustituye una valoración auditiva del propietario.

Herramientas locales reproducibles: `src/lab/tools/analyze_audio.py` y `prepare_audio.py`, con numpy, matplotlib e imageio-ffmpeg del entorno de trabajo. No se añaden dependencias a `package.json`. El análisis produce arrays temporales `.npy` que no se versionan; se pueden regenerar desde los originales.

La salida son **16 WAV PCM mono, 22.050 Hz/16 bits, aproximadamente 2,4 MB en total**. Se eliminan DC y silencios sobrantes, se aplican fundidos cortos y un límite de pico de 0,78; las dos pistas de fondo usan un solapamiento de 450 ms para el bucle. Los niveles finales se equilibran en los buses del juego, sin acelerar la reproducción para fabricar sonidos distintos.

| Uso | Original y tramo en segundos |
|---|---|
| Abrir puerta | `open-close-door.wav`, **0–0,88** |
| Cerrar puerta | mismo original, **1,84–2,87**; se descarta el silencio entre acciones |
| Cerrar armario | `closet-cerrar-2do-piso.wav`, 1,43–2,14 |
| Desbloqueo | `desbloqueo-puerta-evento.wav`, 1,22–3,60 |
| Forcejeo | `trying-open-door-evento.mp3`, 0,22–3,35 |
| Notificación | `740423__anthonyrox__message-notification-4.wav`, 0–0,319 |
| Interruptor | `flashlight-turn-off.wav`, 0,08–0,75 |
| Tres pasos de madera | `foot-steeps-wood.wav`, 9,18–9,63; 10,07–10,48; 12,18–12,61 |
| Tres peldaños | `climbing-stairs.wav`, 0,65–1,04; 2,02–2,42; 5,05–5,48 |
| Fondo | `sonido-ambiente-base-suspenso.wav`, 1–24 |
| Tensión | `sonido-para-evento-esconderse-de-perseguidor.flac`, 4–24 |
| Alerta breve al verte | `efecto-tension-quizas-screamer`, 0,85–1,52; se deja fuera el bloque fuerte central |

`src/lab/audio/manifest.json` conserva los cortes, hashes de origen/salida, tamaños y procedencia. `recorded-audio.js` carga/decodifica una sola vez por sesión; mantiene hasta 18 efectos simultáneos, alterna los tres pasos y tres peldaños, funde los fondos y conserva su posición al pausar. Salir cancela peticiones y libera fuentes, nodos y buffers. Se respetan silencio y volúmenes existentes; el fondo musical va al control de música, no al de efectos. Si falta una grabación hay respaldo procedural. El ambiente por zonas y los crujidos de presión mantienen su respaldo sintetizado: no se inventa una grabación de piso que no se haya identificado en los archivos.

## Procedencia y publicación

El propietario indica que descargó los sonidos de Freesound y que el juego no tiene fin comercial. Eso se registra **sin afirmar CC0 para los archivos renombrados**: faltan enlaces, autores y licencias concretas. La integración queda local, como se pidió; antes de una publicación hay que completar esa información y los créditos/restricciones que correspondan. No se han descargado otras bibliotecas ni se han subido los originales.

## Verificación

- `npm test` incluye `tests/pursuer.cjs`: recorrido físico hasta el dormitorio, apertura de puertas, escaleras, oclusión, escondite visto/no visto, reinicio, condición de avance, hashes y límites de los 16 cortes.
- `tests/pursuer-browser.cjs`: carga real de WAV, acciones separadas de puerta, aviso/respuesta, captura, reintento, armario, pausa, retirada y avance a Louis; cero errores JavaScript/WebGL y cierre de contextos.
- `tests/demo-browser.cjs`: conserva el prólogo 2D y adapta únicamente el final 3D al perseguidor, usando bajo la cama como segunda opción de escondite.
- `tests/phone-events-browser.cjs` se actualiza para esperar la búsqueda/retirada antes del final del tramo.
- `npm run build` y prueba de producción local, sin hooks de desarrollo. No se ejecuta una prueba ni un despliegue contra Firebase.

La verificación visual es Chromium con GPU por software. No acredita Safari/iPhone físico ni una tasa de 60 FPS. La IA es un tramo acotado de búsqueda/persecución, no un sistema de enemigos de toda una campaña.

[Análisis de la puerta](capturas/perseguidor/audio-analisis/open-close-door.wav.png) · [Resultados del navegador](capturas/perseguidor/juego/resultados.json) · [Perseguidor](capturas/perseguidor/juego/03-perseguidor.png) · [Armario](capturas/perseguidor/juego/05-armario.png) · [Avance](capturas/perseguidor/juego/07-avance.png).
