# VALETEAMO — CONTEXTO MAESTRO PARA CODEX

**Perseguidor y grabaciones (10 de noviembre de 2026):** iteración local en `codex/perseguidor-y-audio-grabado`, sobre `b896135`. Dieciséis recortes de los once archivos aportados y continuación tras el aviso: llegada, escondite, búsqueda/persecución física, captura/reintento y avance hasta Louis. Ver `docs/PERSEGUIDOR-Y-AUDIO-GRABADO.md`. Este tramo sustituye el antiguo final del primer escondite solo en el recorrido normal 3D. Sin merge ni despliegue; procedencia/licencias de los audios pendientes de completar antes de publicar.

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
- `src/lab/mirror.js`: modelo procedural de Kitty/linterna y reflejo acotado del baño; checkpoint `mirror`, botón HUD exclusivo de pruebas.
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
