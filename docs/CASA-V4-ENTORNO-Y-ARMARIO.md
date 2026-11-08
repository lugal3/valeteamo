# Casa V4: distribución, entorno, armario y música

Encargo del 8 de noviembre de 2026. Base de comparación: `700e74c`. Rama: `codex/casa-v4-entorno-armario`. La especificación que se aplicó está en [AUTOPROMPT-CASA-V4.md](AUTOPROMPT-CASA-V4.md).

## Resultado de los comentarios

| Comentario | Implementación | Evidencia |
| --- | --- | --- |
| Escalera en medio del pasillo | Caja de escalera lateral, 16 peldaños y altura continua. El pasillo central queda libre. | [Escalera](capturas/casa-v4/06-escalera-lateral.png), [descansillo](capturas/casa-v4/07-descansillo.png) |
| Variedad de cuadros de One Direction | Seis carteles originales procedimentales: cinco voces, corazón, vinilo, carretera, estrellas y guitarra. Se conserva la pista del corazón. | [Sala de música](capturas/casa-v4/09-sala-musica.png) |
| Entorno exterior | Jardín transitable, sendero, calle, casas vecinas con tejado, árboles, plantas, coche y límites físicos. | [Casa y jardín](capturas/casa-v4/19-casa-y-jardin-completo.png), [vecindario](capturas/casa-v4/12-vecindario.png), [coche](capturas/casa-v4/20-auto.png) |
| Puerta desaparece abierta | Ocho hojas giran sobre bisagras y conservan geometría, colisión y oclusión en todos sus estados. El cierre comprueba todo el arco para evitar atrapar al jugador. | [Puerta abierta](capturas/casa-v4/13-puerta-abierta.png) |
| Mano demasiado grande | Linterna cilíndrica en la esquina inferior, con solo una pequeña parte de los dedos sujetando el mango. Se oculta al esconderse. | [Sala de estar](capturas/casa-v4/02-sala-estar.png) |
| Casa sin distribución lógica | Planta baja: recibidor, estudio, sala de estar, cocina/comedor y baño. Trampilla cerrada e inspeccionable para el futuro sótano. | [Cocina](capturas/casa-v4/04-cocina.png), [baño](capturas/casa-v4/05-bano.png) |
| Segundo piso poco amueblado | Dormitorio con cama, mesita, lámpara y armario; sala de lectura con biblioteca; sala de música con vinilo, guitarra y carteles. | [Dormitorio](capturas/casa-v4/08-dormitorio.png), [lectura](capturas/casa-v4/10-lectura.png) |
| Armario defectuoso | Interior hueco, dos hojas con lamas separadas, animación de aproximación, entrada, giro y cierre parcial. Salida inversa hasta un punto libre. Mirada limitada para no atravesar las paredes. | [Entrada](capturas/casa-v4/16-entrada-armario.png), [rendijas](capturas/casa-v4/17-mirar-rendijas.png), [salida](capturas/casa-v4/18-salida-armario.png) |
| Música de tensión | Composición original sintetizada: ostinato menor, pulso grave y notas lejanas. Volumen independiente, silencio persistente y limpieza al salir. | [Muestra de 10,5 segundos](capturas/casa-v4/musica-tension.wav) |

La distribución cambia por autorización expresa en los comentarios actuales. Se mantiene la progresión nota → cajón → llave + cuadro → dormitorio → rescate. La entrada por ventana desemboca ahora en la sala de estar. El sótano queda para una ampliación posterior, como pidió el propietario.

## Implementación

`house-layout.js` define habitaciones, huecos de puertas/ventanas, muebles y exterior. `world.js`, `navigation.js` y `lighting.js` comparten las mismas posiciones y rotaciones para movimiento, alcance y luz. La geometría de las puertas se actualiza con su bisagra, incluidos pomo y panel. Los detalles pequeños son decorativos; los cuerpos de muebles, árboles, vecinos, coche y límites conservan colisión.

