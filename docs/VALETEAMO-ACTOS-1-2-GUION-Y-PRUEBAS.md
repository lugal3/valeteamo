# VALETEAMO — Actos I y II · Prólogo 2D jugable

## Concepto
Comienza como aventura kawaii a plena luz de día y acaba en una casa inquietante durante el anochecer. La escena 3D empieza cuando Kitty encuentra una ventana abierta, utilizando la cinemática de entrada que ya existía.

**Personajes:**
- Kitty: protagonista jugable, corazones y pistas.
- Luis: novio de Kitty; pelo negro, lentes, polera sin mangas y tatuajes en brazo izquierdo. Aparece en el jardín y ayuda por mensajes desde fuera de la casa.
- Louis: personaje secuestrado, distinto de Luis; look juvenil One Direction, peinado castaño hacia un lado, ojos azules, camiseta blanca a rayas azules y pantalón rojo.
- Secuestrador: figura misteriosa al principio humana/de traje, transformación monstruosa reservada para Acto IV.

Los sprites nuevos son pixel art original creado mediante Canvas, **no son fotografías ni retratos de identidad exacta**. Se podrán mejorar cuando el usuario envíe referencias visuales.

## Secuencia de gameplay (objetivo: 8–12 minutos)

1. Jardín diurno: diálogo inicial y controles de movimiento.
2. Louis atacado por tres pequeñas sombras: corazones disparables, HP de enemigos, seis puntos de vida, reintento sin perder avance.
3. Diálogo con Louis: se presenta y menciona que un hombre de traje lo sigue.
4. Diálogo con Luis, novio de Kitty: se presenta y promete acompañarlos a distancia y comunicarse por teléfono.
5. Paseo acompañando a Louis hasta el claro.
6. Cinemática de desaparición: advertencia de Louis, sombra y secuestro, cambio progresivo a la noche.
7. Pistas en orden: pulsera de Louis → pétalos luminosos → huellas de ruedas; mensajes de Luis con información.
8. Casa: puerta principal cerrada, pista de Luis hacia la ventana abierta.
9. Ventana: diálogo final, entrada al motor 3D existente, animación de ingresar por la ventana.

No hay esperas artificiales; la duración depende del movimiento, combate y lectura.

## Integración y preservación

- El corazón de la galaxia ahora inicia el nuevo prólogo 2D canónico.
- El clásico de Phaser se mantiene sin modificaciones en src/game.ts y continúa accesible desde LP → Pruebas → Aventura clásica.
- El arcade original de corazones y las pruebas 3D también se mantienen.
- El prólogo utiliza una clave nueva de progreso, valeteamo-story-acts-1-2-v1, aislada de guardados antiguos.
- Al entrar a la casa, se llama a launchHouse() del código existente. Su introducción animada de la ventana continúa activa.
- La app de teléfono 3D ya tenía mensajes de Mi Luis ❤️; su texto inicial se ajustó para conectar con la secuencia de pistas y la ventana.

## Controles

Celular horizontal: joystick izquierdo; ♥ Disparar durante el combate; botón contextual cerca del personaje o pista; botón de diálogo para revelar frase y continuar.
Teclado: WASD/flechas, Espacio/F para atacar, E para interactuar, Enter/E/Espacio en los diálogos.
La pantalla blossom de orientación continúa global.

## Checklist

- npm test incluye tests/prologue.cjs para los cambios de etapa, guardados, daños/curación, identidades y enlace.
- tests/prologue-browser.cjs automatiza un recorrido en móvil: intro → ataque con corazones → Louis → Luis → secuestro → tres pistas → puerta → ventana → canvas 3D.
- tests/cosmos-public-flow.cjs verifica que el contador público continúe llevando al nuevo 2D.
- tests/landscape-gate.cjs confirma que se conserva el canvas del prólogo al cambiar de orientación.
- tests/cosmos-browser.cjs confirma que la galaxia sigue funcionando.

## Pendientes

- Mejorar el parecido de los personajes usando imágenes de referencia seleccionadas por el usuario.
- Música y efectos sonoros personalizados.
- Medir duración real en pruebas humanas.
- Actos III–V: evento de monstruo y persecución final; quedan para después de cerrar el prólogo.

## Archivos

src/demo/prologue-story.js: diálogo, estados y guardados.
src/demo/GardenPrologue.tsx: Phaser RPG y cinemática.
src/demo/prologue-art.ts: sprites pixel art de Luis y Louis.
src/demo/garden-prologue.css: HUD, controles y diálogos.
src/demo/RescueDemo.tsx: vínculo con la casa 3D existente.
