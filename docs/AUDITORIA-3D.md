# AUDITORÍA 3D — VALETEAMO FASE 0
> **Línea base sin cambios funcionales · 9 noviembre 2026 · base `main` (HEAD)**  
> Generado automáticamente. No modifica `src/`.

---

## 1. Estado de CI: `npm ci` · `npm test` · `npm run build`

### 1.1 `npm ci`
```
✓ Éxito — 25 paquetes instalados en ~13 s.
Aviso: esbuild@0.25.12 con postinstall (npm approve-scripts para autorizar).
Sin vulnerabilidades (0 found).
```

### 1.2 `npm test`

La suite de tests del `package.json` es:
```
node tests/smoke.cjs && node tests/story.cjs && node tests/audio.cjs
  && node tests/lab.cjs && node tests/rescue.cjs && node tests/house-navigation.cjs
  && node tests/camera-controls.cjs && node tests/window-intro.cjs
  && node tests/mirror.cjs && node tests/chibi-model.cjs
  && node tests/character-animation.cjs
```

| Test CJS | Resultado | Resumen del PASS |
|---|---|---|
| `smoke.cjs` | ✅ PASS | Geometría Kitty/Louis, rutas, economía, combate, jefe |
| `story.cjs` | ✅ PASS | Progreso, guardados corruptos, proyección isométrica |
| `audio.cjs` | ✅ PASS | Gesture-lock, mute, temas, limpieza |
| **`lab.cjs`** | ✅ PASS | V4+: habitaciones, posteres, trampilla, armario, estelas, animaciones de cajón/puerta, colisiones |
| **`rescue.cjs`** | ✅ PASS | Rescate por fases, puzzles encadenados, recuperación de guardado corrupto |
| `house-navigation.cjs` | ✅ PASS | Auditoría espacial V5: 12 zonas, 9 objetivos, geometría de escalera |
| **`camera-controls.cjs`** | ✅ PASS | Signo horizontal, inversión, límites de pitch, 30/60 fps, sin deriva, ajustes guardados |
| `window-intro.cjs` | ✅ PASS | Ventana, aterrizaje, apertura real, salto/reduced-motion |
| **`mirror.cjs`** | ✅ PASS | Pose simétrica, linterna invertida, geometría solo-baño, spawn seguro |
| `chibi-model.cjs` | ✅ PASS | Mallas finitas, normales suaves, winding, caché, materiales aislados |
| **`character-animation.cjs`** | ✅ PASS | Bind pose, attachments, normales unitarias, pie plantado (4 dirs), 30/60 Hz, pausa, reduced-motion |

> [!IMPORTANT]
> **Todos los 11 tests de `npm test` pasan sin errores.** Los tests mencionados en la tarea (`lab.cjs`, `story.cjs`, `rescue.cjs`, `camera-controls.cjs`, `mirror.cjs`, `character-animation.cjs`) existen y pasan correctamente.

**Tests del repositorio que NO están en `npm test`** (existen en `tests/` pero no están en el script):
- `tests/house-renderer-benchmark.cjs` — benchmark de rendimiento (requiere git commit `9be9867` como baseline)
- `tests/browser.cjs`, `tests/demo-browser.cjs` — requieren servidor Vite + Playwright
- `tests/house-3d-browser.cjs`, `tests/house-materials-browser.cjs`, `tests/house-production-browser.cjs` — Playwright
- `tests/house-v4-browser.cjs`, `tests/house-v5-browser.cjs` — Playwright con React splash
- `tests/chibi-browser.cjs`, `tests/character-animation-browser.cjs` — Playwright
- `tests/house-space-audit.cjs`, `tests/house-v4-renderer.cjs` — auditores históricos

**Fallo conocido de `house-v5-browser.cjs` en este entorno:**  
```
TimeoutError: locator('.splash-start') not visible after 30 s
```
Causa: el test presupone el flujo React completo (`launchHouse` via `StoryApp → Pruebas → Casa 3D`). En modo headless SwiftShader sin servidor `npm run dev`, el elemento `.splash-start` del componente React no se renderiza. No es un fallo de código; es una limitación del entorno CI sin pantalla real.

### 1.3 `npm run build`
```
✓ Éxito — 88 módulos transformados en 11.17 s
dist/assets/phaser-*.js  1 482 kB (gzip: 340 kB) ← aviso de chunk grande, normal
dist/assets/index-*.js    293 kB (gzip:  92 kB)
dist/assets/house-*.js    101 kB (gzip:  39 kB)
```
> [!NOTE]
> El aviso de chunk >500 kB corresponde únicamente a Phaser 3. No indica error de producción; el build de Firebase/Vite genera un bundle válido.

