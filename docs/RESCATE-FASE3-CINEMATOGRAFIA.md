# ValeTeAmo · Fase 3: actuación y continuidad de la historia 2D

## Principio narrativo

La aventura conserva el tono **tierno del jardín** y transforma la tensión poco a poco hasta llegar al **barrio nocturno y la casa 3D**. Las emociones se comunican primero mediante **gestos, miradas, silencios y movimiento**, no mediante largas ventanas de diálogo. Los textos principales permanecen editables en `src/demo/prologue-story.js` y son placeholders breves.

**Separación de personajes:** **Luis** es el novio de Kitty que aparece, saluda y sale caminando del jardín; **Louis** es quien la acompaña y después es llevado a la furgoneta y rescatado en la casa 3D. No se mezclan modelos ni eventos.

## Escenas y dirección

| Momento | Actuación / cámara | Interacción del jugador |
|---|---|---|
| Jardín inicial | El entorno ya tiene vida, Kitty respira y parpadea; no aparece un NPC de golpe | Movimiento libre y puente con salida auténtica |
| Rescate y llegada de Louis | Louis entra caminando, orientado a la dirección de su ruta; al detenerse mira a Kitty, parpadea y adopta una postura mínima | Hablar solo al estar cerca y después de terminar su entrada |
| Encuentro con Luis | Luis aparece por el sendero, se acerca, saluda, se expresa con un corazón y luego se despide y se marcha caminando | Diálogo de dos frases fácilmente reemplazable |
| Paseo con Louis | Louis acompaña físicamente a Kitty guardando separación, con animación de andar solo cuando realmente se mueve | El jugador sigue controlando teclado o joystick; no hay teletransporte |
| Secuestro | El motor anticipa la furgoneta LUNA-07; dos personas con máscaras de zorro y conejo bajan, sujetan a Louis, lo conducen hasta la puerta, suben y huyen. Kitty se vuelve hacia el peligro, aparece una reacción breve y la cámara se desplaza **como máximo 83×45 px**, sin abandonar al protagonista | Control bloqueado exclusivamente durante la captura física; sin aparición/desaparición repentina |
| Tras el secuestro | La cámara vuelve a Kitty gradualmente en lugar de dar un salto en el corte de escena | Se reanuda la investigación |
| Pulsera, pétalos, ruedas | Pequeños símbolos sobre cada pista al acercarse, orientación física de Kitty, confirmación al tocar, sin abrir menús superfluos | Las pistas deben encontrarse físicamente |
| Barrio y casa | La furgoneta con la misma matrícula está estacionada en la calle. La arquitectura recuerda al exterior del nivel 3D; las ventanas y faroles están vivos y las rutas a puerta y ventana son alcanzables | Kitty puede inspeccionar la matrícula, seguir una guía a pie y entrar al 3D por la ventana |
| Entrada 3D | Transición con fundido ya existente y conversión al entorno real de la casa | Controles 3D originales preservados |

## Cambios de ingeniería

- `src/demo/rescue-performance.ts`: funciones **puras** de orientación, parpadeo/postura, pistas expresivas, emociones por fase y encuadre de cámara acotado y suavizado con amortiguación independiente del FPS.
- `src/iso-game.ts`: la escena original Phaser aplica la actuación solo dentro del modo historia. Globos de **un solo símbolo**, como `♡`, `!`, `?`, `✧` y `…`, con vida de 1,2 s, máximo 3 visibles y destrucción inmediata al cambiar de capítulo; **no** introducen elementos DOM que bloqueen el joystick o los diálogos.
- Louis usa los sprites chibi existentes, orienta la cabeza a Kitty y parpadea; se evita anular el caminar de entrada o la carga en la furgoneta. Luis sigue la **tangente de su trayectoria curva**, no un vector de orientación fijo para todo el recorrido.
- Kitty gira para mirar la furgoneta cuando se abre la puerta y durante el forcejeo, sin teletransportarse.
- La cámara mantiene el zoom original; su deriva cinematográfica es gradual, con vuelta lenta tras el secuestro, y **se desactiva en `prefers-reduced-motion`**. El seguimiento normal de Kitty y el zoom del arcade 2D clásico no se modifican.
- Pistas iluminadas y reacciones contextualizadas una vez por capítulo, sin diálogos adicionales; no afectan al progreso ni a los guardados.
- Se conservan las fases 1 y 2: movimiento de Kitty, compañero, sonidos/pisadas, cuatro biomas vivos y límite de recursos para iPhone.
- Todo vive en una sola instancia de `IsoAdventure`. No se agregan motores, librerías, sonidos protegidos ni descargas externas.

## Validación final antes de publicar

- `npm test`: incluye `tests/rescue-performance.cjs` que comprueba las actuaciones por etapa, la distinción Luis/Louis, movimiento reducido, cámara acotada y suavizado idéntico a 30/60/120 FPS.
- `npm run build`: TypeScript y Vite de producción.
- `tests/prologue-browser.cjs`: recorrido móvil completo, llegada y despedida de Luis, secuestro real, reacción y cámara, descubrimiento de pistas, cuatro biomas, furgoneta estacionada con matrícula correcta, puerta accesible, ventana y entrada en la casa 3D.
- `tests/rescue-feel-browser.cjs`: teclado y joystick analógico en PC/iPhone; frenado y cámara de fase 1.
- `tests/prologue-desktop.cjs` y `tests/emotes-browser.cjs`: escritorio, acceso al 3D y controles del nivel original.
- El modo Corazones clásico continúa aislado y pasa su batería propia.
- **La última fase no está terminada ni publicada hasta que todas las comprobaciones CI finalicen con éxito**. Solo entonces se cambia la PR #22 a lista para revisión, se integra en `main` y se comprueba el Action de Firebase Hosting en `valefc.web.app`.