`hiding.js` calcula la secuencia de cámara del escondite. `house.js` bloquea entradas durante esa secuencia, la congela al pausar y respeta movimiento reducido. Las rendijas son huecos reales entre lamas, no una imagen superpuesta. Se verifican también la entrada y salida bajo la cama y la postura acostada, con la cámara sobre el nuevo colchón. La puerta del dormitorio abre hacia el distribuidor para no cruzar la cama.

`artwork.js` crea seis diseños en un atlas pequeño; `first-person.js` reutiliza la geometría de linterna y dedos. Los tejados, hojas y superficies emplean el renderizador WebGL1 existente. Se conserva el atlas de materiales de la entrega anterior y se añaden colores/materiales de jardín, carretera y coche sin recursos externos ni dependencias nuevas.

`tension-music.js` contiene la partitura procedural. `sound.js` programa un pequeño margen de notas y libera cada voz al terminar; salta pulsos atrasados si el navegador se detiene. Pausa, ajustes, pérdida de foco y salida no crean pistas adicionales. La música empieza después del gesto de inicio y usa la preferencia de silencio existente de la casa.

Fuentes nuevas: `house-layout.js`, `artwork.js`, `first-person.js`, `hiding.js` y `tension-music.js`. Fuentes adaptadas: `house.js`, `world.js`, `navigation.js`, `renderer.js`, `lighting.js`, `materials.js`, `material-shaders.js`, `sound.js`, `window-intro.js` y `furniture-motion.js`, todas bajo `src/lab/`. La preparación de posiciones del hook DEV comparte la comprobación del arco de apertura, sin saltarse la seguridad del jugador. Pruebas nuevas: `tests/house-v4-browser.cjs` y `tests/house-v4-renderer.cjs`; se adaptan `lab.cjs`, `house-navigation.cjs`, `window-intro.cjs` y `house-3d-browser.cjs`. Documentación: autoprompt, este informe, índice del contexto y capturas V4.

## Protección del 2D

Todos los cambios de producto están en `src/lab/`. No se modifican `StoryApp.tsx`, `main.tsx`, el prólogo `src/demo/`, historia, clásico, sprites, arte, música 2D, CSS compartido, rutas ni claves de guardado. No se añaden paquetes.

El test V4 conserva los valores válidos de historia y rescate byte por byte al volver al menú. El test de regresión verifica además controles simultáneos y limpieza del audio. Los archivos de capturas anteriores se conservan.

## Verificación y mediciones

Los resultados automatizados se guardan bajo [capturas/casa-v4](capturas/casa-v4). Las pruebas de navegador usan Chromium/SwiftShader y una pantalla emulada de 960 × 540; la compilación se revisa también a 844 × 390. Los hooks DEV preparan posiciones y permiten comprobar interacciones reales, pero no se incluyen en producción.

El movimiento por la escalera y la salida al jardín se realizan con teclas del navegador. La prueba de dos dedos usa dos contactos táctiles reales de CDP. El armario se activa mediante el botón contextual; se comprueba pausa a mitad de entrada, mirada limitada, salida y movimiento reducido. La prueba de música mide una señal de audio con ambiente y efectos a cero, comprueba un único programador y el cierre de todos los contextos al salir.

| Comprobación | Resultado |
| --- | --- |
| `npm test` | Correcto: historia, clásico, rescate, audio, materiales, colisiones, ocho puertas, escaleras, cámara y entrada por ventana. |
| `npm run build` | Correcto; continúa el aviso previo del tamaño del chunk de Phaser. |
| `npm run test:browser` | Correcto: historia 2D, objetos, audio, cómic, pantalla completa, rotación, dos contactos y recuperación de guardado. Sin cambios en este test. |
| `node tests/demo-browser.cjs` | Correcto: cumpleaños, secuestro 2D, transición, nota/cajón/llave/cuadro, desbloqueo y rescate final. |
| `node tests/house-3d-browser.cjs` | Correcto: dos contactos simultáneos (1,29 m de avance y 0,275 rad de giro), ajustes, puertas, cierre seguro, cajón animado, pausa, movimiento reducido, ventana y limpieza de tres contextos de audio. |
| `node tests/house-v4-browser.cjs` | Correcto: 14 vistas de habitaciones/exterior, escaleras y salida física, hojas visibles y sólidas, entrada/salida del armario, rendijas, cama y escondite inferior, pausa, movimiento reducido, música y guardados protegidos. |
| `node tests/house-v4-renderer.cjs` | Correcto: comparación con `700e74c`, dos vistas y dos calidades, sin errores WebGL. |
| `node tests/house-production-browser.cjs` | Correcto sobre `dist`: 844 × 390, pausa, ajustes, silencio, reinicio, menú, cero errores WebGL y ausencia de hooks DEV. |
| Protección de fuentes y formato | Sin diferencias fuera de `src/lab` en código de producto, assets públicos, entrada ni dependencias; `git diff --check` correcto. |