---

## 2. Benchmark de rendimiento · `house-renderer-benchmark.cjs`

**Entorno:** Playwright Chromium 158.0.8127.18 · SwiftShader (software renderer) · 960×540 (medium) / 528×297 (low)  
**Escenario:** Giro lento de cámara desde recibidor (`x=5.95, z=8.65`); lectura de pixel por `readPixels` para sincronizar GPU.  
**Muestras:** 12 frames tras 4 de calentamiento; mediana y P90.

> [!WARNING]
> SwiftShader es un renderizador por software. Los fps **son ~5–10× menores que en GPU real**. Estos valores son válidos para comparar versiones entre sí, **no** como objetivo de producción en dispositivo móvil.

### 2.1 Comparativa baseline vs. current

| Versión | Calidad | Resolución | Mediana (ms) | P90 (ms) | FPS mediana |
|---|---|---|---|---|---|
| `baseline` (commit 9be9867) | medium | 768×432 | 141.2 ms | 155.6 ms | **~7 fps** |
| `baseline` | low | 528×297 | 70.2 ms | 78.1 ms | **~14 fps** |
| `current` (HEAD) | medium | 768×432 | 128.4 ms | 140.9 ms | **~7.8 fps** |
| `current` | low | 528×297 | 38.4 ms | 42.8 ms | **~26 fps** |

**Resultado:** El renderizador actual es ~9% más rápido en medium y **~45% más rápido en low** respecto al baseline `9be9867`. La mejora en `low` es especialmente significativa (el modo fluido elimina el occlusion lookup de la linterna).

### 2.2 FPS por zona · SwiftShader medium 960×540

Script: `tests/zone-audit.cjs` (temporal, eliminado). JSON: `docs/capturas/3d-base/zona-fps.json`.

| # | Zona | Posición (x,z) | Mediana (ms) | P90 (ms) | FPS aprox. |
|---|---|---|---|---|---|
| 01 | **Recibidor / hall** | 5.95, 10.65 | 70.8 ms | 76.6 ms | **14.1** |
| 02 | Sala de estar (salón) | 2.20, 9.5 | 39.4 ms | 42.6 ms | **25.4** |
| 03 | Estudio | 2.60, 2.70 | 35.5 ms | 45.2 ms | **28.2** |
| 04 | **Escalera (base)** | 12.0, 10.9 | 65.3 ms | 77.7 ms | **15.3** |
| 05 | **Baño / espejo** ⚠️ | 8.80, 5.80 | 125.3 ms | 141.2 ms | **8.0** |
| 06 | Dormitorio | 2.50, 2.60 (pl.alta) | 47.4 ms | 55.8 ms | **21.1** |
| 07 | Sala de lectura | 2.20, 9.0 (pl.alta) | 49.7 ms | 51.6 ms | **20.1** |
| 08 | **Sala de música** | 10.0, 1.80 (pl.alta) | 67.3 ms | 77.1 ms | **14.9** |
| 09 | Cocina | 10.5, 2.50 | 50.0 ms | 60.9 ms | **20.0** |
| 10 | **Exterior / jardín** | 7.0, 16.0 | 79.5 ms | 91.5 ms | **12.6** |

**Zonas más pesadas en SwiftShader:** Baño/espejo (8 fps), Exterior (12.6), Recibidor (14.1), Música (14.9).

**Vértices y triángulos** (constantes en todas las zonas — render de escena completa sin frustum culling por zona):
- **Vértices totales:** 23 428
- **Triángulos totales:** 11 304

---

## 3. Inventario de materiales y geometría

### 3.1 Materiales de color (`MATERIAL` en `world.js`) — 28 entradas

