# Validación · versión 1.2

Fecha: 6 de noviembre de 2026. Repositorio: https://github.com/lugal3/valeteamo
Base recibida: `df2377a`, después de conectar la carpeta local vacía y ejecutar fetch/pull de `main`.

## Compilación y pruebas de lógica

- `npm ci` completado; no se añadieron dependencias al proyecto.
- `npm test` pasa con lógica real y un renderizador simulado: seis salas y enlaces recíprocos, puertas, llave, ruta completa, tienda/economía, recompensas únicas, bomba, pila, rayo, aliados, manto, jefe, escotilla, daño, invulnerabilidad, muerte y reinicio.
- Nuevas comprobaciones: texturas de Kitty y Louis, pasos y orientación, daño/deformación, muerte del personaje elegido, parpadeo breve y zonas muertas táctiles sin afectar teclado.
- Ofertas: aceptar, rechazar, regresar, compra sin fondos, recursos y corazones llenos; congelación efectiva de reloj, vida, movimiento, bombas y activo mientras hay diálogo; pausa y resize con una oferta pendiente; doble aceptación sin duplicar efectos; objetos conservados al salir y volver, sin duplicación, incluso tras resize; reinicio que vacía los objetos de la partida anterior.
- Geometría comprobada a 844×390, 852×393, 932×430, 926×428, 734×235, 750×280, 760×206, 1120×680 y 330×760. Se conserva el área jugable de 92 000 unidades y el encuadre completo de sala.
- `npm run sprites` genera los dos PNG editables de 96×160 con transparencia a partir de los dibujos reales del juego. Se inspeccionó visualmente la hoja de Louis.
- `npm run build` pasa: TypeScript estricto y Vite. Phaser continúa en un chunk grande (~1,48 MB, ~340 KB gzip), ahora cargado al comenzar la aventura. Vite informa una advertencia de tamaño; no impide compilar.
- `git diff --check` sin errores de espacios.

## Revisión en navegador

Se utilizó Edge en modo headless, sin abrir una ventana de escritorio, contra un servidor Vite temporal en 127.0.0.1:5178. Playwright se instaló fuera del repositorio para esta comprobación; no modifica package.json ni el lockfile del juego.

- Se capturaron e inspeccionaron portada a 1440×900, 844×390 y 390×844, carga, sala con Louis y ventana de Holy Mantle.
- Se comprobó la portada y el alcance de los botones de pausa con viewport reducido de 734×235. El contenido puede desplazarse en pantallas de poca altura.
- Selección real de Louis/Kitty, carga, un único canvas tras volver a la portada y comenzar de nuevo, y pausa automática al girar a vertical.
- Ventana de objeto accesible por rol/nombre, foco inicial, Tab/Mayús+Tab, rechazo sin cobro y compra con cobro exacto. B y Espacio no consumen recursos durante el diálogo.
- Ningún error JavaScript en la prueba principal.
- Se activó temporalmente una hoja PNG válida mediante interceptación de la configuración de desarrollo: el cargador la reconoció y creó texturas de 16×20. También se comprobaron los respaldos con una imagen de dimensiones erróneas y una imagen ausente: ambos permiten iniciar con arte generado. Esos casos producen los avisos técnicos esperados.
- La instrumentación para inspeccionar la escena existió solo en las respuestas interceptadas del navegador de pruebas; no hay una referencia de depuración global en el código entregado.

## Límites y comportamiento

No se probó en un iPhone físico, Safari real ni con dos dedos sobre una pantalla capacitiva. La emulación de dimensiones y los tests no garantizan comportamiento idéntico de audio, safe areas, barras de Safari o fullscreen en iOS. Tampoco se evaluó el sonido con escucha física durante la prueba headless.

Los objetos se conservan por sala en memoria de la partida. Recargar la página, el HMR o iniciar otra partida reinicia el progreso. No hay guardado persistente ni promesa de funcionamiento offline. Los retratos de portada/carga siguen el dibujo por código; cambiar un PNG del personaje solo cambia sus texturas dentro del juego, tal como explica la guía.

La publicación solicitada corresponde a un commit en GitHub. No se configura hosting ni GitHub Pages como parte de esta actualización. Para probar localmente se mantienen las instrucciones de README.md y PROBAR-IPHONE.md.
