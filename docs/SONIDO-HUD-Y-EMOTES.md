# Sonidos físicos, HUD configurable y emotes de la casa

9 de noviembre de 2026. Rama `codex/sonido-hud-y-emotes`, sobre `8768a07`. Fuentes de producto exclusivamente en `src/lab/`. Se conserva Anti-Gravity y no se modifica el 2D ni su orquestación. Esta iteración no se fusiona a `main` ni se publica en Firebase sin un encargo de publicación.

## Encargo aplicado y análisis

Mejorar la tensión mediante sonidos vinculados a acciones reales; despejar el centro de la pantalla; permitir que el propietario diseñe y comparta su disposición; representar el teléfono como un objeto sobre el mundo; recuperar agacharse y aprovechar el rig existente para gestos en el espejo. Mantener pistas, eventos, colisiones, materiales y preferencias anteriores.

El audio anterior usaba el mismo crujido breve para todas las puertas y una pisada de madera genérica en la escalera. La casa tenía ambiente aleatorio, pero carecía de puntos de suelo que respondieran al recorrido. La hotbar imponía tres botones grandes en el centro inferior. El teléfono cubría todo el juego con un panel. El botón de agacharse se ocultaba expresamente en `demo`; los clips del personaje no tenían un selector de emotes.

## Sonido y suelo

- `spooky-foley.js`: perfiles originales de apertura/cierre con fricción de bisagra, resonancias metálicas, pestillo e impacto al cerrar; madera, peldaños y quejido grave del suelo. Las capas se programan con el reloj de Web Audio, sin temporizadores por sonido ni archivos externos.
- La apertura automática, las acciones manuales y el armario emplean estos perfiles. Una puerta bloqueada produce pestillo, sin fingir una apertura. Las voces pasan por el volumen de efectos, posición estéreo, distancia, oclusión y silencio existentes.
- Máximo de doce eventos compuestos simultáneos; cada uno libera sus fuentes, filtros y envolventes. Pausar o salir detiene las voces. No se sobrescribe la preferencia de silencio al entrar.
- `floor-sounds.js`: pasos según desplazamiento real, con cadencia más densa en peldaños y menor volumen al ir agachada. No se generan pasos contra una pared o estando quieta.
- Cinco zonas de crujido transitables: pasillo, salón, estudio, descansillo y pasillo superior. Son solo lógica: no añaden colisiones ni placas visibles. Usan entrada/salida con histéresis de 22 cm, catorce segundos por zona y tres segundos globales entre crujidos. Se distinguen las plantas y se reinician con la sesión.

## Hotbar

Por defecto es lateral izquierda, con iconos de trazo y botones de 44 px. En 844 × 390 ocupa **58 × 154 px**, sin cubrir el centro de la vista. Los controles de movimiento/acción se separan del lateral ocupado.

**Ajustes → Editar controles / hotbar** abre el editor y pausa la casa. Permite anclar izquierda/derecha/arriba/abajo, variar botones de 40–64 px, opacidad y desplazamientos X/Y. El resultado se limita a la pantalla. «Vista previa» oculta el panel y conserva las medidas reales; «Copiar ajuste» entrega JSON con preferencias, viewport y rectángulo para acompañar una captura.

La configuración se conserva como campo `hud` dentro de la clave de cámara **ya existente**, sin crear ni renombrar claves. Cambiar sensibilidad no borra el HUD y cambiar el HUD no borra la cámara. Si el navegador bloquea el guardado o portapapeles, el ajuste sigue funcionando en sesión y el JSON puede verse/copiarse en el panel.

## Teléfono y modelos

El teléfono ampliado tiene carcasa, bordes, cámara frontal, barra de estado, pantalla interior desplazable y botón de inicio. El fondo transparente deja visible la casa. El modelo pequeño se guarda mientras se muestra el ampliado, evitando dos teléfonos simultáneos. Mensajes y Snake conservan su funcionamiento. El mundo y el reloj de peligro continúan activos al usarlo.

Se añaden detalles al modelo en mano: marco, botón lateral, cámara trasera y barra de pantalla. La pose del espejo sujeta el teléfono delante del pecho; se elimina la flexión doble que lo llevaba detrás de la cabeza.

## Agacharse y emotes

El botón **Agacharse / Levantarse** vuelve a estar disponible en el recorrido principal y mantiene la tecla **C**, la comprobación de espacio y el desplazamiento suave de cámara. El reflejo utiliza la pose del rig sin comprimir el personaje una segunda vez.

**M** o «Emotes» abre el selector. **6:** 6–7; **7:** baile Gangnam; **8:** saludar. Son animaciones procedurales propias sobre las quince articulaciones existentes; no incluyen grabaciones musicales ni añaden mallas por fotograma. Se suavizan entrada/salida, finalizan solas y se cancelan al caminar, interactuar, agacharse o equipar otro objeto. No pueden iniciarse durante la escena, escondida, acostada o agachada. Los objetos se guardan temporalmente para dejar las manos libres y se recuperan después. Movimiento reducido conserva un gesto sin oscilaciones repetidas. La cámara permanece bajo control del jugador.

## Verificación y límites

- `npm test` incluye `tests/sensations.cjs`: tránsito de zonas, histéresis, enfriamiento, plantas, superficies, límites del HUD y aislamiento de preferencias; mallas/normal de emotes, pausa, cancelación y movimiento reducido.
- `tests/sensations-browser.cjs`: HUD móvil, cuatro anclajes, editor/copia/persistencia, teléfono con fondo visible, emotes en el espejo, agacharse, recorrido real por escalera y zona sonora, perfiles de puerta y silencio. Renderiza audio con `OfflineAudioContext`, verifica señal, picos y liberación de fuentes.
- `tests/phone-events-browser.cjs`: regresión de pistas, notificación/respuesta, derrota con teléfono abierto, reintento y escondite.
- `npm run build` y `tests/house-production-browser.cjs`: compilación y controles de la versión de producción, sin hooks de desarrollo ni errores WebGL/JavaScript.

Las pruebas visuales son de Chromium con GPU por software, no una medición de 60 FPS ni una prueba física de iPhone/Safari. El timbre del audio es procedural y puede evaluarse con la muestra; no se presenta como una grabación de una puerta real.

[Hotbar lateral](capturas/sensaciones-3d/01-lateral-movil.png) · [Editor](capturas/sensaciones-3d/02-editor.png) · [Anclaje inferior](capturas/sensaciones-3d/03-anclaje-abajo.png) · [Teléfono](capturas/sensaciones-3d/04-telefono.png) · [6–7](capturas/sensaciones-3d/06-emote-67.png) · [Gangnam](capturas/sensaciones-3d/07-emote-gangnam.png) · [Agacharse](capturas/sensaciones-3d/08-agacharse.png) · [Resultados](capturas/sensaciones-3d/resultados.json) · [Muestra de puerta y crujido](capturas/sensaciones-3d/puerta-y-crujido.wav).