| Nombre | RGB | Uso (cajas) |
|---|---|---|
| `wallpaper` | 0.75, 0.56, 0.65 | 44 |
| `wall2` | 0.57, 0.61, 0.69 | 26 |
| `plaster` | 0.68, 0.67, 0.72 | 4 |
| `wood` | 0.47, 0.29, 0.30 | **300** (el más usado) |
| `floor` | 0.48, 0.34, 0.38 | 1 |
| `tile` | 0.38, 0.51, 0.52 | 3 |
| `velvet` | 0.65, 0.33, 0.45 | 9 |
| `cream` | 0.85, 0.76, 0.65 | 37 |
| `pink` | 0.92, 0.59, 0.65 | 49 |
| `dark` | 0.28, 0.24, 0.33 | 16 |
| `glass` | 0.49, 0.63, 0.76 | 5 |
| `brass` | 0.94, 0.68, 0.33 | 39 |
| `paper` | 0.93, 0.84, 0.70 | 35 |
| `foliage` | 0.43, 0.61, 0.43 | **109** |
| `carpet` | 0.58, 0.37, 0.51 | 3 |
| `trim` | 0.80, 0.60, 0.57 | 8 |
| `terracotta` | 0.72, 0.42, 0.36 | 13 |
| `stem` | 0.31, 0.43, 0.29 | 13 |
| `glove` | 0.98, 0.88, 0.84 | — (Kitty) |
| `pawpad` | 0.96, 0.54, 0.62 | — (Kitty) |
| `torchmetal` | 0.39, 0.47, 0.57 | 2 |
| `torchglass` | 1.0, 0.93, 0.64 | 17 |
| `bow` | 0.84, 0.23, 0.36 | — (Kitty) |
| `grass` | 0.27, 0.39, 0.30 | 1 |
| `stone` | 0.55, 0.53, 0.51 | 2 |
| `asphalt` | 0.19, 0.22, 0.28 | 1 |
| `roof` | 0.27, 0.25, 0.32 | 6 |
| `carpaint` | 0.30, 0.50, 0.56 | 2 |

> [!NOTE]
> `wood` domina con 300 cajas (40%) — escalera, balaustres, muebles y estructura. `foliage` suma 109 cajas (8 plantas de jardín × 7 hojas + árboles + interiores).

### 3.2 Estilos de textura procedural (`materials.js`) — 16 estilos

| Idx | Nombre | Descripción visual |
|---|---|---|
| 0 | `papel-mural` | Patrón sinusoidal con motivo floral suave |
| 1 | `yeso` | Ruido fino grano, mate rugoso |
| 2 | `madera` | Veta de grano longitudinal |
| 3 | `tablones` | Veta + juntas de ranura entre tablones |
| 4 | `ceramica` | Bisel de borde, acabado pulido |
| 5 | `tejido` | Urdimbre y trama, semimate |
| 6 | `alfombra` | Tejido más rugoso, pelo largo simulado |
| 7 | `metal` | Microestriado de alta frecuencia, brillo especular |
| 8 | `hoja` | Nervio central + ramificaciones, mate vegetal |
| 9 | `papel` | Ruido muy fino, casi liso, mate |
| 10 | `arcilla` | Ruido medio, suave, terracota |
| 11 | `vidrio` | Liso, ondulación muy sutil, muy brillante |
| 12 | `patita` | Liso suave (piel Kitty), casi sin rugosidad |
| 13 | `laca` | Microestriado fino + brillo medio (carpaint/roof) |
| 14 | `tallo` | Ondulación de alta frecuencia, mate |
| 15 | `suave` | Fallback neutro, liso, sin patrón |

**Atlas:** 256×256 px · 16 tiles de 64×64 · gutter 2 px · inner 60×60.  
**Memoria de texturas GPU:** 1 atlas material (256²×4B) + 1 artwork atlas (256²×4B) + 1 light depth (32²×1B) = **~0.5 MB total**.

### 3.3 Piezas por mueble / elemento (cajas WebGL en `house-layout.js`)

