# Mano, linterna y Kitty del espejo: acabado chibi

## Diagnóstico y referencia

Se inspeccionaron `first-person.js`, `mirror.js`, la generación de geometría y los shaders. La comparación visual se hizo con el archivo activo `public/sprites/kitty-reference-sheet.png`, sin modificarlo: cabeza marfil grande, orejas pequeñas, moño rojo, camiseta rosada y jardinera azul con botones amarillos.

Problemas de la versión anterior:

- Silueta de ocho segmentos en el espejo, orejas triangulares rígidas y vestido rosado que no coincidía con la referencia.
- El color casi emisivo del personaje borraba la percepción de volumen.
- Mano compuesta por pocas esferas y linterna cilíndrica con extremos abruptos.
- Diferentes diseños de linterna entre primera persona y espejo.

## Cambios

- `chibi-geometry.js`: superficies indexadas con normales analíticas interpoladas y perfiles biselados. Los vértices de una cuadrícula se reutilizan para reducir duplicados. Orejas redondeadas, cilindros con bordes suaves y ellipsoides con resolución específica por pieza.
- `chibi-model.js`: paleta común y modelos de linterna/manopla compartidos. Barril, cuello ensanchado, lente, aro, agarre con relieve, interruptor y puño rosado. No se importó ningún motor ni dependencia al juego.
- `first-person.js`: manopla que envuelve el agarre, pulgar recogido, nudillos redondeados y muñeca conectada al puño; manos de la entrada por ventana con el mismo acabado.
- `mirror.js`: proporciones chibi, cara sin boca, ojos ovalados, nariz, bigotes, moño rojo, camiseta rosada, jardinera azul y botones. Usa la misma linterna/mano que la primera persona, a escala.
- `material-shaders.js`: sombreado suave propio de estos modelos, con luz amplia, brillo discreto y borde suave. Se evita aplicarles el mapa de relieve del mundo. La iluminación de la casa mantiene su comportamiento.
- `renderer.js`: soporte de mallas suaves y giro sobre el tercer eje. El avatar del espejo no vuelve a subir su buffer a la GPU mientras su pose permanece igual.
- `house.css`: joystick izquierdo del 3D aproximadamente un 17–20 % mayor según pantalla; 90 px frente a los 76 px anteriores en horizontal compacto. El área de contacto también aumenta. Se conserva la conversión analógica proporcional al tamaño.

El 2D, sus sprites y las mecánicas de la casa no se editaron. El espejo sigue sin calcular luz reflejada, sombras nuevas ni recursión.

## Presupuesto y pruebas

| Modelo | Vértices | Triángulos |
|---|---:|---:|
| Kitty completa, mano y linterna del espejo | 11.518 | 19.920 |
| Mano y linterna en primera persona | 4.403 | 7.552 |
| Mano de la ventana (cada una) | 1.911 | 3.360 |

Geometría generada una vez y buffers reutilizados; el espejo continúa limitado al baño y a las orientaciones visibles. Estos presupuestos y las pruebas con renderizado por software no equivalen a medir FPS en un teléfono físico.

Validación:

- `npm test`: regresiones existentes más mallas finitas, normales unitarias, winding consistente, índices válidos, caché y presupuesto de vértices.
- `npm run build`: TypeScript y producción Vite.
- `tests/mirror-browser.cjs`: espejo en calidad normal/baja, navegación 2D/3D, movimiento, audio y guardados.
- `tests/chibi-browser.cjs`: reflejo sombreado, caché de GPU en reposo, joystick real arrastrado y liberado, aislamiento del giro, linterna encendida/apagada, controles en 740×360 y manos durante la entrada.
- Capturas: `docs/capturas/chibi/`.

Pendiente de validación física: Safari/iPhone y rendimiento en la GPU del usuario.
