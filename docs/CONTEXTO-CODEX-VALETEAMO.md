# VALETEAMO — CONTEXTO MAESTRO PARA CODEX

El [README principal](../README.md) es la guía actual del repositorio. Este contexto reúne decisiones de versiones anteriores. El [índice de documentación](INDICE-INFORMES.md) enlaza los informes y las anotaciones de diseño.

**Contador y emote What Is Love? (12 de noviembre de 2026).** La entrada muestra el tiempo hasta las 00:00 del 5 de diciembre de 2026 en Santiago de Chile. El engranaje admite `LP` para pasar a la portada original antes de la fecha. Este acceso de vista previa se evalúa en el navegador. El título visible y los íconos de la app usan «Feliz cumpleaños Vale» y la foto aportada de Kitty. La puerta de entrada se monta por encima de `StoryApp`; el cambio dentro de `StoryApp` se limita al título y la marca.

El emote usa el tramo 00:48–00:58 de «TWICE _What is Love__ Dance Video.mp4», aportado por el propietario. La pista `src/lab/audio/emote-what-is-love.mp3` sincroniza las poses de la bailarina de camiseta blanca, capturadas cuadro a cuadro y adaptadas al rig de Kitty. `src/lab/animations/what-is-love.js` interpola las poses horneadas, retiene un pie de apoyo y lleva la mano al talón al levantarlo. Se activa con **9** o «Emotes» en el baño.

**Muebles, tele y presidente (11 de noviembre de 2026):** rama `codex/casa-muebles-tele-y-presidente` sobre `a44603e`. El salón se orienta hacia una tele que reproduce en bucle el tramo 0–15 s de YouTube. El lavamanos, el refrigerador y varios cajones se pueden registrar. La sala de música tiene un altar dedicado a Louis y un dossier del presidente ficticio Friedrich Weiss, el perseguidor. Ver [revisión de muebles y pruebas](MUEBLES-TELE-Y-PRESIDENTE.md).

**Oscuridad, notas y pilas 3D (11 de noviembre de 2026):** rama `codex/oscuridad-notas-y-pilas` sobre `4461359`. Las habitaciones sin luz quedan en penumbra y las placas de los interruptores llevan un punto tenue para ubicarlas. Las notas tienen papel doblado con fibras y trazos de tinta. Las pilas son cilíndricas, con envoltura y contactos metálicos. El medidor superior izquierdo muestra la carga de la linterna. La carga dura unos siete minutos de uso efectivo, avisa al 15 % y se recupera hasta 55 puntos por pila desde la mochila. La casa del rescate parte con una pila de repuesto. El acertijo del espejo requiere la ampolleta del baño o la linterna. La carga y los interruptores pertenecen a la sesión de la casa.

**Ampolletas, interruptores y sombras 3D (11 de noviembre de 2026):** rama `codex/luces-y-sombras-casa` sobre `57bb85f`. Hay 12 ampolletas en 11 circuitos y 12 interruptores en las dos plantas. Los dos interruptores de la escalera comparten circuito y el recibidor parte encendido. Se opera mirando la placa y pulsando E o el botón de interacción. Las sombras se dibujan con la geometría de paredes, puertas y muebles en un atlas WebGL1 de 256 × 256 por fuente, con bordes suavizados y caché para ampolletas fijas. El modo fluido conserva las sombras. El espejo usa las luces de la escena. Por rendimiento se calculan las cuatro ampolletas encendidas más cercanas a la vista. El estado de los circuitos se reinicia al reiniciar la casa.

**Bailes y expresiones de Kitty 3D:** rama `codex/kitty-bailes-y-expresiones` sobre `4532b63`. 6–7 hace un paso lateral con transferencia de peso y palmas alternadas. Gangnam cruza las muñecas, alterna rodillas altas y hace el lazo con una mano mientras mantiene el paso. Ambos usan los audios existentes. Kitty tiene la cabeza más grande, el torso más compacto y rubor en el color de la malla. `src/lab/animations/face.js` calcula un parpadeo reproducible para el espejo y la cinemática que muestra a Kitty de cuerpo entero. Los ojos se deforman sobre la misma malla, con movimiento reducido y sin trabajo facial en primera persona.

