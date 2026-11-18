# Catálogo de audio de ValeTeAmo

Lista de búsqueda para reemplazar sonidos provisionales y cubrir interacciones que pueden ganar su propio sonido. Está organizada por lo que se oye al jugar. Las búsquedas en inglés sirven como punto de partida en bibliotecas de audio.

- **WAV de prueba** significa que ya hay un archivo con un recorte de una grabación CC0. Puedes sustituirlo con otro WAV en el mismo lugar.
- **Asset existente** significa que el juego ya carga un archivo. Algunos llegaron con nombres locales y todavía tienen pendiente identificar la fuente o la licencia exacta.
- **Generado** significa que Web Audio crea tonos, ruido, música o el efecto en ejecución. Hay que conectar el archivo nuevo al evento en el código.
- **Ampliación** significa que el evento es silencioso o comparte un efecto genérico. Añadir un sonido dedicado requiere su propio disparo o una variante del evento actual.

## 1. Los siete WAV provisionales

Se guardan en `src/lab/audio/`. Los cortes se hicieron desde las preescuchas públicas de las fichas, con licencia CC0. [Autores, enlaces y cortes originales](AUDIO-PRUEBA-RESCATE.md).

| Prioridad | En juego | Archivo de prueba | Qué buscar |
| --- | --- | --- | --- |
| Alta | Ofrecer el Churu | `preview-churu.wav` | `small foil treat pouch tear crinkle`. Un envoltorio pequeño y cercano, con un crujido y una apertura corta. |
| Alta | Gata después de comer y guiando en la salida | `preview-cat.wav` | `soft cat trill short`, `single friendly cat meow`. La misma voz reconocible en ambos momentos. |
| Alta | Furgoneta cerrándose con Louis dentro | `preview-van-door.wav` | `van sliding door close slam exterior`. Buscar el deslizamiento y el golpe como tomas separadas si hay opción. |
| Alta | Furgoneta alejándose | `preview-van-away.wav` | `diesel van accelerates away exterior`. Una salida de alrededor de dos segundos que pierde presencia. |
| Alta | Apagón durante la patrulla | `preview-power-cut.wav` | `electrical relay power cut snap`, `fluorescent ballast power off`. Un chasquido corto que se entienda junto a los pasos. |
| Alta | Motor del autito | `preview-rc-motor.wav` | `RC toy car electric motor steady loop`. Zumbido estable sin arranque ni frenado en medio. El juego modula la velocidad. |
| Alta | Escotilla que cierra la trampa | `preview-hatch-close.wav` | `heavy metal hatch close latch thud`. Golpe y pestillo definidos. |

## 2. Grabaciones que ya usa la casa

Puedes conservar estas si te gusta cómo suenan. El manifiesto detalla los cortes y su procedencia. [Inventario de los 16 WAV](PERSEGUIDOR-Y-AUDIO-GRABADO.md).

