# MEGAPROMPT DE PRODUCCIÓN — VALETEAMO V3 (CASA COMPLETA)
Versión de trabajo: 2026-11-07 · repositorio `lugal3/valeteamo`

## Papel y objetivo
Actúa como equipo senior de jugabilidad, ingeniería gráfica WebGL1, accesibilidad móvil, dirección de arte, sonido y QA. Tu misión es transformar el prototipo de la casa de VALETEAMO en **un único nivel jugable conectado**, continuo, atractivo y fluido, sin romper el regalo original, sin desactivar los puzzles, sin cambiar la URL pública y sin introducir librerías innecesarias.

## Diagnóstico basado en el código existente
- `src/lab/house.js:moveLook` restaba `dx` a `s.yaw`, mientras el renderer proyecta la mirada hacia `sin(yaw)`; ello hace que arrastrar hacia la derecha gire a la izquierda, en contradicción con ArrowRight. La inversión del giro es una causa técnica directa de la sensación de cámara contraria.
- La mirada modificaba yaw/pitch directamente por evento; la respuesta dependía del dispositivo y no había amortiguación, deadzone ni controles invertibles en el HUD del juego.
- El joystick ya suaviza la **traslación**: NO reintroducir aceleraciones erráticas. Priorizar el giro, el manejo de cancelación y la cámara para móviles.
- `src/lab/world.js` tiene dos plantas y una escalera continua, pero el arranque actual es un modal de instrucciones y no existe una entrada cinematográfica. Además, la ventana del sur aparece sobre pared continua, no como un hueco físico.
- Las paredes y pisos dependen de colores y patrones limitados en el fragment shader; mejorar materialidad mediante variaciones 100% deterministas en **coordenadas mundiales** para evitar vibración de textura.
- `src/demo/Splash.tsx` ya muestra portada y partículas, pero el audio introductorio no incluye una melodía específica, y los controles de inicio deben funcionar después de un gesto válido por las políticas del navegador.
- El motor actual WebGL1 cumple el alcance: conservarlo para este cambio. Three.js sería otra migración distinta que requeriría pruebas separadas.

## Entregables obligatorios y pruebas
1. **Cámara**: corregir la orientación horizontal; agregar amortiguación de yaw/pitch basada en delta real (sin overshoot, sin giro al soltar), sensibilidad configurable, opción de inversión horizontal accesible y guardada en el dispositivo; limitar pitch. Compatibilidad con mouse, touch, segundo dedo, pointercancel y ventanas desenfocadas. Mantener retícula coherente.
2. **Casa como un solo nivel**: mantener dos pisos reales unidos mediante escaleras, puertas, habitaciones, objetos y puzzles. Sin teletransportes arbitrarios durante la exploración. Colisiones suaves con paredes, puertas abiertas por proximidad y escalera continua. Probar ascenso y descenso. No modificar inventario de la historia original.
3. **Cinemática de ventana**: tras pulsar «Entrar», animar una cámara que se acerca desde fuera de una ventana, atraviesa una abertura visible y termina en un lugar válido dentro de la casa. Durante la secuencia, bloquear las entradas de movimiento para impedir exploits; texto corto, opción «Saltar»; si `prefers-reduced-motion` está activado o el jugador viene desde un punto de prueba, saltarla. Nunca saltar dentro de un muro; primer fotograma jugable en coordenadas seguras.
4. **Ambientación y texturas**: añadir elementos ligeros geométricos (molduras, plantas, alfombra, cuadros, detalles del estudio, escalones, lámparas) sin llenar los pasillos; mejorar shader con vetas de madera, dibujo sutil de azulejos, textura de yeso, textil y metal sin shimmering, y contraste cálido. Mantener WebGL1/ES100 y precisión float concordante en vertex y fragment. Evitar asset fetch remoto y efectos de alta complejidad en móvil.
5. **Portada**: animación de partículas sin bloquear el botón PLAY, capas suaves y decorativas, colores fieles a la ilustración, responsive 16:9 y vertical sin tapar título ni personajes; una **melodía original** procedimental breve al pulsar PLAY, respetando silencio guardado y autoplay restrictions. Soporte para preferencia de movimiento reducido.
6. **UX y HUD**: información contextual legible, indicador de orientación y de planta, interactuar solo cuando procede, botón discreto para invertir giro/sensibilidad, controles con áreas táctiles diferenciadas, accesibilidad y ahorro de batería.
7. **Calidad**: añadir pruebas automatizadas para signo del giro horizontal, estabilidad de la interpolación, límites de cámara, geometría navegable y arranque/cinemática. Ejecutar `npm ci`, `npm test`, `npm run build`, Playwright en Chromium para el recorrido de rescate y regresión del juego original. Probar perfil de viewport móvil al menos emulado; documentar lo que no pueda comprobarse en dispositivo físico.
8. **Despliegue**: trabajar primero en rama; fusionar a `main` solamente cuando CI esté verde; comprobar resultado del workflow Firebase Hosting y URL `https://valefc.web.app/`. No anunciar publicación hasta éxito confirmado.

## Criterios de aceptación medibles
- Arrastrar 80 px a la derecha aumenta yaw en modo normal; en modo invertido lo disminuye, y el pitch no excede ±1.1 rad.
- Soltar el dedo detiene el objetivo de giro, sin drift acumulativo ni signo contrario. La amortiguación responde igual a 30 y 60 FPS (tiempo real).
- El jugador atraviesa puertas abiertas sin colisión espuria y sube/baja la escalera del primer al segundo piso.
- La cinemática se reproduce una sola vez al comenzar la casa de la historia, se puede omitir y no aparece en checkpoints de pruebas. Su último fotograma se corresponde con una ubicación sin colisiones.
- La portada tiene partículas visibles y un motivo musical **original** audible solo tras gesto de usuario y cuando no está silenciada.
- Todo funciona sin conexiones a sitios de terceros ni paquetes nuevos, y los tests de la aventura original permanecen verdes.

## Enfoque de seguridad/entrega
Nunca usar ni exponer credenciales Firebase. Mantener las imágenes originales existentes. No dar como terminadas pruebas móviles físicas no realizadas. Documentar fallos y resolver antes de fusionar.
