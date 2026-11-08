# Casa 3D: materiales, colisiones y cajón animado

8 de noviembre de 2026. Base: `611e0c28a4c85764233c862c1119749351c0682b`. Rama: `codex/casa-3d-materiales-cajon`.

## Alcance y conservación

Se conserva la misma casa, habitaciones, muebles, escaleras, recorrido, controles, menús y secuencia de puzzles. No se añaden mecánicas ni dependencias. El renderizador sigue siendo WebGL1.

Historia, clásico y prólogo 2D, portada, CSS compartido, sprites, audio, rutas y claves de guardado permanecen idénticos a la base. No se modifican `StoryApp.tsx`, `RescueDemo.tsx`, `demo/house-puzzles.js`, `lab/lab.css`, `navigation.js`, `public/`, `package.json`, lockfile ni workflows.

Se verifica con:

```powershell
git diff --quiet 611e0c2 -- src ':!src/lab' public index.html package.json package-lock.json
```

## Diagnóstico y cambios

La versión base utilizaba pocos patrones de shader para muchas superficies distintas. Las vetas y variaciones aparecían como bandas grandes; la patita y linterna mantenían aristas de cajas. El cajón cambiaba instantáneamente de posición hacia dentro del bloque sólido del escritorio, y la llave estaba sobre la mesa. Algunos checkpoints nacían dentro de muebles.

Ahora se genera una biblioteca original de 16 materiales neutros, tintados con la paleta existente. Un único atlas RGBA de 256 × 256 almacena intensidad, normal tangente XY y rugosidad: **256 KiB adicionales de textura GPU**, sin descargar imágenes. Se genera una vez y se reutiliza; no se carga ni modifica ninguno de los originales o sprites existentes.

Las UV dependen del tamaño real de la superficie y de la dirección de construcción. La madera sigue el eje largo de la pieza; suelo y juntas mantienen escala espacial; la textura del cajón se desplaza con el cajón. Las normales proporcionan microrelieve en Detalles; no se presentan como desplazamiento geométrico real.

| ID | Material | Usos |
| --- | --- | --- |
| 00 | Papel mural | Paredes rosadas y azules, motivo discreto |
| 01 | Yeso | Superficies de plaster y techo |
| 02 | Madera | Puertas, marcos, escritorios, estantes, armario y molduras |
| 03 | Tablones | Suelo, entrepiso y peldaños, con juntas y veta |
| 04 | Cerámica | Encimera y piezas de baldosa |
| 05 | Tejido | Sofá, cortinas, manta, colchón, almohada, manga y lazos |
| 06 | Alfombra | Alfombras y corredores |
| 07 | Metal | Tiradores, latón, linterna y tapas metálicas |
| 08 | Hoja | Nervadura de la vegetación con volumen existente |
| 09 | Papel | Notas, papeles y libros |
| 10 | Arcilla | Macetas |
| 11 | Vidrio | Cristales y lente de la linterna |
| 12 | Patita | Mano y almohadillas, superficie suave |
| 13 | Laca | Frente pintado del cajón |
| 14 | Tallo | Tallos de plantas |
| 15 | Suave | Remates y superficies lisas restantes |

[Catálogo visual de materiales](capturas/materiales-3d/after/11-catalogo.png). Las muestras son neutras: el color final lo aporta la paleta de cada objeto.

La iluminación comprime las altas luces y conserva gradientes continuos. La contribución de lámparas se limita por planta y zona; se mantiene la oclusión aproximada de linterna. Patita y almohadillas usan volúmenes redondeados; la linterna usa secciones cilíndricas y materiales diferenciados. Se conservan tamaños y colocación en cámara.

## Cajón y puertas

El escritorio conserva centro, anchura, profundidad y altura máxima. Se sustituye su bloque visual por tablero, patas, respaldo y alojamiento del cajón, para dejar una cavidad auténtica. El frente, bandeja, laterales, fondo y tirador se desplazan juntos **0,42 m hacia fuera**. La apertura/cierre dura 0,42 segundos de simulación con aceleración y frenado suaves.

Los estados son `closed`, `opening`, `open`, `closing`. Una acción en curso no se reinicia por pulsaciones repetidas. La pausa congela tanto el cajón como su contenido. Con movimiento reducido se completa directamente la misma acción, conservando sus comprobaciones físicas.

