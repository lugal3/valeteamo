# Reparaciones de Anti-Gravity, teléfono y primera llegada

9 de noviembre de 2026. Base real `4a74efa` («mejora antigravity»), recuperada desde `origin/main`. Se conservaron los materiales, modelos chibi, primitivas, animaciones y mejoras de cámara de esa versión. La copia de Escritorio se inspeccionó; la implementación se hizo en el espacio de Codex, rama `codex/reparaciones-antigravity`.

El alcance del teléfono se recuperó del chat «Diseño HUD Y Teléfono» y fue autorizado por el propietario. La secuencia normal termina en este primer escondite, como se pidió; todavía no existe una entidad perseguidora. El checkpoint avanzado de rescate conserva su vista anterior.

## Fallos gráficos y causa

El actualizador suponía 24 vértices por pieza. Había 131 piezas dinámicas con 4.181 vértices reales frente a los 3.144 supuestos. Los pomos redondeados tienen 72 vértices y las bisagras 60; a partir de la primera pieza distinta, las escrituras caían en otra malla. De ahí los paneles inmóviles, puertas flotantes en cocina, lamas de armario incorrectas y llave invisible. La colisión y las sombras se actualizaban correctamente, pero el dibujo dejaba de corresponder con ellas.

`geometry()` entrega ahora rangos reales de cada pieza. Se usan en todas las subidas dinámicas a WebGL y se comprueban contra una reconstrucción independiente, incluyendo posición, normales y tangentes. La caché compara valores con la misma precisión de sus buffers Float32. Se probaron cuatro ciclos de apertura/cierre.

La llave permanece preparada como geometría dinámica, oculta mientras el cajón está cerrado. Ya no se reconstruye toda la escena cada vez que se activa el cajón. Recogerla la elimina sin duplicaciones. Las texturas y los detalles de Anti-Gravity permanecen.

## Espejo

El reflejo ya no impone estar dentro del baño. Puede verse desde el pasillo si la puerta está abierta o moviéndose y existe visión hacia el espejo. Se comprueban orientación, distancia, altura y oclusión antes de dibujarlo. Desde dentro funciona también con la puerta cerrada; desde fuera y con puerta cerrada se desactiva.

El stencil conserva la oclusión de paredes, marco y hoja. La escena reflejada incluye el pasillo real y los objetos dinámicos, por lo que la puerta también se refleja mientras gira. Un recorte contra el plano del espejo evita dibujar geometría del lado incorrecto. Se reutiliza el personaje articulado, con mano vacía, linterna o teléfono según lo equipado. Los buffers del personaje se redimensionan al cambiar de modelo para evitar errores WebGL.

## Audio

La versión recibida ya tenía ambiente y efectos; se conservaron y se conectaron con las nuevas señales de llaves, golpes y forcejeo. Los efectos usan un bus de volumen propio para que silencio y volumen afecten también a voces ya iniciadas. Se mantiene el ambiente por zonas, pasos por superficie y crujidos existentes. Un botón «Activar sonido» permite desbloquear el contexto o quitar el silencio mediante un gesto explícito, sin sobrescribir preferencias al cargar.

La prueba del navegador silencia ambiente y música y mide una señal real al accionar la puerta. También comprueba el cierre de todos los contextos del escenario. No hay grabaciones externas ni dependencias nuevas.

## Hotbar y teléfono

- Tres espacios: mano vacía, linterna y teléfono, con selección táctil y teclas `1`, `2`, `3`.
- Teléfono rosado 3D en la mano y en el espejo; transición breve al equipar y respeto por movimiento reducido.
- Seleccionarlo no abre la interfaz. «Ver teléfono» o `P` despliega la pantalla completa; Escape o la cruz la guarda.
- Aplicaciones: Mensajes, Snake jugable con flechas/WASD y botones táctiles, y aplicaciones decorativas sin conexión.
- El mundo, el audio y el reloj del evento continúan mientras se usa el teléfono. La interfaz del teléfono no pausa la simulación.

## Primera secuencia de eventos

1. Conseguir llave y pista del cuadro genera una única notificación de **Mi Luis ❤️**: «Creo que está a punto de llegar a la casa».
2. Abrir Mensajes muestra «Escribiendo…» y envía automáticamente la respuesta de Kitty. No hay entrada de texto ni mensajes duplicados al reabrir el chat.
3. Abrir el dormitorio activa el plano de la entrada, sonidos de llaves/golpes/forcejeo y una pequeña oscilación de la puerta. Un breve plano reutiliza a Kitty en tercera persona; luego vuelve el control.
4. Comienza «¡ESCÓNDETE!» con diez segundos de juego activo. No se descuentan durante la escena previa ni con la pausa general, pérdida de foco u orientación vertical.
5. Al terminar se comprueba un escondite completado: armario o bajo la cama. Estar acostada o en medio de la animación de entrada no basta.
6. Sin esconderse: «Te descubrieron», con reintento desde antes de la llegada conservando llave y pistas. Escondida: «Estás a salvo», fin de esta etapa. No se añade una persecución posterior.

El estado es propio de la sesión 3D. Reiniciar la casa reinicia la secuencia; reintentar la llegada no duplica objetos ni mensajes. No se añaden ni cambian claves de guardado.

## Verificación

`npm test` incluye la nueva comprobación de rangos de malla y del autómata de eventos a través de `tests/lab.cjs`. `tests/phone-events-browser.cjs` prueba equipo, Snake, espejo desde pasillo, cierre del baño, señal de audio de puerta, cajón repetido, llave, conversación automática, escena, derrota con teléfono abierto, reintento, escondite correcto, cierre de audio y cero errores WebGL/JavaScript.

También se ejecutan compilación, historia 2D en navegador, recorrido normal 2D → 3D hasta el nuevo final del escondite y prueba de producción. En `tests/demo-browser.cjs` se adapta exclusivamente la expectativa del final 3D al nuevo alcance autorizado.

[Resultados del navegador](capturas/telefono-eventos/resultados.json) · [Teléfono en mano](capturas/telefono-eventos/01-telefono-mano.png) · [Espejo desde pasillo](capturas/telefono-eventos/03-espejo-pasillo.png) · [Llave visible](capturas/telefono-eventos/05-llave-visible.png) · [Mensajes](capturas/telefono-eventos/06-mensajes.png) · [Tercera persona](capturas/telefono-eventos/07b-tercera-persona.png) · [Derrota](capturas/telefono-eventos/08-perdiste.png) · [Escondite](capturas/telefono-eventos/09-escondite.png).

## Aislamiento y límites

Las fuentes de producto modificadas están en `src/lab/`. No se cambia historia/clásico/prólogo 2D, sprites, audio 2D, orquestación, CSS compartido, assets públicos, dependencias ni guardados. Los módulos nuevos son `equipment.js`, `phone-ui.js` y `story-events.js`. Se adaptan render, espejo, personaje, view-model, sonido, casa y su CSS propio.

La validación automatizada usa Chromium con GPU por software. No acredita 60 FPS ni una prueba física de Safari/iPhone. El espejo añade trabajo cuando es visible; se desactiva fuera de su zona de visión. Los mensajes son ficción local del juego, no comunicaciones reales.
