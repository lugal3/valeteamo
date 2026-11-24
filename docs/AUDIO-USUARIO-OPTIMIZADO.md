# Paquete de sonidos aportados por el usuario

Se incorporaron **nueve grabaciones reales** a ValeTeAmo para el prólogo 2D y la casa 3D, sin modificar el 2D original de Corazones. El usuario solicitó específicamente comprimirlas y subirlas a `main`.

## Organización, disparadores y calidad

| Grabación original | ID del juego | Evento |
|---|---|---|
| `cat_meow.wav` | `cat-meow` | Maullidos de Emy, escaneo, distracciones, rescate |
| `cat_purr.wav` | `cat-purr` | Acariciar a Emy |
| `churu_open.wav` | `churu-open` | Abrir/ofrecer Churu durante el prólogo 2D |
| `danger_alert(1).wav` | `danger-alert` | El secuestrador detecta a Kitty |
| `hatch_close.wav` | `hatch-close` | Trampa y cierre de escotilla del sótano |
| `power_cut.wav` | `power-cut` | Cortar la electricidad mediante interruptor |
| `rc_motor_loop.wav` | `rc-motor` | Auto RC conduciendo: bucle con variación de velocidad |
| `van_door_close.wav` | `van-door` | Puerta de furgoneta durante secuestro 2D |
| `van_drive_away.wav` | `van-away` | Furgoneta escapando durante secuestro 2D |

- WAV originales combinados: **~19,6 MiB**.
- Las nueve copias editables compridas están en `src/lab/audio/user/*.ogg`: **~107 KiB en conjunto**.
- La reproducción del juego prefiere un único **`src/lab/audio/user-sprite.ogg` de 64.170 bytes**, Opus mono a 24 kHz, duración ~42,8 s, con pausas aislando nueve eventos.
- Alternativa **`src/lab/audio/user-sprite.mp3` de 171.500 bytes** para Safari/iPhone o navegadores sin soporte Opus. Se carga únicamente si falla la decodificación del Ogg.
- Conservamos clips individuales para sustituir sonidos sin recodificar el paquete completo, y previews anteriores como alternativa si ambas versiones fallan.
- Ronroneo usado en el sprite: fragmento de 5,3 s; audio original de 43,2 s. Furgoneta usada en el sprite: fragmento de 13 s; audio original de 23,2 s. Se eliminaron colas extensas y se mezcló a mono porque no requieren espacialidad estéreo fija.

## Arquitectura y pruebas

- `src/lab/recorded-audio.js` decodifica el sprite una vez y usa rangos de segundos para cada efecto; el motor RC obtiene una muestra recortada y la repite con su lógica original.
- `src/lab/audio/user-sprite-index.js` mantiene offsets y duraciones exactos.
- `src/audio.ts` toma las cuatro pistas para el 2D sin romper su loader TS de pruebas; los previews existentes continúan como respaldo.
- `src/lab/house.js` vincula ronroneo, aviso de peligro, cortes eléctricos y escotilla. Los eventos Churu/furgoneta ya estaban en `GardenPrologue.tsx`.
- `tests/user-audio.cjs` verifica firmas Ogg/Opus, presencia de todos los assets, límites de bytes, SHA256 del sprite y nombres de eventos. `tests/emy-abilities-browser.cjs` exige además decodificación en Chromium y WebKit mediante Web Audio.
- Los audios fueron proporcionados por el usuario. No se ha verificado individualmente la licencia de redistribución de cada grabación original.

No hay que cargar los nueve WAV enormes en el navegador. Las copias comprimidas se conservan como recursos para edición, pero la reproducción normal requiere una sola descarga corta del sprite.