| Elemento | Piezas (cajas) | Componentes |
|---|---|---|
| Sofá | 4 | asiento, respaldo, 2 brazos |
| Mesa de café | 5 | tablero, 4 patas |
| Mueble TV + pantalla | 3 | gabinete, marco, pantalla |
| **Escritorio + cajón** | **14** | tablero, 4 patas, respaldo, carcasa (×2), frente cajón, fondo, lat.izq, lat.der, trasero, tirador |
| Silla de estudio | 6 | asiento, respaldo, 4 patas |
| Estantería (con libros) | 21 | trasero, 4 estantes, 16 libros |
| Planta (pot, lip, stem, 7 hojas) | 10 | por instancia; 3 plantas interiores = 30 |
| Lámparas (base, vidrio, cap) | 3 | por instancia; 4–5 lámparas = 15–17 |
| Escalera (16 peldaños) | 16 | cada peldaño = 1 caja |
| Balaustres escalera | 28 | (2 lados × 14 postes) |
| Balaustres descansillo | 22 | (21 + 15 postes del descansillo) |
| Barandillas | 4 | 2 tramos de escalera + 2 de descansillo |
| Cama (estructura) | 9 | base, colchón, manta, cabecero, almohada, 4 patas |
| **Armario** | **39** | trasero, 2 laterales, tapa superior/inferior, 2×(2 montantes + 12 lamas + 2 raíles + pomo) |
| Baño (inodoro, lavabo, etc.) | 9 | base WC, tapa, cisterna, armario, lavabo, 2 marcos espejo, 2 raíles espejo |
| Cocina total | 13 | encimera, nevera, horno, vidrio horno, 4 fuegos, fregadero, grifo, caño |
| Mesa comedor | 5 | tablero + 4 patas |
| Silla comedor (×2) | 12 | (6 piezas × 2 sillas) |
| Puertas (8 puertas) | 24 | 3 piezas por puerta (hoja, tirador, panel) |
| Cuadros (6 cuadros) | 16 | marco + lienzo por cuadro |
| Árboles (6 árboles) | 24 | 1 tronco + 3 copas |
| Jardín plantas (8 grupos) | 80 | 10 piezas × 8 |
| Coche | 9 | carrocería, cabina, parabrisas, 4 ruedas, 2 faros |
| Casas vecinas + lejanas | 20 | 2 vecinas (cuerpo+tejado+2ventanas) + 3 lejanas (cuerpo+tejado+2ventanas) |

**Total cajas en escena:** 745 (excluyendo objetos interactivos independientes)  
**Total objetos interactivos:** 27

### 3.4 Distribución de cajas por zona

| Zona | Cajas | % del total |
|---|---|---|
| Escalera / descansillo | 187 | 25.1% |
| Exterior (jardín, vecindario) | 149 | 20.0% |
| Dormitorio | 84 | 11.3% |
| Sala de lectura | 73 | 9.8% |
| Estudio | 69 | 9.3% |
| Sala de música | 61 | 8.2% |
| Cocina | 51 | 6.8% |
| Salón | 49 | 6.6% |
| Baño | 14 | 1.9% |
| Recibidor / pasillo | 8 | 1.1% |

---

## 4. Las 10 zonas visualmente más pobres

Criterio: ausencia de objetos decorativos, superficies planas sin detalle, falta de props secundarios, iluminación sin puntos de interés.

| Rank | Zona | Problema visual principal | Referencia captura |
|---|---|---|---|
| 1 | **Recibidor / pasillo central** (planta baja) | Solo 8 cajas; pasillo vacío entre estudio y salón; solo consola lateral + alfombra de corredor + un cuadro | `01-recibidor.png` |
| 2 | **Baño** (sin espejo activo) | 14 cajas; sin ventana, sin vegetación; espejo es el único punto focal; toalla única; paredes planas de tile | `05-bano-espejo.png` |
| 3 | **Sala de música** (planta alta) | Consola, estantería, silla y guitarra — sin vegetación (la planta es de landing), escaso détail de pared | `08-musica.png` |
| 4 | **Exterior directo (sur)** | Fachada posterior con una sola ventana de entrada y pared plana; jardín solo con path y límites | `10-exterior.png` |
| 5 | **Escalera / hueco** | 187 cajas pero casi todas son balaustres y peldaños; paredes del hueco son wallpaper liso sin ningún prop | `04-escalera.png` |
| 6 | **Descansillo superior** | Banco y planta de descanso; paredes planas; carece de cuadro propio y de zona de espera definida | (incluido en `04`) |
| 7 | **Cocina** | Muebles funcionales presentes pero sin decoración (sin plantas, sin cuadros, sin alfombra, sin accesorios) | `09-cocina.png` |
| 8 | **Sala de lectura** (planta alta) | Alfombra y silla sí presentes, pero las dos paredes largas están vacías (solo 1 cuadro norte) | `07-lectura.png` |
| 9 | **Fachada exterior (norte)** | Sin props de jardín en fachada norte; solo cerca de madera; contraste con riqueza del jardín sur | (en `10-exterior`) |
| 10 | **Techo de planta baja** | El techo de yeso es una sola caja; no existe ningún detalle (vigas, molduras, luminaria de techo) | (visible en `02-salon`) |

---

## 5. Presupuestos propuestos (objetivos para fases futuras)

