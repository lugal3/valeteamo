# Emy: escaneo, distracción y objetos ruidosos

> Implementación experimental en la rama \`feature/emy-scan-distraccion-objetos\`. Está aislada de \`main\` y no está desplegada automáticamente.

## Arquitectura inspeccionada

El juego 3D **no usa react-three-fiber**: el renderizador de \`src/lab/renderer.js\` es WebGL1 propio. No integrar shaders para Three.js. La planta real la define \`src/lab/house-layout.js\` con dos alturas y los límites de \`ROOMS\`; \`roomAt\` agrega pasillos. La gatita usa \`src/lab/emy-companion.js\` y \`src/lab/emy-cat.js\`; el secuestrador está en \`src/lab/pursuer.js\`. El controlador central de botones, sonido, render y checkpoints es \`src/lab/house.js\`.

## Jugabilidad añadida

1. Acercarse a Emy y pulsar **E/Usar** muestra un panel con **Acariciar**, **Escaneo** y **Distracción**. El botón de acariciar conserva su animación original.
2. **Escaneo**: sonido de maullido, onda expansiva superficial alrededor de Emy y contorno verde translúcido en el modelo 3D **real** del secuestrador visible incluso cuando hay paredes delante, durante 6 s. Enfriamiento 28 s. Los enemigos inactivos no se dibujan como amenazas.
3. **Distracción**: mapa consultable de **planta baja y planta alta a la vez**, con botones en las posiciones relativas de los recintos. Las etiquetas provienen de \`world.rooms\`; los pasillos son áreas complementarias. Emy usa rutas navegables existentes entre plantas; cuando llega al destino, maúlla aproximadamente cada 1,5 s durante 25 s. Los eventos renuevan la investigación de ruido por el secuestrador. Enfriamiento 55 s desde la orden. Volverá a seguir a Kitty al terminar.
4. **Objetos ruidosos**: seis elementos ligeros iniciales de vasos, platos y tazas alrededor de la casa. Seleccionarlos con **E** para llevarlos en la mano; **G** lanza y **V** deja caer; hay botones táctiles para ambas acciones. Simulación ligera de gravedad, comprobación de obstáculos y choque, efecto percutivo de cristal/cerámica, y alerta que hace investigar la ubicación de impacto al secuestrador. Golpearlo con un proyectil lo aturde hasta 2 s. Al pasar uno cerca de Emy, ella se desplaza lateralmente si encuentra un lugar libre y adopta animación evasiva.

## Respeto a la historia

- Los poderes solo se muestran mientras Emy está disponible para interacción. No alterar introducción por ventana, recuperación de llave del conducto, escondites, escape con Louis ni secuencia del auto RC y la escotilla.
- La distracción no sustituye la detección visual de Kitty: perseguir a Kitty y perseguir el RC tienen prioridad sobre las investigaciones ruidosas.
- Los cambios son propios de la casa 3D. El 2D original y los assets existentes quedan intactos.
- El mapa dibujado por el usuario sirve como idea visual; las coordenadas y habitaciones jugables salen del mapa real, no de la foto.

## Archivos principales

- \`src/lab/emy-abilities.js\`: temporizadores, puntos de destino, mapa visual.
- \`src/lab/emy-companion.js\`: nuevo estado \`distract\`, navegación y esquiva.
- \`src/lab/pursuer.js\`: \`hearNoise\` y \`stun\`, con replanteamiento de ruta al cambiar el objetivo.
- \`src/lab/noise-props.js\`: geometría, interacción y físicas ligeras.
- \`src/lab/house.js\`: interfaz, entradas PC/táctiles, actualizaciones, integración.
- \`src/lab/renderer.js\` + \`src/lab/material-shaders.js\`: contorno mediante un pase de stencil por detrás de la profundidad.
- \`src/lab/emy-skills.css\`: panel, mapa a dos columnas, onda y botones.
- \`src/lab/sound.js\`: choque cerámico con WebAudio.
- \`tests/emy-abilities-noise.cjs\`: pruebas automáticas añadidas a \`npm test\`.

## Validaciones antes de mezclar a main

Ejecutar \`npm ci && npm run build && npm test && npm run test:perf\`; registrar resultados. Hacer inspección visual con la casa en modo nocturno y verificar el contorno del secuestrador **detrás de paredes y al cambiar de piso**; comprobar que desaparece al agotarse el escaneo y no interfiere con el espejo ni capturas. Enviar a Emy a habitaciones de ambos pisos, comprobar puertas, escaleras, regreso, cancelación por progreso de la historia y latencia al recalcular rutas. Comprobar todas las piezas, caída con ruido, aturdimiento, evasión de Emy y acciones táctiles en iPhone real (horizontal), también con calidad reducida y cambios de pestaña. Revisar fugas de buffers / audio, sombras y FPS de WebGL1.

**No afirmar que un test pasó hasta haberlo ejecutado realmente.** Este cambio está propuesto en una rama; un PR puede revisarse sin publicarlo aún en Firebase.
