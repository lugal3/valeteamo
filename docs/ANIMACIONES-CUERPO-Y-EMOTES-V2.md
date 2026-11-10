# Cuerpo, emotes y movimiento en primera persona — V2

10 de noviembre de 2026. Rama `codex/animaciones-cuerpo-y-emotes`, base `207ab7a`. El propietario autorizó posteriormente la fusión local a `main` junto con `codex/hud-mensajes-discretos`. Sin push ni despliegue. El encargo se limita a la casa 3D y conserva su aspecto chibi.

## Cambios visibles

- **6–7:** alternancia de palmas con acentos sostenidos, recorrido suave entre alturas y respuesta ligeramente retrasada de cabeza y torso. Las manos quedan delante y a los lados del cuerpo.
- **Gangnam:** secuencia doble izquierda/doble derecha, compresión de rodillas, transferencia de peso y bombeo de las muñecas reunidas delante del pecho. La segunda frase libera una mano para un giro lateral. Un pie conserva el apoyo durante la frase de pasos.
- **Caminar:** la cadera transfiere peso y acompaña el paso con hombros y cabeza. La trayectoria del pie en el aire enlaza con la velocidad del apoyo. El ciclo sigue dependiendo del desplazamiento resuelto por colisiones, también hacia atrás y en diagonal.
- **Transiciones:** cambiar de emote o salir caminando mezcla desde la pose actual durante 220 ms. La mezcla de rotaciones utiliza cuaterniones por el arco corto para evitar giros completos al cruzar ±π. El movimiento físico responde enseguida. Los objetos reaparecen después de esa mezcla con la animación de equipar existente. Agacharse o entrar en un escondite descarta el baile inmediatamente para dar prioridad a la acción.
- **Manos y brazos:** las piezas se ajustan al tramo real entre articulaciones. Se elimina la prolongación del antebrazo que producía un volumen sobrante al doblarlo. Las manos vacías son dos mitones coherentes con pequeños pulgares.
- **Primera persona:** velocidad real amortiguada, balanceo de mano sin picos en cada apoyo, pequeña rotación del agarre al arrancar/frenar y balanceo de cámara que vuelve al centro al detenerse. El teléfono combina su pose de sujeción con la marcha de las piernas.

Los controles siguen siendo **6** (6–7), **7** (Gangnam), **8** (saludar), **M** o el botón de emotes. Para ver el cuerpo: **Pruebas → Espejo**, seleccionar manos libres y activar el baile. El saludo usa también el nuevo apoyo de manos y pies.

## Implementación y límites

`animations/pose-tools.js` añade curvas entre acentos y resolución de cadenas de dos huesos. Utiliza las longitudes y pivotes reales del esqueleto, incluida la asimetría de los brazos en la pose original. Los pies compensan la traslación de la raíz para conservar su posición mundial; las manos tienen objetivos y orientación propios. En Gangnam los hombros se adelantan ligeramente para reunir los mitones delante del peto sin estirar los huesos.

Se mantienen quince articulaciones y las mallas reutilizadas; no hay otro motor, dependencias, temporizadores ni descargas nuevas. La pose y las matrices del cuerpo se calculan cuando un consumidor visible las necesita; capturar una transición evalúa una pose adicional al comenzar o cancelar un emote. Fuera del espejo continúa únicamente el estado ligero de animación. Las geometrías de mano/linterna en primera persona mantienen su presupuesto.

Movimiento reducido conserva una pose legible de cada emote sin pasos o balanceos repetidos, acorta las transiciones y elimina la amortiguación decorativa de la mano. La pausa congela relojes y transiciones. Las secuencias son reinterpretaciones propias para este personaje; no se utilizó captura de movimiento ni se recibió un vídeo de referencia que permita certificar una coreografía exacta. Las articulaciones siguen formadas por piezas rígidas, sin piel continua con pesos múltiples.

Todas las fuentes de producto modificadas están en `src/lab/`. No se cambian fuentes compartidas, CSS, mapas, colisiones, velocidades del jugador, guardados, claves de localStorage ni ninguna experiencia 2D. La rama parte del `main` local que ya contiene perseguidor y grabaciones; Firebase continúa en su versión anterior.

## Verificación

- `npm test`: suite general y nueva auditoría `tests/animation-quality.cjs`, integrada en `tests/character-animation.cjs`. Comprueba alternancia de palmas, muñecas delante del pecho, geometría finita, contacto con el suelo y continuidad a 120 muestras/s; pie de apoyo fijo, interrupción/cambio sin salto inicial, marcha con teléfono y límites pequeños de movimiento de mano.
- `npm run build`: TypeScript y Vite; permanece el aviso de tamaño del bundle de Phaser.
- `node tests/animation-quality-browser.cjs`: escenario de inspección con el renderizador real, vídeo de los tres ciclos y prueba dentro del espejo del juego. Comprueba cambio de emote, pausa, caminar para cancelar, agacharse, movimiento reducido, culling y ausencia de errores JavaScript/WebGL.
- `node tests/character-animation-browser.cjs`: reposo, caminar real, pared sin avance del ciclo, pausa, descarte fuera del espejo y regreso, movimiento reducido y entrada por ventana. Se actualiza la ubicación de las evidencias para Windows y la espera de reposo se basa en el estado del juego, en lugar de 650 ms de reloj bajo GPU por software.
- `node tests/house-input-browser.cjs`: regresión del arreglo de entrada, teclado con Mayúsculas, ratón y dos dedos, liberaciones perdidas, foco y regreso a la página.
- `HOUSE_QA_DIR=docs/capturas/animaciones-v2/compilado node tests/house-production-browser.cjs`: sitio compilado local, HUD, teléfono, agacharse, emote, pausa, salida y ausencia de hooks DEV.

Evidencias en `docs/capturas/animaciones-v2/`. `secuencias.webm` muestra 6–7, Gangnam y caminar en el escenario de inspección. La marcha de ese escenario se reproduce a 0,65 m/s para examinar los apoyos; el juego mantiene su velocidad original. `recorrido/animaciones.webm` muestra la integración real. Chromium utiliza GPU por software y táctil emulado: estas pruebas no certifican FPS ni sustituyen una revisión en un teléfono físico.
