# Kitty · El jardín de los deseos

Prototipo 1.2 · Regalo de cumpleaños del 4 de diciembre de 2026. React + TypeScript + Vite + Phaser. Código: [lugal3/valeteamo](https://github.com/lugal3/valeteamo). Solo el juego: seis salas, sin álbum, preguntas ni correo. Arte pixelado y música originales generados por código, sin servicios ni assets remotos.

## Iniciar en Windows

Con Node.js 20.19+ o 22.12+ instalado, abre una terminal en esta carpeta:

```powershell
npm install
npm run dev
```

Abre la dirección que indica Vite, normalmente `http://localhost:5173`.

### Probar una partida estable, sin reinicios por editar archivos

```powershell
npm run build
npm run preview -- --port 5173 --strictPort
```

Cierra el servidor de desarrollo de ese puerto antes de usar preview. `dev` y `preview` ya escuchan en `0.0.0.0`. Preview sirve los archivos compilados y no tiene HMR: editar fuentes no reinicia la partida ni cambia el juego hasta volver a compilar. Recargar explícitamente la página sí reinicia; no hay guardado persistente.

### Desde iPhone 14/15 o un teléfono de otro tamaño

1. PC y teléfono en la misma Wi-Fi, con el PC encendido y el servidor funcionando.
2. Ejecuta `ipconfig` en el PC y busca la IPv4 de su adaptador Wi-Fi.
3. En Safari abre `http://IP-DEL-PC:5173`, por ejemplo `http://192.168.1.15:5173` si esa sigue siendo su dirección. **localhost en el iPhone es el propio iPhone**, no el PC.
4. Si Windows solicita permiso de red para Node, permite redes privadas. Una red de invitados puede aislar dispositivos.
5. Pulsa Comenzar aventura y gira a horizontal. Jugar no requiere instalar nada.

La sala se adapta al viewport dinámico que Safari deja disponible. El juego no puede quitar las barras del navegador a la fuerza. El botón de pantalla completa aparece únicamente cuando el navegador declara soporte real de la API; permite entrar y salir y gestiona el rechazo sin impedir jugar.

**Opcional, sin barras de Safari:** Compartir → Añadir a pantalla de inicio. Activa «Abrir como app web» si aparece y abre ese icono. Se incluyen manifest, iconos 192/512 y metadatos Apple; no hay service worker ni promesa de funcionamiento offline. La disponibilidad y el nombre de las opciones dependen de iOS. [Guía de Apple](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios), [limitación de fullscreen registrada por WebKit](https://bugs.webkit.org/show_bug.cgi?id=206854).

## Novedades de cumpleaños

Portada «Feliz cumpleaños Valentina», selección de Kitty o Louis Tomlinson en pixel art y pantalla de carga con estética de RPG portátil. El motor se carga al comenzar; la barra sigue etapas reales de preparación. Desde pausa o final puedes volver a elegir personaje.

Pasos con polvo y sonido tenue, retroceso al disparar, golpe con deformación y tinte, parpadeo breve, muerte animada, objetos flotantes, polen y transición al entrar en sala. Zona muerta táctil para evitar acciones accidentales.

**Para trabajar en el arte hoy:** [chupalo_alexitico.txt](chupalo_alexitico.txt) explica el sistema exacto, sus límites y cómo entregar tus dibujos. Hay [plantillas PNG editables](public/sprites/README.md) de 96 × 160 px y soporte para cargarlas desde `src/characters.ts`. `npm run sprites` regenera solo las plantillas, sobrescribiéndolas.

## Controles y estados

- Táctil: toque/arrastre izquierdo para moverte y derecho para apuntar/disparar en cualquier dirección. Dos dedos independientes. Los joysticks solo aparecen al usarlos, muy tenues. Mueve unos píxeles para indicar dirección.
- Botones inferiores: bomba de lazo y objeto activo. El activo muestra LISTO o las salas que le faltan de recarga. HUD superior: tres tipos de corazón, monedas, bombas, llaves, minimapa, pausa y sonido. ✧ indica Holy Mantle listo.
- Objetos: Recoger/Comprar o Dejarlo aquí; Tab cambia de botón, Enter elige y Escape rechaza. No se gasta nada antes de aceptar. Tras rechazar, aléjate y vuelve para reconsiderar.
- PC: WASD mueve, ratón pulsado o flechas disparan, **B coloca bomba**, Espacio usa activo, Esc pausa. Las teclas se muestran solo en interfaces con puntero fino.
- Cambiar de app, perder foco o girar a vertical pausa y limpia las entradas; volver no reinicia la escena. Pulsa Continuar. Cancelar un toque o redimensionar tampoco deja movimiento/disparo atascados.
- Kitty y Louis tienen reposo/parpadeo, cuatro pasos alternos, orientación en cuatro direcciones, pose de disparo mientras camina, carga, reacción al golpe y caída al morir. Las animaciones no cambian su hitbox.
- Golpe real: reacción rosa y parpadeo de invulnerabilidad. Bloqueo de Holy Mantle: destello dorado y sonido propio, sin restar vida.
- Proyectiles y rayo tienen impactos con pétalos, estrellas, sonido y empuje corto. El jefe resiste más el empuje. Los enemigos aparecen con una señal y anticipan sus ataques con un halo rosa.

## Seis salas en una ruta lineal en zigzag

```text
Inicio    → Combate 1
                ↓
Combate 2 ← Tesoro
  ↓
Tienda    → Jefe
```

Las puertas de combate se abren al limpiar. Puedes regresar; recompensa y recarga se conceden una sola vez por sala. Empiezas con **5 bombas**, 12 monedas y una llave. La llave abre el tesoro una sola vez; la tienda cuesta 5 + 7 monedas y ambas ofertas son asequibles. Los enemigos dejan monedas y las salas de combate añaden llave y curación. Cada objeto muestra una ventana con descripción y decisión antes de recogerlo o comprarlo. El combate espera mientras decides. Los objetos que dejas se conservan al volver a esa sala durante la partida; las pilas colocadas se eliminan al salir. Los corazones con vida completa esperan en el suelo.

- **Brimstone, tesoro:** mantener dirección carga 0,85 s; después dispara un rayo que atraviesa enemigos hasta la pared. Se repite al mantener el disparo.
- **Kitty Cat’s head, tienda (5):** interpretación del nombre pedido, inspirada en Guppy’s Head. Reemplaza la pila por cuatro estrellas perseguidoras; usa la misma recarga.
- **Holy Mantle, tienda (7):** bloquea un golpe por entrada a sala; se combina con cabeza y rayo.
- **Activo inicial, pila adorable de caca:** obstáculo que bloquea el avance enemigo y absorbe sus balas, no un escudo personal. Recarga al limpiar una sala de combate.
- **Bombas:** fusible de 1,5 s, radio 92 unidades, daño 22 y sin daño propio. Se puede caminar mientras explotan.
- **Vida:** tres corazones = seis impactos. Rojo, alma y oscuro tienen color y mitades visibles; son una aproximación visual, no sistemas separados de daño o explosión. Curar recupera dos puntos, hasta seis.
- Kuromi traviesa persigue y dispara dirigido. Cinnamoroll flota en ondas y dispara un abanico. Mega Kuromi alterna anillos de balas y eclipses señalados durante 1,1 s.
- Al derrotar al jefe, **pisa la escotilla dorada central**. El juego no termina solo al derrotarlo. Muerte y final permiten repetir todo.

Dificultad fácil/media, unos 3–5 minutos según exploración. No hay límite de tiempo.

## Sala compacta y parámetros editables

La sala anterior tenía aproximadamente `786 × 308 = 242 088` unidades de área jugable. Ahora `CONFIG.roomArea = 92 000`: **38% del área anterior**, equivalente a cerca de 62% de ancho y alto si se conserva la proporción. Se reduce la geometría del mundo, no solo se agranda a Kitty. Se recalcula la proporción de la sala según el viewport y se usa una cámara fija con zoom uniforme para mostrarla completa. No hay CSS cover, deformación ni cámara que persiga al personaje.

Los márgenes son únicamente la pared, safe areas y una franja superior compacta de HUD. Las puertas y el centro permanecen visibles. Las zonas inferiores de pulgares no contienen objetos esenciales. Un resize conserva vida, compras, salas limpias y posición relativa; reubica también enemigos, pickups y señales dentro de los nuevos límites.

Velocidad 114 (antes 155), balas de jugador 245, balas enemigas base 82, alcance 290, eclipses de radio 31. Son ajustes para conservar espacio de esquiva. Sprite de Kitty a escala lógica 1,65 (antes 2,4), con textura mejor aprovechada de 16×20; se ve más grande respecto a la sala por el encuadre, sin duplicar únicamente su escala. Los controles físicos siguen siendo de 46–48 px y respetan safe areas.

- `src/config.ts`: dificultad, área, movimiento, cadencia, alcance, bombas, rayo, jefe, economía y mapa.
- `src/geometry.ts`: ajuste de área/proporción, cámara, puertas, límites, resize y recorte del rayo a la pared.
- `src/characters.ts`: selección de personajes y rutas opcionales de sus hojas PNG.
- `src/animation.ts`: estados y selección de fotogramas; movimiento y disparo pueden coexistir.
- `src/art.ts`: sprites originales, paleta, generación de poses y reemplazo opcional por hojas PNG de 96 × 160.
- `src/garden-art.ts`: suelo, caminos, flores, vallas y puertas.
- `src/effects.ts`: partículas, ondas e impactos; siguen el reloj de juego y se congelan en pausa.
- `src/game.ts`: escena, patrones, colisiones, objetos, empuje y transiciones. El empuje decae, se limita a la sala y no desplaza al jugador.
- `src/main.tsx` / `src/style.css` / `src/birthday.css`: portada, carga, HUD, diálogos, controles, safe areas, fullscreen y overlays.
- `src/audio.ts`: música y efectos Web Audio. Se desbloquean con el gesto Comenzar aventura; si fallan, el juego continúa.
- `public/`: manifest e iconos propios para pantalla de inicio.

## Validación

```powershell
npm test
npm run build
```

Pruebas de lógica con render simulado y comprobaciones geométricas de distintos tamaños. Los límites de la revisión visual y de Safari físico están detallados en [VALIDACION.md](VALIDACION.md). No se afirma haber probado en iPhone real.

Repositorio de código público; sin GitHub Pages, túneles ni despliegue web. Prototipo personal inspirado libremente en juegos de salas; no reproducción exacta de Isaac ni afiliado a Sanrio.