Resultados de navegador: [V4](capturas/casa-v4/resultados.json), [regresión](capturas/casa-v4/regresion/resultados.json), [compilación móvil](capturas/casa-v4/production/00-compilacion-movil.png). El test 3D de regresión sitúa la cámara hacia la hoja girada para usar una puerta abierta; ya no apunta al centro del hueco vacío.

La comparación del render usa el mismo navegador, cámaras, resolución, linterna encendida y 40 muestras por vista/calidad, después de 10 fotogramas de calentamiento. Incluye el pasillo y una vista exterior; la escena nueva contiene más geometría por el barrio, muebles y lamas. Los tiempos son del render aislado con GPU por software, no FPS sostenidos del juego ni una medida de iPhone.

| Vista / calidad | Resolución interna | Mediana antes | Mediana V4 | P90 antes / V4 |
| --- | --- | ---: | ---: | ---: |
| Pasillo / Detalles | 768 × 432 | 20,7 ms | 27,6 ms | 22,7 / 29,1 ms |
| Exterior / Detalles | 768 × 432 | 8,6 ms | 16,2 ms | 9,8 / 18,2 ms |
| Pasillo / Fluido | 528 × 297 | 5,0 ms | 8,3 ms | 6,1 / 9,7 ms |
| Exterior / Fluido | 528 × 297 | 2,5 ms | 4,0 ms | 5,1 / 5,0 ms |

La escena de comparación pasa de 2.696 a 11.628 triángulos. El coste mediano del pasillo aumenta 6,9 ms en Detalles y 3,3 ms en Fluido. Se conserva la adaptación automática a Fluido para equipos lentos. Datos completos y capturas con cámaras idénticas: [antes](capturas/casa-v4/before/mediciones.json), [después](capturas/casa-v4/after/mediciones.json), [pasillo antes](capturas/casa-v4/before/pasillo-medium.png), [pasillo V4](capturas/casa-v4/after/pasillo-medium.png), [exterior antes](capturas/casa-v4/before/exterior-medium.png), [exterior V4](capturas/casa-v4/after/exterior-medium.png). Sin errores WebGL en ambas calidades.

Reproducción en PowerShell:

```powershell
npm test
npm run build
npm run test:browser
node tests/demo-browser.cjs
$env:HOUSE_QA_DIR='docs/capturas/casa-v4/regresion'
node tests/house-3d-browser.cjs
node tests/house-v4-browser.cjs
$env:HOUSE_QA_REF='700e74c'
node tests/house-v4-renderer.cjs
Remove-Item Env:\HOUSE_QA_REF
node tests/house-v4-renderer.cjs
$env:HOUSE_QA_DIR='docs/capturas/casa-v4/production'
node tests/house-production-browser.cjs
```

## Límites

No se ha probado un iPhone físico ni Safari. Continúan las sombras aproximadas del modo Detalles y la simplificación de iluminación del modo Fluido. El vidrio es una aproximación opaca, sin reflejos reales del entorno. La casa y el barrio usan geometría ligera, coherente con el motor actual. La música es original y los carteles son arte de fans dibujado por código, sin grabaciones, fotografías ni portadas externas.