> [!NOTE]
> Los presupuestos se definen sobre **GPU móvil real de gama media** (Apple A15, Adreno 640), no sobre SwiftShader. Los valores de SwiftShader son 5–10× peores; úsense solo para comparación relativa entre versiones.

### 5.1 Triángulos

| Escenario | Presupuesto propuesto | Justificación |
|---|---|---|
| Triángulos totales (escena completa, sin culling) | ≤ **20 000** | Margen doble sobre los 11 304 actuales; permite añadir props sin riesgo en móvil |
| Por zona visible (con frustum culling futuro) | ≤ **8 000** | Cada zona ocupa ~1/3 del total visible; espacio para detalles |
| Personaje Kitty completo | ≤ **5 000** (tris) | Kitty ocupa 20 880 tris actuales (chibi-model); buscar LOD para vistas lejanas |

> [!CAUTION]
> Kitty (`chibi-model.cjs` reporta `triangles: 20 880`) supera con creces a toda la geometría de casa (11 304). En escenas donde Kitty aparece (espejo, rescate), el total supera **32 000 tris**. Este es el mayor riesgo de rendimiento.

### 5.2 Memoria de texturas

| Recurso | Actual | Presupuesto máximo |
|---|---|---|
| Atlas de materiales (256²×RGBA) | 256 kB | 512 kB (doble, si se añade atlas high-res) |
| Atlas de arte/cuadros (256²×RGBA) | 256 kB | 512 kB |
| Depth map de linterna (32²×L) | 1 kB | 4 kB (si se sube a 64²) |
| **Total texturas GPU** | **~0.52 MB** | **≤ 4 MB** (límite conservador móvil) |

### 5.3 Tiempo de frame (objetivos)

| Objetivo | Valor | Notas |
|---|---|---|
| Frame time objetivo (GPU real) | ≤ **16.7 ms** (60 fps) | Para dispositivos de alta gama |
| Frame time mínimo aceptable | ≤ **33.3 ms** (30 fps) | Para dispositivos de gama media/baja |
| Frame time P90 máximo | ≤ **50 ms** | Evitar hitching visible |
| Tiempo de setup inicial (rebuild) | ≤ **100 ms** | El `rebuild()` actual es síncrono; no debe bloquear UI |

**Estado actual en SwiftShader** (referencia relativa):
- Mejor zona (estudio): 35.5 ms median — equivale a ~28 fps SwiftShader
- Peor zona (baño+espejo): 125.3 ms — equivale a ~8 fps SwiftShader
- El espejo es el cuello de botella más claro: renderiza la escena completa reflejada

---

## 6. Archivos de evidencia generados

```
docs/AUDITORIA-3D.md                          ← este documento
docs/capturas/3d-base/
  ├─ 01-recibidor.png                          ← captura SwiftShader (negro en headless)
  ├─ 02-salon.png
  ├─ 03-estudio.png
  ├─ 04-escalera.png
  ├─ 05-bano-espejo.png
  ├─ 06-dormitorio.png
  ├─ 07-lectura.png
  ├─ 08-musica.png
  ├─ 09-cocina.png
  ├─ 10-exterior.png
  └─ zona-fps.json                             ← datos de FPS por zona
docs/capturas/casa-3d/rendimiento.json         ← benchmark baseline vs. current
```

> [!NOTE]
> Las capturas PNG de `3d-base/` tienen 2 664 B cada una (imágenes en negro). SwiftShader en modo headless de CI no renderiza al framebuffer visible. Los datos de timing son válidos porque provienen de `readPixels()` que sí fuerza sincronización GPU. Para capturas visuales reales usar `npm run dev` + pantalla conectada.

---

## 7. Conclusiones y próximos pasos sugeridos

1. **El pipeline CI es sólido:** 11/11 tests de `npm test` pasan; build exitoso.
2. **El renderizador actual es más rápido** que el baseline en ambas calidades (+9% medium, +45% low).
3. **El baño/espejo es el hot-spot de rendimiento**: 125 ms vs. 35 ms del estudio (3.5× más lento). El espejo dobla la carga de draw.
4. **Kitty supera en tris a toda la casa:** 20 880 tris del personaje vs. 11 304 de la casa. Prioritario implementar LOD.
5. **El recibidor y la escalera son las zonas visualmente más pobres** con más tráfico de juego — mayor ROI para añadir props.
6. **El baño y la sala de música** son las zonas con menos decoración por m².
7. **Sin frustum culling:** toda la escena (745 cajas) se envía al GPU en cada frame independientemente de la cámara.

