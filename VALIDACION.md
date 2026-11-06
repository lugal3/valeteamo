# Validación · versión 1.1

Fecha: 6 de noviembre de 2026. Repositorio: https://github.com/lugal3/valeteamo

## Código y geometría

- TypeScript estricto y compilación Vite correctos. El bundle principal contiene Phaser y ronda 1,75 MB (424 KB gzip); la advertencia de tamaño de Vite no es un error.
- `npm test`: integración de la lógica real con renderizador simulado. Comprueba exactamente seis salas y enlaces recíprocos; bloqueo de puertas/llave; ruta completa y compras; recompensa única; pila/bomba/rayo/aliados/manto; vida y carga del HUD; daño, invulnerabilidad y muerte; empuje limitado y resistencia del jefe; ataques anticipados, escotilla y reinicio.
- Geometría probada a 844×390 (iPhone 14), 852×393 (iPhone 15), 926×428 y 932×430 (variantes grandes), además de 734×235, 750×280 y 760×206 como espacios disponibles más reducidos por barras/safe areas, escritorio y vertical. Son pruebas de dimensiones, no emulación completa de iOS.
- En cada geometría: área jugable constante de 92 000 unidades (38% de la anterior), cámara uniforme que abarca la sala completa, puertas visibles y rayo limitado a paredes. Resize mantiene estado de partida y posición relativa; las ofertas siguen dentro de la sala.
- Se comprueban fotogramas distintos de caminar/orientación/disparo, movimiento y carga simultáneos, hitboxes constantes, cancelación de dedos independientes y pausa sin reinicio.
- Regresión: un golpe mortal no puede quedar anulado por un corazón recogido en ese mismo frame.

## Revisión visual parcial

Se abrió la compilación en el navegador integrado solicitando una pestaña oculta (`visible:false`). Se revisó el inicio del juego en un viewport 844×390: sala encuadrada de borde a borde dentro del área disponible, personaje más legible respecto al escenario, HUD compacto, minimapa y controles pequeños. No aparecieron errores ni advertencias en la consulta de consola realizada. Esta captura se mostró durante la comprobación, pero no se guardó un nuevo archivo de captura.

El usuario reportó interferencias con el foco de League of Legends. Se detuvieron **todas** las operaciones de navegador, incluidas las ocultas. No se repitieron capturas, cambios de viewport ni pruebas de escritorio. La revisión visual completa en los demás tamaños y de las animaciones en combate queda pendiente; las comprobaciones restantes se limitaron a archivos, compilación, lógica, GitHub y HTTP sin interfaz. No se manipularon procesos ni ventanas de LoL.

No se ha probado en iPhone físico: quedan pendientes Safari real, dos dedos en pantalla capacitiva, audio en el teléfono, barras dinámicas y safe areas reales, modo de pantalla de inicio y fullscreen en navegadores compatibles. Los tests no sustituyen esas pruebas.

## Red local y partida estable

La interfaz Wi-Fi del PC conservaba `192.168.1.15`. Se inició el preview compilado en `0.0.0.0:5173`, sin HMR, y se comprobó por HTTP desde el PC tanto HTML como JavaScript, CSS, manifest e iconos PNG (todos con respuesta 200). El proceso de Node se lanzó con ventana oculta y se dejó funcionando. Esto no demuestra conectividad física desde el iPhone; ambos dispositivos necesitan misma Wi-Fi, PC encendido y acceso de Node en red privada.

Cambiar de app/perder foco/girar pausa y limpia entradas. El efecto React que crea Phaser depende únicamente de comenzar, no de vida, pausa, mute ni resize. Recargar la página o el HMR del servidor de desarrollo puede reiniciar; no hay persistencia solicitada. `preview` evita los reinicios por cambios de código mientras se prueba.

## Pantalla completa y pantalla de inicio

Botón fullscreen condicionado a `document.fullscreenEnabled` y la función `requestFullscreen`, con salida y manejo de rechazo. No se promete fullscreen de contenido general en Safari de iPhone. Manifest, iconos originales 192/512 y metadatos Apple incluidos; sin service worker, túneles ni publicación del sitio.

Referencias primarias consultadas: [Apple: abrir una web como app](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios), [WebKit: limitación de Fullscreen en iPhone](https://bugs.webkit.org/show_bug.cgi?id=206854).
