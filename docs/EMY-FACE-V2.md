# Emy — revisión localizada de rostro y cuello

Base fijada: c5db1355001b97ee1a26241e090a7ef5e87523d0. Rama feature/emy-face-ruff-v2; independiente de PR #54 y #55. No publicar ni fusionar. Fotos privadas fuera de GitHub.

Inspección real: no existe necesidad de reemplazar el renderer por glTF. Emy usa EMY_SCULPT, un esculpido de Blender generado como arrays. Base head 3301 vértices/6598 triángulos, headLow 1001/1998, coat 4397/8790, coatLow 1901/3798. Runtime principal 31060 vértices/48846 triángulos. 17 marcos de skin en cuerpo; cabeza y ojos/párpados/tongue por anclajes locales, orejas deformadas proceduralmente. Cuerpo y cola protegidos. El usuario acepta su estilo actual.

Comparación (geometría real reconstruida en cuatro ángulos, sin atlas en la inspección preliminar): mejillas globosas, hocico tipo almohadilla adelantada, ojos almendrados demasiado geométricos y pupila vertical uniforme, orejas triangulares rígidas; melena superior continua pero poco diferenciada. Fotos: silueta facial estrecha, nariz cálida pequeña, ojos amarillo verdosos almendrados con párpados naturales, pelos internos de orejas, mentón plateado y mechones de cuello largos, no un collar blanco. Ajustar solo cabeza y cuello superior; no inferir marcas traseras ocultas en fotos.

Copia inactiva exacta: src/lab/assets/emy/face-candidate.js (head y headLow). No se importa en runtime. Las pruebas de igualdad inicial se deben convertir a verificación de protección del original cuando empiece la edición. scripts/emy/export-face-baseline.mjs exporta OBJ locales de cabeza original/candidata, GLB estáticos de poses originales y atlas. Los GLB son revisión, no modelo animado ni reemplazo drop-in. Export-review.mjs y render-review.py siguen siendo la referencia de estudio. Workflow sin publicar produce ZIP de revisión. No copiar fotos al repo.

Archivos de trabajo:
- scripts/emy/build-sculpt.py (original, copiar variante de autoría; generar solo head/headLow)
- src/lab/assets/emy/sculpt.js (original inmutable)
- src/lab/assets/emy/face-candidate.js (variante)
- src/lab/emy-cat.js (anclajes, poses, IDs críticos philtrum, tongue, iris, lid, socket, concha, whiskers)
- src/lab/emy-sculpt.js (UV, tinte, fibras y pesos; cambios de ruff únicamente con máscara local; proteger coat y coatLow)
- src/lab/emy-surface.js (superficies de ojos, nariz, oreja; deformación procedural)
- src/lab/assets/emy/coat-v2.jpg (atlas original; nueva textura separada si se requiere)
- src/lab/material-shaders.js / renderer.js (solo revisar; no tocar globalmente)
- tests/emy-cat.cjs, tests/emy-surface-parity.cjs, tests/emy-companion.cjs, tests/emy-autonomy.cjs, tests/emy-abilities-noise.cjs, tests/emy-rescue-route.cjs y pruebas de navegador Emy.

Fases: 1 baseline real con cámara/iluminación fija y vistas ortográficas; 2 anatomía y silueta de cabeza; 3 ojos/párpados/expresión; 4 hocico/nariz/bigotes; 5 orejas/tufts y deformación; 6 melena local, atlas facial conservando otras regiones y UV; 7 integración opt-in candidata (original intacto), LOD y rendimiento; 8 matriz de poses y escenarios (ventilación, llave sostenida en philtrum, miedo/altar, ventana, escondites, rescate, final); 9 QA y comparación final antes/después. No rehacer animaciones, no cambiar IA, no degradar rendimiento, sin merge hasta aprobación. Mantener <32000 vértices y <50000 triángulos por Emy, <=65530 vértices dinámicos de escena, no incrementar presupuesto original sin justificación y medición; cero diferencias en torso/patas/cola fuera de máscara cuello. Mantener WebGL1, sin dependencias nuevas. Revisión física en iPhone pendiente.

## Fase 1 — estudio sincronizado
Abrir /emy-face-review.html con npm run dev. Solo laboratorio de desarrollo, sin entrada de build ni Firebase. Misma pose, atlas y cámara; seis vistas, giro, zoom, alarma, parpadeo, LOD y animación. Shader de estudio aproximado, no iluminación completa de casa. Extensión opcional de sculptSurface; default intacto. Pruebas de 40 combinaciones y comparación de píxeles en Chromium. Exportaciones Blender iniciales aprobadas en run 46159949681. Candidata idéntica hasta fase 2.

## Fase 2 — anatomía localizada
Dos variantes reproducibles, A suave (desplazamiento lateral máximo 17 mm) y B afinada (30 mm), no escalado global. Máscara protege orejas, unión de cuello, centro facial y aperturas frontales; mismas coordenadas Y/Z, topología, normales por jacobiano. `face-anatomy.js` solo se importa en laboratorio; el modelo activo y su copia exacta permanecen intactos. Pruebas de geometría y 40 combinaciones de poses/LOD protegen todas las partes excepto cabeza. El headLow original presenta dos desacuerdos entre normal de vértice y cara (índices 3435 y 4587); se prohíben nuevos, corregir en fase LOD. Fase 1: 768500 vértices comparados exactamente; arranque Chromium agotó 30s. Se igualan precisiones GLSL de interfaces y se instrumentan errores de arranque; causa pendiente de confirmación por CI.

Verificación adicional: 579140 vértices no faciales exactos en 40 combinaciones. Las exclusiones del pelo aceptaban 5/10 fibras extra en A/B; se limita al presupuesto original redistribuyendo la selección y conservando fibras completas. Candidata A anchura de mejillas 351.75→321.57 mm; B 351.75→317.06 mm. Sin nuevos desacuerdos de normales; dos previos de headLow registrados para fase LOD.

## Fase 3 — ojos y expresión
Fases 1/2: WebGL y paridad aprobados en 46161085541, artefacto 15269860796. Inspección de refined-front.png: mejillas menos redondas, iris verde demasiado intenso y patrón radial fuerte. Ojos V2 opcionales en laboratorio A/B: apertura almendrada compartida +3.5% ancho/+4.5% alto, inclinación exterior suave, iris oliva dorado, patrón radial más discreto, pupila vertical ligeramente más ancha, borde y reflejo suaves. Mismos anclajes, transformaciones y controlador original de parpadeo, miedo y ronroneo. El flag 21.25 sigue dentro de material iris del juego; shader refinado solo en estudio hasta fase integración. No cambia producción. Prueba 80 casos y capturas ojos off/on, neutral, sueño, miedo, ronroneo. Sin geometría adicional. Pendiente CI y revisión de parecido.

## Fase 4 — hocico y nariz
Fase 3 aprobada en Chromium run 46161375690 (80 casos y capturas). Deformación localizada de almohadillas y mentón por jacobiano, sin desplazar referencias centrales de boca, llave ni raíces de bigotes. Nariz cálida y punta superior más estrecha; tono plateado sutil de mentón sin mancha blanca artificial. Mantener todos los bigotes/filtrum/lengua y animaciones sin cambios. Toggle independiente en visor, capturas A/B frontal/perfil/3-4 y aseo. Prueba de 80 casos, normales y presupuesto gráfico. Pendiente CI.