La misma llave existente se coloca dentro de la bandeja y se representa con aro, vástago, diente y lazo. Acompaña el desplazamiento, se oculta al cerrar y no puede recogerse durante la animación. Recogerla continúa usando el puzzle y evento anteriores; reabrir el cajón no la duplica.

Las cinco puertas existentes también se deslizan suavemente. Su volumen sólido acompaña la posición durante el movimiento. La validación del recorrido impide abrir/cerrar una pieza sobre el cuerpo; si el jugador ocupa el siguiente tramo, la animación espera sin empujarlo ni atravesarlo. Se mantienen la apertura automática cercana con línea de visión y el respeto a una puerta cerrada manualmente.

Los muebles móviles tienen buffers separados. Durante la animación se actualizan únicamente los rangos de vértices afectados con `bufferSubData`; no se reconstruye la casa cada fotograma.

## Colisiones

- Se conserva el radio de jugador de 0,155 m; la prueba contra cajas usa un círculo real en planta, eliminando el bloqueo cuadrado artificial en esquinas.
- Tablero, patas y bandeja tienen colisión acorde a su geometría visible. El cajón extendido ocupa físicamente el espacio que se ve.
- Se conservan movimiento barrido, deslizamiento, normalización diagonal y rampa continua de escaleras.
- Se corrigen únicamente los puntos de aparición de los checkpoints `sound` e `interactions` para salir de la mesa/silla; no se desplazan muebles o habitaciones.
- Las hojas y detalles decorativos pequeños siguen sin obstaculizar rutas.
- La selección contextual conserva alcance y oclusión y excluye contenido oculto o en movimiento.

## Rendimiento medido

Capturas y benchmark comparan la base `611e0c2` con la implementación, usando las mismas posiciones, cámara, resolución y escenario. Chromium `158.0.8127.18`, Windows, GPU **SwiftShader por software**. Cada calidad descarta 15 fotogramas de calentamiento y registra 60 muestras con giro lento; la lectura de un píxel sincroniza el trabajo de GPU.

| Calidad | Resolución interna | Mediana antes | Mediana después | P90 antes | P90 después |
| --- | --- | ---: | ---: | ---: | ---: |
| Detalles | 768 × 432 | 40,1 ms | 17,5 ms | 45,2 ms | 34,3 ms |
| Fluido | 528 × 297 | 18,8 ms | 6,8 ms | 20,1 ms | 18,9 ms |

En esta comparación, la mediana del render aislado baja aproximadamente un 56 % y un 64 %. El mayor ahorro viene de descartar caras ocultas; se verifica que cajas, volúmenes redondeados y cilindros siguen visibles desde sus seis direcciones externas. El modo Fluido tiene un shader compilado específicamente sin normales, brillos y oclusión adicional, conservando las mismas texturas y colores.

Las mediciones preliminares mostraron variaciones importantes y el primer shader era más caro. Se redujo el atlas, se empaquetaron sus canales, se reutilizaron buffers y se separó el shader ligero antes de la comparación final. **Estos tiempos no son los FPS de la aplicación completa ni certifican un teléfono.** Se conserva el ajuste automático de calidad.

Datos íntegros: [antes](capturas/materiales-3d/before/mediciones.json) y [después](capturas/materiales-3d/after/mediciones.json).

## Verificación realizada

| Verificación | Resultado |
| --- | --- |
| `npm test` | Correcto: clásico, historia, audio, rescate, navegación, cámara, ventana y nuevas comprobaciones de materiales/muebles. |
| `npm run build` | Correcto. Continúa el aviso preexistente sobre tamaño del chunk de Phaser. |
| `npm run test:browser` | Correcto: historia 2D, audio, objetos, cómic, guardado, rotación y dos contactos táctiles. Test 2D sin cambios. |
| `node tests/demo-browser.cjs` | Correcto: recorrido ya existente de jardín a rescate, con ventana, pistas y final. |
| `node tests/house-3d-browser.cjs` | Correcto: dos dedos, pausas, foco, rotación, puertas, cajón por botón real, pulsaciones repetidas, contenido sincronizado, movimiento reducido, reinicio y tres cierres de audio. Guardados válidos de historia y rescate conservados byte por byte. |
| `node tests/house-production-browser.cjs` | Correcto sobre la compilación final: vista 844 × 390, pausa, ajustes, silencio, reinicio y regreso. Sin herramientas DEV ni errores WebGL. |
| `node tests/house-materials-browser.cjs` | Capturas comparables, materiales, cajón intermedio/abierto, seis vistas de cada primitiva, benchmark y ausencia de errores JavaScript/WebGL. |
| Pruebas físicas nuevas | Las cinco puertas, escaleras arriba/abajo, movimiento largo contra paredes, esquinas circulares, spawns libres, bandeja sólida, cierre seguro, estados intermedios y equivalencia de trayectoria a 30/60 FPS. |
| Protección y formato | Sin diferencias en el 2D protegido; `git diff --check` correcto. |