**Controles, teléfono y nota en mano (10 de noviembre de 2026):** iteración en `codex/hud-telefono-espejo` sobre `03b35e2`. Engranaje único, hotbar inferior configurable, joystick con respuesta WASD y puertas por interacción. Kitty levanta la nota al entrar al baño y el espejo muestra sus cifras. Teléfono con reloj del dispositivo, chat de Luis, Snake, fotos y cámara de la escena. Mezclador con ajustes por canal y exportación de la mezcla. Solo se reutilizan los sprites 2D para visualizarlos en Fotos. Cambios de juego en `src/lab/`, sin migración de partidas ni despliegue.

**Recortes para los emotes del baño:** `emote-six-seven.mp3` usa 15,5–23 s y `emote-gangnam.mp3` usa 4–11 s. Ambos están en `src/lab/audio/` en MP3 estéreo a 96 kb/s, con nivel medio equivalente y fundidos cortos. Las poses se repiten durante los 7,5 y 7 s y se sincronizan con el reloj de audio. Enlaces aportados por el propietario. [Teletón es SIX SEVEN](https://www.youtube.com/watch?v=0gM1_CwPD4Q) · [Gangnam Style](https://www.youtube.com/watch?v=9bZkp7q19f0)

**Nota reflejada y caja fuerte (10 de noviembre de 2026):** iteración en `codex/nota-espejo-caja-fuerte`, sobre `c864840`. Nota del estudio con glifos reflejados, ayuda tras más de un minuto activo y lectura automática 1505 al mirar el espejo cercano. La caja del salón entrega el símbolo del corazón que antes daba el cuadro, conservando llave, dormitorio y perseguidor. Ver `docs/NOTA-ESPEJO-Y-CAJA-FUERTE.md`. Solo fuentes de `src/lab/`, sin tocar 2D, guardados ni el módulo compartido de puzles. Sin merge, push ni despliegue.

**HUD discreto (10 de noviembre de 2026):** iteración en `codex/hud-mensajes-discretos`, sobre `314891e`. Objetivo compacto y canal de avisos con prioridad, retirada del banner de Luis conservando el punto sin leer, alerta fuera del teléfono y distribución que respeta el dock. Ver `docs/HUD-DISCRETO-Y-MENSAJES.md`. Solo presentación de la casa en `src/lab/`, sin cambios a CSS compartido, 2D, guardados o tiempos de eventos. Fusión local a `main` autorizada después por el propietario, incluyendo las animaciones V2. Sin push ni despliegue: subir `main` activa Firebase automáticamente.

**Animaciones de cuerpo y emotes V2 (10 de noviembre de 2026):** iteración en `codex/animaciones-cuerpo-y-emotes`, sobre `207ab7a`. Poses y acentos para 6–7/Gangnam, apoyos por longitudes reales, piezas de brazos ajustadas, mezcla al interrumpir/cambiar baile y amortiguación discreta de la mano/cámara. El teléfono conserva la marcha. Ver `docs/ANIMACIONES-CUERPO-Y-EMOTES-V2.md`; fuentes solo en `src/lab/`, sin cambios al 2D ni guardados. Incluida en la autorización posterior de fusión local de la rama del HUD. Sin push ni despliegue.

**Movimiento atascado (10 de noviembre de 2026):** reparación en `codex/corregir-movimiento-atascado`, sobre `be8ef1a`. Teclas físicas normalizadas, liberación de respaldo de ratón/táctil y limpieza al recuperar la página; se conserva el control independiente de dos dedos. Ver `docs/CORRECCION-MOVIMIENTO-3D.md`. Solo fuentes de `src/lab/`, sin cambios al 2D ni guardados. El propietario autorizó después la fusión local a `main`, incluido el trabajo previo del perseguidor y grabaciones. Sin push ni despliegue: publicar `main` activa Firebase automáticamente.

**Perseguidor y grabaciones (10 de noviembre de 2026):** iteración en `codex/perseguidor-y-audio-grabado`, sobre `b896135`. Dieciséis recortes de los once archivos aportados y continuación tras el aviso: llegada, escondite, búsqueda/persecución física, captura/reintento y avance hasta Louis. Ver `docs/PERSEGUIDOR-Y-AUDIO-GRABADO.md`. Este tramo sustituye el antiguo final del primer escondite solo en el recorrido normal 3D. Incluido en la autorización posterior de fusión local de la rama de movimiento. Sin push ni despliegue; procedencia/licencias de los audios pendientes de completar antes de publicar.

**Sonido, HUD y emotes (9 de noviembre de 2026):** nueva iteración de la casa sobre `8768a07`, en `codex/sonido-hud-y-emotes`: foley de puertas/peldaños, zonas de crujido, hotbar lateral configurable, teléfono con marco y fondo visible, agacharse y emotes del rig. Alcance, pruebas y estado de publicación en `docs/SONIDO-HUD-Y-EMOTES.md`. El 2D permanece protegido.

**Reparaciones y teléfono (9 de noviembre de 2026):** sobre `4a74efa`, se corrigen rangos de geometría dinámica, llave/cajón y espejo desde el pasillo. Hotbar, teléfono, respuestas automáticas y primera llegada con diez segundos para esconderse. El recorrido normal 3D termina en esa etapa; todavía no hay perseguidor. Ver `docs/REPARACIONES-ANTIGRAVITY-Y-TELEFONO.md`. Se mantienen las mejoras visuales de Anti-Gravity y la protección del 2D.

**Animaciones reutilizables:** Kitty usa 15 articulaciones, reposo/caminar por desplazamiento real y clips separados en `src/lab/animations/`. Las poses se calculan al mostrar el espejo. Ver `docs/ANIMACIONES-PERSONAJE.md`; la entrada actual conserva su cámara y comparte apoyos de manos con el módulo de ventana.

**Acabado chibi:** mano, linterna y Kitty del espejo comparten modelos redondeados y sombreado suave; joystick 3D aumentado. Referencia y pruebas en `docs/MODELOS-CHIBI.md`. No se modificaron los sprites ni los juegos 2D.

**Actualización autorizada (8 de noviembre de 2026):** espejo de Kitty/linterna, menú de pruebas agrupado y separación musical implementados. Ver `docs/ESPEJO-Y-PRUEBAS.md` para especificación, límites y validación. Se mantiene el 2D; se autorizó cambiar navegación compartida y audio de transición.
**Estado revisado:** casa V5 (8 de noviembre de 2026), desarrollada sobre `192fc34`; ver `docs/CASA-V5-ESPACIO-ATMOSFERA-Y-ENTRADA.md`. Escalera y descansillos ampliados, circulación auditada, ambiente por zonas y entrada animada por ventana. Todo el 2D continúa protegido. Repo: https://github.com/lugal3/valeteamo · Web: https://valefc.web.app/. Para el estado de publicación exacto, comprobar `main` y su ejecución de Firebase en GitHub Actions.

> **MANDATO DEL PROPIETARIO: NO MODIFICAR, ELIMINAR, REEMPLAZAR, "LIMPIAR" NI REFAC­TORIZAR EL 2D SIN AUTORIZACIÓN EXPLÍCITA.** El 2D le gusta como está. La prioridad actual es entender y separar el proyecto, no combinarlo en un solo juego, no borrar pruebas y no rediseñar el 2D.

## 1. Qué hay realmente (no son dos repositorios ni dos proyectos React)

**Un único proyecto web** con varias experiencias independientes que conviven. Hay **tres recorridos 2D** más **una casa 3D** y pantallas de desarrollo:

| Experiencia | Cómo se abre ahora | Motor | Naturaleza | Protección |
|---|---|---|---|---|
| **Portada VALETEAMO** | Al abrir la URL, pulsar PLAY | React + CSS + Web Audio | Pantalla de entrada, imagen `portada-v2.webp`, partículas, melodía original después del gesto | Mantener salvo encargo concreto de UI |
| **A. Historia de cumpleaños 2D** | «Abrir mi regalo» / «Continuar la historia» | React + Phaser 3 con proyección isométrica (NO 3D) | Recuerdos, preguntas, tres desafíos, selección Kitty/Louis, carta y cómic | **CONGELADA: NO TOCAR** |
| **B. Aventura clásica 2D** | «Jugar la aventura clásica» | React + Phaser 3 | Juego anterior de seis salas, enemigos, tesoro, tienda, jefe, economía, objetos y combate | **CONGELADA: NO TOCAR** |
| **C. Prólogo de rescate 2D** | «Jugar la demo de rescate 2D → 3D» | React + Phaser 3 | Jardín, corazón, secuestro no violento de Louis, pétalos/pistas, puerta y transición | **CONGELADO: NO TOCAR** |
| **D. Casa del rescate 3D** | Después del prólogo de rescate | WebGL1 propio (no Three.js, no Phaser para la casa) | Casa única de dos pisos, cámara en primera persona, ventana cinematográfica, escaleras, linterna, pistas, dos puzzles y rescate | Área de desarrollo FUTURA, siempre por rama y revisión |
| **E. Menú «Pruebas»** | Botón pequeño «Pruebas» en la portada de cumpleaños | React, checkpoints aislados | Tres accesos principales: 2D Corazones (isométrico nivel 2), Rescate 2D → 3D y Casa 3D. Abajo: Espejo, Cajón y pistas, Dormitorio y rescate, Aventura clásica, Historia y preguntas. | No quitar sin permiso; se puede estudiar ocultarlo al público en una tarea futura |
| **F. Menú de laboratorio antiguo** | Código `src/lab/index.js` | HTML+JS/WebGL1 | Menú experimental histórico con entradas de planta baja/alta/interacciones | **No está montado por `index.html` actual**, que carga solo `/src/main.tsx`. No confundir archivo que existe con pantalla activa |

### Flujo real
```text
index.html → src/main.tsx → StoryApp.tsx → Splash (PLAY)
                                     ↓
                           Portada «Feliz cumpleaños»
                              ├─ Historia de cumpleaños → desafíos Phaser 2D → carta/cómic
                              ├─ Aventura clásica → seis salas Phaser 2D
                              ├─ Demo de rescate → jardín Phaser 2D → transición → casa WebGL1 3D → rescate
                              └─ Pruebas → checkpoints de la misma demo (NO partidas adicionales)
```

**Importante:** el nombre `sanrio-garden` del `package.json` es heredado, no identifica un segundo juego instalado. Las opciones se fueron acumulando por evolución y pruebas. No hay que eliminar nada para comprenderlas.

## 2. Árbol lógico de código / propiedad de cada módulo

### Capa común / orquestación
- `index.html`: HTML real de entrada. Monta **solo** `src/main.tsx`.
- `src/main.tsx`: configura React y conserva `ClassicApp`; al final monta `<StoryApp ClassicApp={ClassicApp}/>`.
- `src/StoryApp.tsx`: **router de estados manual**; `screen` puede ser `splash`, `cover`, `story`, `game`, `classic`, `rescue`, `tests` o `arcade` (combate 2D aislado). Por aquí nacen las cuatro experiencias. No existe una carpeta totalmente independiente por juego.
- `src/FullscreenControl.tsx`: pantalla completa y orientación.
- `src/demo/Splash.tsx`, `splash.css`, `welcome-melody.ts`: portada compartida, partículas, jingle original que se activa tras gesto de usuario.
- CSS `src/story.css`, `src/style.css`, `src/birthday.css`: estilos compartidos y del 2D. **Cuidado con efectos colaterales al editar estilos globales**.

### A. Historia de cumpleaños: 2D isométrico — NO TOCAR
- `src/StoryApp.tsx`: selección, capítulos, UI, navegación, recuerdos, carta y cómic (archivo transversal: edición de este archivo puede romper otros modos).
- `src/story-content.ts`: contenido de capítulos, textos, fotos de muestra, pregunta y carta.
- `src/story-progress.ts`: lectura/escritura del avance; clave `valeteamo-story-v1`.
- `src/StoryGame.tsx`: contenedor de Phaser, controles, HUD, pausa y pantalla horizontal.
- `src/iso-game.ts`, `src/isometric.ts`: desafíos 2D, proyección, enemigos, movimientos y combates.
- `src/chibi-art.ts`, `src/reference-characters.ts`, `src/characters.ts`: personajes y animación chibi.
- `src/audio.ts`: sonido de historia y juegos 2D.
- `public/sprites/kitty-reference-sheet.png`, `kitty-walk-sheet.png`, `louis-reference-sheet.png`, `louis-walk-sheet.png`: hojas activas; **NO REGENERAR** por accidente.
- `public/comics/jaja-uno-xd.png`: cómic de cumpleaños.
- Los recuerdos personales siguen siendo **ejemplos**. No inventar fotos o recuerdos reales ni subir material privado sin permiso.

### B. Aventura clásica: 2D seis salas — NO TOCAR
- `src/main.tsx` contiene `ClassicApp`, UI y unión con StoryApp.
- `src/game.ts`: motor Phaser de las seis salas, combate, objetos, puertas y transiciones.
- `src/config.ts`: mapa, dificultad, economía y balance; `src/geometry.ts`: habitaciones y colisiones.
- `src/art.ts`, `src/garden-art.ts`, `src/effects.ts`, `src/animation.ts`: arte, animaciones, partículas, efectos.
- `README-CLASICO.md`: explicación histórica detallada, no orden para cambiar la versión actual.

### C. Prólogo 2D de rescate — NO TOCAR
- `src/demo/RescueDemo.tsx`: Phaser del jardín, Kitty, corazón, sombra, desaparición de Louis, pistas, transiciones; crea y destruye el Phaser al pasar al modo casa.
- `src/demo/progression.js` y `progression.d.ts`: estado del rescate, validación y guardado.
- `src/demo/rescue.css`: HUD y joystick del jardín 2D.
- Es distinto de los **tres desafíos** de la historia. No reescribirlo para introducir un motor 3D.

### D. Casa 3D — área para futuros cambios con autorización
- `src/lab/house.js`: bucle de render, entrada cinematográfica, gestos, cámara, puertas, HUD, pickups, puzzles, salida y conexión con `RescueDemo`.
- `src/lab/world.js`: colisiones, alturas y transformación de piezas móviles; `src/lab/house-layout.js` define la distribución V4, habitaciones, muebles, escalera y entorno.
- `src/lab/navigation.js`: movimiento barrido, colisiones y escaleras.
- `src/lab/camera-controls.js`: giro y suavizado, inversión horizontal, sensibilidad; preferencias locales.
- `src/lab/mirror.js`: modelo procedural de Kitty y reflejo acotado del baño; el checkpoint `mirror` se abre desde «Pruebas».
- `src/lab/window-intro.js`: secuencia por la ventana, salto opcional y aterrizaje.
- `src/lab/renderer.js`: WebGL1, geometría real, shaders de materiales, luces y linterna/mano 3D.
- `src/lab/sound.js`: ambiente y efectos 3D con Web Audio.
- `src/lab/atmosphere.js`: ambiente por zonas, crujidos, viento/grillos, tuberías y sonidos físicos procedimentales; exclusivo del 3D.
- `src/demo/house-puzzles.js`: secuencia de pistas y condiciones de puertas/rescate.
- `src/lab/lab.css`: HUD y controles de la casa. **Archivo también usado por RescueDemo**; revisar selectores para no afectar 2D.
- `src/lab/index.js`: lanzador de pruebas anterior, actualmente **no es el punto de entrada activo**.

## 3. Guardados y estados: NO mezclar
- **Historia 2D:** `localStorage['valeteamo-story-v1']`. Capítulo, desbloqueos, personaje, respuestas, preferencias. No sincronizado entre equipos.
- **Rescate 2D→3D:** `localStorage['valeteamo-rescue-v2']`. Es separado: corazón, secuestro, pistas, entrada y rescate. Sus checkpoints de `Pruebas` se crean aislados.
- **Cámara 3D:** `valeteamo-house-camera-v3` (sensibilidad e inversión horizontal).
- **Sonido de laboratorio 3D:** `valeteamo-lab-sound-v1`.
- La aventura clásica no debe asumir persistencia completa entre recargas; tiene estados de partida distintos.
- **NO** borrar el `localStorage` entero ni cambiar claves durante una tarea de orden documental; sería pérdida de partidas.

## 4. Assets: activos vs referencias
- **Activos en 2D**: cuatro PNG de personajes bajo `public/sprites/`; originales y plantillas en `public/sprites/templates/` (el comando `npm run sprites` puede sobrescribir plantillas).
- **Portada activa**: `public/demo-assets/portada-v2.webp`, usada desde `Splash.tsx`. También permanecen `005-portada-valeteamo.webp/jpeg` de versiones anteriores.
- **19 ilustraciones originales** están en `assets/originales/`, con 19 copias WebP bajo `public/demo-assets/referencias/` (001–019). Son **material de referencia**, no texturas 3D repetibles ni animaciones listas.
- **Kit futuro**: `public/demo-assets/kit/kitty-poses.webp`, `iconos-aventura.webp`, `casa-y-jardin.webp`, `manifest.json`. No asumir integración jugable solo por estar en el repo.
- **Casa 3D**: se dibuja principalmente con mallas geométricas y materiales/shaders procedimentales; la mano y linterna 3D no son un sprite de kit.
- `dist/` es **salida generada** por Vite; no es fuente ni lugar para subir nuevas texturas.

## 5. Tecnologías reales
- **UI**: React 19 + TypeScript + CSS.
- **Juegos 2D**: Phaser 3.90; historia usa proyección isométrica sobre un plano 2D.
- **Casa 3D**: renderizador WebGL1/GLSL ES 1.00 propio, **no Three.js** y no motor Phaser en esa fase.
- **Herramientas**: Vite 6, Node.js, npm, Playwright (Chromium para pruebas).
- **Audio**: Web Audio procedural; comienza tras interacción del usuario según límites del navegador.
- **Almacenamiento**: localStorage; no se ha documentado backend de usuarios ni guardado en nube para partidas.
- **Hosting**: Firebase Hosting proyecto `valefc`, dominio `https://valefc.web.app/`.

## 6. Publicación, ramas y seguridad
- El workflow `.github/workflows/firebase-hosting-live.yml` ejecuta instalación, tests, build y despliega a Hosting `live` **solo con cambios en `main`** (o cuando se lo lanza manualmente según su configuración).
- Referencia de despliegue anterior a V5: ejecución `42484678611` (**success**) para SHA `192fc340c0461ceb691808ee9c487d8c284dc7a4`. Ver: https://github.com/lugal3/valeteamo/actions/runs/42484678611. La publicación de V5 debe comprobarse con el SHA de su entrega; esta referencia no acredita una versión posterior.
- Otras acciones `demo-rescue-checks.yml`, `fix-nav-checks.yml`, `casa-v3-checks.yml` contienen filtros de ramas históricas; **no corresponden a otros juegos**.
- Nunca subir secretos ni service account JSON a repositorio ni compartirlos en prompts.
- Flujo recomendado a Codex: rama `docs/...` o `feature/...` desde `main` → diagnóstico sin cambios → cambios acotados al módulo autorizado → `npm test`, `npm run build`, browser tests si aplica → PR con resumen → aprobación explícita de cambios 2D si los toca → merge a `main` solo por solicitud del propietario → comprobar Firebase. **La publicación requiere un encargo expreso; la entrega V5 sí se solicitó con publicación.**

## 7. Comandos en el PC (desde la raíz clonada)
```powershell
git status
git branch --show-current
git pull origin main
npm ci
npm run dev
```
Abre la URL que anuncia Vite (normalmente `http://localhost:5173`).
```powershell
npm test
npm run build
npx playwright install chromium
node tests/demo-browser.cjs
npm run test:browser
```
**Advertencia:** los tests de navegador son sobre Chromium con emulación, no una prueba real de Safari en iPhone. Si no se dispone de Playwright, informar esa limitación en lugar de asumir éxito.

## 8. Índice de informes (y cómo leerlos)
**ESTADO VIGENTE / código actual:**
- `docs/CONTEXTO-CODEX-VALETEAMO.md` (ESTE ARCHIVO): fuente de orientación consolidada, sin sobreescribir detalles especializados.
- `docs/CASA-V5-ESPACIO-ATMOSFERA-Y-ENTRADA.md`: análisis espacial de toda la casa, cotas comparables, plano, auditoría de rutas/alcance, ambiente por zonas, animación inicial y verificaciones. Base `192fc34`; datos y vídeo en `docs/capturas/casa-v5/`. Las distribuciones V3/V4 son referencias de entregas anteriores.
- `docs/CASA-V4-ENTORNO-Y-ARMARIO.md`: nueva distribución autorizada del 3D, jardín y vecindario, ocho puertas con bisagra, armario animado, carteles y música de tensión. Base `700e74c`; evidencias en `docs/capturas/casa-v4/`.
- `docs/AUTOPROMPT-CASA-V4.md`: especificación aplicada a los ocho comentarios visuales del propietario, manteniendo el 2D protegido.
- `docs/CASA-V3-ANALISIS-Y-QA.md`: análisis técnico de cámara, render, escaleras, cinemática, pruebas y límites de la V3.
- `docs/ARTE-Y-MECANICAS-V2.md`: inventario del kit de assets reinterpretados y relación con la casa/portada.
- `docs/ASSETS.md`: las hojas activas de personajes para el 2D.
- `docs/RECURSOS-DEMO.md`: inventario 001–019. **Su párrafo inicial que afirma que no se subieron imágenes es histórico/contradictorio**; verificar los ficheros reales de GitHub.
- `HISTORIA.md`: edición de recuerdos (con advertencias de privacidad).
- `README.md`: introducción funcional a la historia; tiene frases antiguas de Hosting no publicado.
- `README-CLASICO.md`: mecánicas y pruebas de la aventura clásica de 6 salas.
- `docs/DEMO-RESCATE.md`: flujo de rescate con pruebas/puzzles; **su aviso «no fusionar / no publicar» era válido en una rama que ya se integró**.
- `docs/MEGAPROMPT-CASA-V3.md`: requisitos del desarrollo V3, **no tareas pendientes automáticas**.

**HISTÓRICO / NO LEER COMO ESTADO ACTUAL:**
- `docs/VALIDACION-1.2.md`: prueba del clásico en fase 1.2 (sin Hosting en aquel momento).
- `docs/VALIDACION-1.3.md`: prueba de la historia 1.3 (sin Hosting en aquel momento).
- `CONTEXTO-PROYECTO.md`: documento anterior a rescate/3D/Firebase; muy útil para el 2D, **desactualizado en despliegue**.
- `README-3D-PRUEBAS.md`: prototipo de laboratorio antiguo sin rescate (menú index.js ahora no montado por index.html).
- `PROBAR-IPHONE.md`: pruebas en red local con PC, no diagnóstico físico certificado.

**Regla de precedencia:** código real de `main` + estado GitHub Actions > contexto maestro vigente > documentos técnicos específicos > informes/versiones históricas. Si hay contradicción, señalarla, no adoptar ciegamente la afirmación más reciente que aparezca en un texto viejo.

## 9. Trabajo futuro separado por áreas (NO EJECUTAR HASTA ENCARGO)
- `2D-HISTORIA`: recuerdos, capítulos, arte, controles y aventura 2D isométrica. **Congelado**.
- `2D-CLASICO`: seis salas, combate/economía y contenido retro. **Congelado**.
- `2D-RESCATE`: jardín/prólogo del rescate. **Congelado**.
- `3D-CASA`: control de cámara, rendimiento, colisiones, escaleras, textura, nuevos muebles, puzzles. Se puede planificar **sin editar 2D**.
- `PORTADA-UI`: pantalla VALETEAMO y menús; antes de cambiar navegación discutir qué caminos deben ser visibles. No remover caminos antiguos sin consenso.
- `ASSETS`: reinterpretar y catalogar imágenes para futuros sprites, atlas, animaciones y modelos; mantener originales.
- `DOCS-QA`: unificación documental, índices, capturas, estado de las versiones, pruebas.

## 10. Reglas concretas para una nueva conversación de Codex
1. Comienza leyendo este documento y `AGENTS.md` de la raíz, luego el archivo del módulo elegido.
2. **No empieces a programar** sin especificación de qué experiencia se modifica.
3. No asumas que «dos juegos» significa eliminar uno: la UI agrupa distintas etapas históricas y modos.
4. El 2D completo se preserva como comportamiento, arte, controles, UI, progresos, escenas, audio y rutas.
5. Prioriza tareas documentales, inventario de pantallas/estados y diagrama de dependencias antes de reorganizaciones.
6. Si se pide «dejar solo la casa» más adelante, **primero** diseña un menú simplificado compatible con el 2D oculto y restaurable; nunca borres código.
7. No añadir dependencias, rehacer motor o refactorizar `StoryApp.tsx` sin razones medibles y aprobación.
8. Entrega informe de archivos tocados, no tocados, pruebas realizadas, limitaciones, PR/commit y estado de publicación.

## 11. Prompt breve listo para Codex
> «Trabaja sobre `lugal3/valeteamo`, rama `main`. Lee `AGENTS.md` y `docs/CONTEXTO-CODEX-VALETEAMO.md` antes de intervenir. Este repositorio tiene una historia 2D isométrica, un clásico 2D, un prólogo de rescate 2D y una casa WebGL1 3D. **Protege TODO el 2D y los guardados; NO BORRES, REFACTORIZES NI CAMBIES MECÁNICAS 2D.** Por ahora deseo exclusivamente orientación técnica, inventario de opciones, separación lógica del código y un plan para trabajar individualmente cada experiencia. No implementes nada hasta que elija un módulo. Si detectas informes obsoletos, identifícalos sin borrar historia. No hagas merge ni despliegues sin autorización.»
