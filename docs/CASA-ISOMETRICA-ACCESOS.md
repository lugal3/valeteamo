# Vecindario y casa isométricos: accesos, coherencia con el 3D y UX

## Problema resuelto
Anteriormente el edificio principal se pintaba al nivel de profundidad `y-4`, por delante del personaje y de los iconos de objetivos. Kitty podía quedar **oculta bajo las paredes**, mientras la puerta y la ventana estaban en el borde alto de un pasillo estrecho y parecían inaccesibles. Las tres casas vecinas ocupaban el lado de la calle por el que debía navegar la jugadora. Los tests existentes teletransportaban a Kitty al punto final, por lo que no detectaban ese fallo de recorrido.

## Fuente de verdad: casa 3D
`src/lab/house-layout.js` contiene:
- casa de **14 × 12 m** y 2 pisos de **3,15 m**;
- fachada sur en **z=12** con **puerta principal x=5,9**, bloqueada;
- **ventana abierta de entrada en x=2,2**, ala oeste (distinta de las ventanas tapiadas);
- **camino de entrada** centrado en **x=5,9**, z=16,25;
- **vereda** en z=20,5 y **calle** en z=23.

`src/demo/night-house-layout.ts` mantiene esas referencias y sus equivalentes en coordenadas isométricas: calle y vereda separadas, giro por el portón hacia el patio, puerta delante del porche, ventana lateral oeste. La transformación es intencionalmente esquemática: los metros 3D no se copian como colisiones sin proyectar.

## Movimiento, legibilidad y accesibilidad
1. `src/demo/rescue-overworld.ts` ensancha el vecindario por delante de la fachada, distingue asfalto, vereda y sendero de piedra y desplaza las casas vecinas al otro lado de la calle. El edificio se renderiza detrás de Kitty, de las marcas y de los indicadores, para evitar la oclusión del personaje.
2. La huella sólida del edificio impide atravesar los muros; `constrainRescue(candidate,map,previous)` permite deslizar el movimiento por la pared, sin tirar a Kitty dentro de la fachada.
3. Dos anillos y rótulos legibles distinguen **PUERTA** y **VENTANA**. Solo el marcador correspondiente a la etapa activa se anima; las otras señales actúan como indicaciones de contexto.
4. La UI tiene brújula, distancia y un botón táctil **«Guiarme caminando»**. En lugar de teletransportar al jugador, A* busca una ruta por celdas de media unidad, comprueba los segmentos continuos para evitar cortar paredes y suaviza los giros. El joystick o WASD **cancelan la guía instantáneamente**.
5. La interacción de puerta es más permisiva y sonora. Para encontrar la ventana oeste hay que moverse desde la puerta; no se ofrece la siguiente interacción sin acercarse.
6. La barra de la brújula usa área segura, permite interacción con teclado y tacto y no cubre los joysticks. No crea una escena ni un renderer nuevos.

## Pruebas automáticas
- `npm test` incluye `tests/night-house-navigation.cjs`, que valida el modelo 3D, las ubicaciones, colisiones y **24 rutas** verificadas con subpasos de 0,09 unidades, incluyendo las conexiones desde la calle y de puerta a ventana.
- `tests/prologue-browser.cjs` debe comenzar **desde el punto de entrada nocturno real**, abrir «Guiarme caminando», observar movimiento real, interactuar con puerta y ventana (sin teletransportes) y llegar al interior 3D; también comprueba las cinemáticas previas de Luis.
- `tests/prologue-desktop.cjs` valida WASD, disparos, cámara Corazones y portales.
- `tests/emotes-browser.cjs` valida controles 3D tras la entrada y `tests/landscape-gate.cjs` comprueba pantallas móviles.
- `npm run build` valida tipos y compilación para Firebase.

## Límites
No se ha sustituido el original **2D · Corazones**. No se ha cambiado el interior 3D, sus habitaciones, puzzles, muebles ni la transición del intro por la ventana. Las mejoras son exclusivamente el exterior isométrico, la seguridad del desplazamiento y sus señales de navegación.