Los recorridos automatizados usan el hook DEV para preparar posiciones y alcanzar objetos; el movimiento de dos dedos y la prueba del cajón sí usan entradas del navegador. No equivalen a recorrer todo a mano ni a una revisión física en iPhone.

## Evidencias comparables

| Vista | Antes | Después |
| --- | --- | --- |
| Pasillo y mano | [01](capturas/materiales-3d/before/01-pasillo.png) | [01](capturas/materiales-3d/after/01-pasillo.png) |
| Salón | [02](capturas/materiales-3d/before/02-salon.png) | [02](capturas/materiales-3d/after/02-salon.png) |
| Escritorio | [03](capturas/materiales-3d/before/03-escritorio.png) | [03](capturas/materiales-3d/after/03-escritorio.png) |
| Cajón cerrado | [04](capturas/materiales-3d/before/04-cajon-cerrado.png) | [04](capturas/materiales-3d/after/04-cajon-cerrado.png) |
| Dormitorio | [05](capturas/materiales-3d/before/05-dormitorio.png) | [05](capturas/materiales-3d/after/05-dormitorio.png) |
| Cocina | [06](capturas/materiales-3d/before/06-cocina.png) | [06](capturas/materiales-3d/after/06-cocina.png) |
| Vegetación | [07](capturas/materiales-3d/before/07-vegetacion.png) | [07](capturas/materiales-3d/after/07-vegetacion.png) |
| Ventana | [08](capturas/materiales-3d/before/08-ventana.png) | [08](capturas/materiales-3d/after/08-ventana.png) |
| Cajón abierto | [09](capturas/materiales-3d/before/09-cajon-abierto.png) | [09](capturas/materiales-3d/after/09-cajon-abierto.png) |

[Cajón a mitad de apertura](capturas/materiales-3d/after/10-cajon-abriendo.png) · [Cajón en la interfaz jugable](capturas/materiales-3d/regresion/14-cajon-abierto.png) · [Compilación móvil](capturas/materiales-3d/regresion/00-compilacion-movil.png).

## Archivos y reproducción

Fuentes modificadas: `src/lab/house.js`, `world.js`, `renderer.js`, `interactions.js`. Fuentes nuevas: `src/lab/materials.js`, `material-shaders.js`, `furniture-motion.js`. Pruebas: `tests/lab.cjs`, `house-navigation.cjs`, `house-3d-browser.cjs`, más el nuevo `house-materials-browser.cjs`. Documentación: este informe, índice y capturas bajo `docs/capturas/materiales-3d/`.

Para repetir la referencia visual en PowerShell:

```powershell
$env:HOUSE_QA_PHASE='before'
$env:HOUSE_QA_REF='611e0c2'
node tests/house-materials-browser.cjs
Remove-Item Env:\HOUSE_QA_PHASE
Remove-Item Env:\HOUSE_QA_REF
node tests/house-materials-browser.cjs
```

Se necesita el commit base en el historial local. Para pruebas de regresión sin sobrescribir evidencias anteriores, usar `$env:HOUSE_QA_DIR='docs/capturas/materiales-3d/regresion'` antes del test de navegador correspondiente.

Pendientes: Safari/iPhone físico, escucha y FPS sostenidos reales. El vidrio mantiene la aproximación opaca existente y los reflejos no son reflexiones de otras habitaciones. El microrelieve no sustituye geometría; el filtrado lineal del atlas puede mostrar aliasing fino a mucha distancia. La linterna mantiene sombras aproximadas de baja resolución en Detalles y las omite en Fluido.
