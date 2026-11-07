# Validación · historia chibi/isométrica 1.3

Base: `2eabfe19517a776785b5eed30e7d676b204ca071` en `lugal3/valeteamo`. Trabajo en la rama `demo/historia-cumpleanos-chibi`. La validación histórica de la versión 1.2 se conserva en `docs/VALIDACION-1.2.md`.

## Automatización y compilación

- `npm test`: lógica de la aventura clásica y nueva, mapa y controles, selección y ciclos de personajes clásicos, combates y objetos; progreso de historia, datos guardados dañados, navegación reversible, respuesta seleccionada, proyección isométrica, pausa, luces, proyectiles, jefe, victoria y derrota con renderizadores simulados.
- `npm run sprites`: genera las cuatro plantillas PNG, incluidas las chibi de 192 × 320.
- `npm run build`: verifica TypeScript y compila con Vite. Phaser se carga por separado al abrir un tramo. Vite puede advertir del tamaño del chunk del motor.

## Navegador de escritorio sin ventana

Se usó Microsoft Edge headless y Playwright instalado fuera del repositorio. Se revisaron visualmente portada a 1440×900 y 390×844, primer recuerdo vertical, pregunta y dos desafíos a 844×390. Un recorrido automatizado pasó por todas las escenas, incluida la carta, y comprobó recarga y recuperación del capítulo. Para dirigir el recorrido a través de los niveles se expuso temporalmente la instancia de escena mediante interceptación de una respuesta de desarrollo; no existe ese acceso global en el código entregado. También se probó movimiento real con teclado.

Una prueba independiente simuló pantalla táctil y dos dedos mediante el protocolo del navegador: movimiento y disparo simultáneos, liberación de los dos toques, pausa al iniciar en vertical, giro y continuación. Se corrigió el ajuste del lienzo al girar y se repitió la prueba. Se verificó además el aviso de almacenamiento bloqueado y que la historia sigue accesible.

Se configuraron temporalmente hojas chibi mediante interceptación de la configuración: un PNG válido de 192 × 320 se cargó; una imagen de otro tamaño y una inexistente conservaron el arte generado. No hubo errores JavaScript en el recorrido principal. Estos controles se hicieron en escritorio emulado, no en Safari físico.

La hoja de Kitty generada a partir de las referencias aportadas se cargó en Phaser: se verificaron texturas distintas para reposo, caminar, perfil y espalda, además de la pose de daño. Se comprobó que, si el PNG no está disponible, el personaje generado por código permite continuar. El asset tiene transparencia real y la escena lo adapta a celdas de 32 × 40 en memoria.

## Pendiente y límites

- Probar en iPhone físico y Safari: tacto real, notch, barras dinámicas, audio, recarga y pantalla de inicio; no se ha hecho. Tampoco se ha evaluado el audio mediante escucha física.
- Revisar con el autor el estilo de personajes, la perspectiva y el ritmo de cada desafío. Los sprites chibi son una primera versión; direcciones diagonales reutilizan las vistas existentes.
- Fotos, textos, preguntas y carta son marcadores editables, sin contenido personal. La sustitución y su privacidad dependen del material que aporte el usuario.
- El avance se guarda por capítulo en el navegador; recargar durante un nivel lo reinicia. Sin sincronización entre dispositivos ni garantía de conservación de datos del navegador.
- `firebase.json` prepara una posible publicación. No se ha vinculado una cuenta de Firebase, desplegado un sitio ni verificado una URL pública de prueba.