| Uso | Archivo existente | Búsqueda si quieres cambiarlo |
| --- | --- | --- |
| Fondo base interior | `ambient.wav` | `quiet empty house room tone loop`, `subtle spooky interior ambience` |
| Fondo durante amenaza | `tension.wav` | `stealth suspense tension drone loop`; nivel estable con espacio para señales de juego |
| Puerta de madera al abrir | `door-open.wav` | `old wooden door open hinge` |
| Puerta de madera al cerrar | `door-close.wav` | `wooden door close soft latch` |
| Armario de arriba al cerrar | `closet-close.wav` | `wooden louver closet door close inside` |
| Desbloqueo y llaves de la llegada | `unlock.wav` | `keys enter lock turn latch`; conservar un desbloqueo reconocible |
| Forcejeo y prueba de puerta | `trying-door.wav` | `locked wooden door handle rattle` |
| Mensaje del teléfono | `notification.wav` | `short soft message notification`. [Ficha de la notificación actual](https://freesound.org/people/AnthonyRox/sounds/740423/) |
| Linterna y final del cambio de pila | `light.wav` | `handheld flashlight switch click` |
| Pisadas de madera | `wood-1.wav` a `wood-3.wav` | `wood floor single footsteps variations`. Guardar tres pisadas independientes del mismo calzado. |
| Peldaños de madera | `stair-1.wav` a `stair-3.wav` | `wooden stair single footsteps variations`. Guardar tres tomas con un golpe parecido. |
| Detección, sospecha y captura | `alert.wav` | `short stealth spotted sting no jumpscare`. El recorte actual es breve y se reutiliza en varios avisos. |

## 3. Prólogo, jardín y villa 2D

El código de las capas, música y tonos está en `src/audio.ts`. Las llamadas de escena están en `src/iso-game.ts` y `src/demo/GardenPrologue.tsx`.

| Escena o evento | Hoy | Qué buscar o grabar |
| --- | --- | --- |
| Río del jardín de mañana | Generado | `small river stream gentle water loop`; sin golpes de agua fuertes |
| Pájaros de mañana y tarde | Generado | `quiet garden birds isolated chirps`; dos o tres llamadas breves |
| Brisa del jardín y hojas | Generado | `light breeze foliage rustle`, `calm garden wind loop` |
| Atardecer y penumbra | Generado | `dusk insects sparse crickets`, `soft evening wind` |
| Villa de noche | Generado | `suburban night crickets distant traffic separate`; fondo discreto y un motor distante aparte |
| Pasos en sendero, pasto y piedra | Generado | `light footsteps dirt grass gravel single steps`; tres a cinco variaciones por superficie |
| Puente y tablones | Generado | `light footsteps wooden bridge single`; seco y ligero |
| Recolección del Churu | Generado | `tiny item pickup soft pop`; distinto del crujido al ofrecerlo |
| Lamido y ronroneo de la gata | Ampliación | `cat licking food close up`, `cat soft purr clean`; uno o dos lamidos y un ronroneo corto |
| Encuentro y despedida de Luis y Vale | Ampliación | Voz propia o `friendly character greeting soft chime`; breve y discreto |
| Defensa de Louis | Generado | `cute magic projectile`, `soft impact`, `heart damage cue`, `shield block sparkle`, `small victory chime` |
| Acercamiento de la furgoneta | Generado | `van drive up stop exterior`; distinto del sonido de partida |
| Abrir la puerta corredera | Generado | `van sliding door open close mic`; separar apertura y cierre |
| Forcejeo y subida de Louis | Generado o compartido | `short clothing grapple foley`, `footstep metal vehicle interior`; una capa de tela y un impacto corto |
| Pistas del lazo, pétalos y huella | Generado | `subtle clue discover chime`; variantes de una misma familia |
| Inspeccionar LUNA-07 | Generado | `clue found soft two note cue`; corto y distinguible del clic |
| Cambio entre mapas | Ampliación | `short soft transition swell`; opcional si tus ambientes ya enlazan bien |
| Música jardín, defensa y búsqueda | Generada | `gentle storybook loop`, `playful light battle loop`, `subtle mystery exploration loop` |

## 4. Casa 3D y puzles

En `src/lab/sound.js` se decide el efecto y su volumen. `atmosphere.js`, `spooky-foley.js` y `floor-sounds.js` generan o disparan las capas de ambiente, pasos y objetos físicos.

| Escena o evento | Hoy | Qué buscar o grabar |
| --- | --- | --- |
| Ventana, marco y aterrizaje al entrar | Generado | `window latch click`, `old window sash slide`, `cloth squeeze`, `soft wood landing`; cuatro cortes separados |
| Aire interior, jardín y escondite | Generado | `quiet indoor air room tone`, `garden night wind loop`, `muffled interior room tone` |
| Grillos del jardín 3D | Generado | `isolated cricket chirp night`; además del ambiente base si tu loop viene limpio |
| Refrigerador de cocina | Generado | `soft refrigerator compressor hum loop`; poder apagarlo al cortar la corriente |
| Goteo de baño y sótano | Generado | `single water drip tile room`, `single water drip concrete`; recortes cortos con cola sutil |
| Crujido de casa que se asienta | Generado | `old house timber settling distant creak` |
| Tabla bajo una pisada | Generado | `single pressure floorboard creak`; distinguible del fondo |
| Pisadas en baldosa, tierra, pasto y piedra | Generado | `light single footstep tile`, `dirt`, `grass`, `stone`; varias tomas por material |
| Cajón y mueble | Generado | `wooden drawer slide open`, `wooden drawer close soft`; dos archivos |
| Candado y manilla bloqueados | Generado | `small padlock locked rattle`, `doorknob locked click`; discretos y cortos |
| Recoger llave, pila, linterna y RC | Generado | `small keys pick up`, `battery pickup click`, `plastic object pickup`; conservar respuesta clara al equipar |
| Cambiar pila | Generado más interruptor grabado | `plastic battery lid click`, `battery insertion spring`, `flashlight reset click` |
| Papel, notas y partitura | Generado | `paper pickup unfold rustle`, `sheet music unfold place on stand`; dos o tres cortes |
| Accionar luces, tablero y agua | Generado o compartido | `light rocker switch`, `breaker lever clunk`, `small faucet turn open close` |
| Aviso y retorno de luz | Generado o sin señal dedicada | `short light flicker click`, `power relay reset`; distintos de la caída completa |
| Reloj | Generado | `mechanical wall clock single tick dry`; un golpe breve para cada segundo |
| TV y mando | Estática generada y video mudo | `old CRT static short`, `remote control press`. Si se agrega contenido con audio, buscar un clip propio o autorizado. |
| Acostarse, esconderse y salir | Generado | `mattress soft creak`, `fabric movement close`, `small bed frame creak`, `closet inside latch` |
| Teclas del piano del descansillo | Grabación del tutorial y síntesis de respaldo | `upright piano dry chromatic single notes C4–C5`. Para cambiar el timbre, trece notas individuales del mismo piano con volumen parejo. La pista del recital requiere una grabación que siga sus tiempos. |
| Compartimento del piano | Generado | `wood secret compartment slide latch`; mano, pestillo y deslizamiento corto |
| Caja fuerte | Generado y desbloqueo grabado | `safe keypad short neutral beep`, `safe combination error`, `safe latch bolt open`; separar error de acierto |
| Altar y tocadiscos | Inspección con sonido genérico | `vinyl needle drop`, `vinyl locked groove crackle`. Una pista autorizada si se decide activar el tocadiscos. |

## 5. Perseguidor, sótano y escape

| Escena o evento | Hoy | Qué buscar o grabar |
| --- | --- | --- |
| Auto del perseguidor llegando a la casa | Generado | `car approach stop idle residential exterior`. Es el auto que llega a la casa, distinto de la furgoneta del prólogo. |
| Pasos del perseguidor | Grabaciones compartidas de madera y escalera | `heavy boots wood slow single`, `heavy boots stairs fast single`; tres tomas por superficie |
| Abrigo y levantar al perseguidor | Sin timbre dedicado | `heavy coat movement`, `slow stand cloth foot shift`; discreto |
| Sospecha, persecución y regreso a calma | Grabaciones compartidas y fondo | `stealth suspicion cue subtle`, `short pursuit sting`, `threat clears release cue`; tres intensidades |
| Tapete y trampilla antes del rescate | Generado y puertas compartidas | `rug drag on wood`, `padlock unlock`, `metal hatch hinge opening`; el golpe final ya tiene WAV de prueba |
| Liberar a Louis | Generado y efecto compartido | `rope untie pull fibers`, `chair wood shift`, `soft cloth lift`; sin música incrustada |
| Levantar, conectar y guardar la tablet | Sonido compartido o sin señal dedicada | `small tablet handling`, `device connected short beep`, `radio signal drop soft` |
| Motor, ruedas y choque del RC | Motor grabado de prueba, ruedas y golpes sin capa dedicada | `RC car wheels concrete loop`, `small plastic toy bump`, `RC motor start stop`; clips separados del bucle principal |
| Señuelo del RC | Generado | `short two-tone toy buzzer`. Debe distinguirse del motor y ser reconocible a distancia. |
| Candado preparado y trampa armada | Generado y cierre grabado de prueba | `trap armed metal latch`, `padlock close click`; montar el cierre fuerte como señal separada |
| Salida con Louis | Voz de la gata grabada de prueba y respuesta de recogida | `soft quest complete chime`, `gentle relief music cue`; complementar el maullido |
| Voz de Louis y alivio al escapar | Ampliación | Grabación personal o interpretación autorizada. Una línea por archivo, sin música de fondo. |

## 6. Interfaz, otros modos y cumpleaños

| Uso | Hoy | Qué buscar o grabar |
| --- | --- | --- |
| Bienvenida y música de historia | Generado | `short storybook welcome melody`, `soft music box loop`; una melodía sola, sin percusión fuerte |
| Selección, confirmar, volver y error | Tonos generados o acción silenciosa | `soft UI click`, `confirm friendly short chime`, `UI back tick`, `soft unavailable cue`; familia consistente |
| Recoger, pista y logro | Tonos generados o compartidos | `item pickup chime`, `clue reveal chime`, `quest complete gentle chime`; tres respuestas distintas |
| Clásico Corazones y capítulos 2D | Generado | `soft projectile pop`, `shield block sparkle`, `cartoon bomb short`, `arcade beam`, `enemy defeat chime`, `8-bit victory gentle`; reemplazar por evento |
| Emote 6–7 | `emote-six-seven.mp3` y ritmo de respaldo | Si se sustituye, un clip autorizado o un beat original con los acentos del baile |
| Emote Gangnam | `emote-gangnam.mp3` y ritmo de respaldo | Una pista autorizada o un ritmo original con los acentos de la coreografía |
| Emote What Is Love? | `emote-what-is-love.mp3` y ritmo de respaldo | Una pista autorizada o un clip original sincronizado a los diez segundos de animación |
| Universo de cumpleaños y recuerdos | Ambiente generado | `warm space ambient loop`, `gentle star shimmer`, `nostalgic soft pad`, `quiet suspense pad`; una capa por escena si se necesita |
| Carta o final de cumpleaños | Atmósfera generada y texto provisional | Voz personal, música instrumental propia o autorizada y un cierre corto, cada uno por separado |

## Cómo preparar los archivos

- Guarda el original, el enlace de la ficha, el autor y la licencia de cada audio. Si grabas sonidos propios, apunta la escena y la toma.
- Para efectos y pisadas, entrega WAV mono con el golpe cerca del inicio. Conserva las tomas por separado, con nombres como `paso-madera-01.wav`. Para ambientes y música, lleva una versión estéreo limpia cuando exista.
- Para un bucle, elige un tramo continuo con principio y final compatibles. Para motores, separa el arranque, el movimiento estable y el frenado. Para el piano, entrega las ocho notas individuales; la melodía del puzle se arma al tocar.
- Si ya tienes decididos los ambientes, la tanda más útil para comparar es **gata y Churu → furgoneta → apagón → autito y escotilla**. Los pasos pesados del perseguidor y el piano real serían los siguientes si quieres mejorar la claridad de la casa.
