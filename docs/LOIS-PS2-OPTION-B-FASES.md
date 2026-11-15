# Lois 3D — opción B / plan de implementación escalonada

**Rama de trabajo:** `feature/lois-ps2-option-b-rig`  
**Base:** `e06061c55490b49709d697fe21becb24cc5ba0aa` (main, 15 nov 2026).  
**Estado:** fase 1 iniciada, sin publicación a Firebase ni merge. Cada “.” del usuario autoriza avanzar UNA fase y crear el siguiente commit en esta misma rama.

## Alcance y separación de identidad

- **Lois** (en el código heredado se identifica como `Louis` / `louis-companion`) es el NPC que Kitty rescata; su modelo 3D sí cambia.
- **Luis** (novio de Kitty) participa solamente por mensajes del teléfono **en el flujo 3D**. No introducir un modelo 3D ni ropa, rig, cámara o texturas para Luis. Hay arte heredado del prólogo 2D que se auditará por separado; no destruir el 2D clásico ni su historia en esta tarea.
- La **opción B** elegida muestra una persona joven de rostro estrecho, cabello castaño despeinado, ojos azulados, barba muy tenue y atuendo oscuro: blazer, camiseta clara, pantalones oscuros. **La imagen generada es referencia visual, no una malla importable ni una textura UV real**.
- Prohibido añadir fotografías de Pinterest como texturas finales directamente. Preparar UV a partir de una referencia autorizada o arte derivado original, evitando costuras y deformaciones.
- **No modificar main**, no publicar Firebase ni fusionar sin completar verificación y autorización expresa.

## Inventario auditado al inicio

| Responsabilidad | Módulo | Observación |
| --- | --- | --- |
| Estados, recorrido y rescate | `src/lab/louis-escape.js` | `untying → climb → hide → hidden → follow`, caminar, mirar, parpadear, desatar, seguimiento |
| Modelo antiguo | `louisModel` en `src/lab/louis-escape.js` | Partes independientes con colores; rostro sin textura fotográfica |
| Modelo a geometría de escena | `src/lab/pickup-models.js` | Enlaza el modelo con la geometría de objetos |
| Actualización visual | `HouseRenderer.updateDynamic` en `src/lab/renderer.js` | Modifica transformaciones de piezas en VBO dinámico, sin skinning humano |
| Sombras / materiales | `src/lab/material-shaders.js`, `materials.js` | WebGL1, atlas de materiales; no hay atlas facial dedicado |
| Cine, rescate y UI | `src/lab/house.js` | Debe conservar su flujo |
| Regresión funcional | `tests/rc-car.cjs` | Prueba cambios de fase, parpadeo, hombros y ocultarse |
| Pruebas visuales | `tests/house-production-browser.cjs` | No ejecutar reemplazo en main |

## Fases (una por “.”)

### Fase 1 — Auditoría y contrato técnico (esta entrega)
- Rama aislada y contrato de identidad visual PS2 B (`src/lab/lois-ps2-profile.js`).
- Especificación de proporciones, paleta, límite de triángulos, atlas, esqueleto humano y canales expresivos.
- Adaptador determinista que muestrea las fases existentes sin alterar lógica o posición; metadato `visualPreset` no cambia el dibujo.
- Test automático sin navegador y flujo CI exclusivo de rama; el modelo original debe renderizar igual.
- **Criterio de salida:** `npm test`, `npm run build`, prueba del contrato PS2 y `tests/rc-car.cjs` aprobados. Ningún asset nuevo en producción.

### Fase 2 — Geometría PS2 B alternativa
- Construir cuerpo low-poly: blazer oscuro, camiseta, pantalón, zapatos y manos, silueta y proporciones del diseño elegido.
- Cara en malla continua (no 20 volúmenes superpuestos) con nariz, barbilla, pómulos y labios; cabello por mechones simplificados.
- Conmutador reversible antiguo/nuevo **solo en la rama**; validación frontal, perfil, 3/4, fondo iluminado y oscuro.
- Presupuestos diferenciados móvil y escritorio. **No reemplazar definitivamente hasta pasar visuales**.

### Fase 3 — UV y texturas faciales
- Desplegado UV estable para rostro/orejas/cuello, mapas sRGB; 512 px móvil y 1024 px escritorio si el dispositivo lo soporta.
- Usar referencias de rostro autorizadas para crear una textura cohesionada (ojos, cejas, labios, stubble); no pegar pantallazos completos.
- Integrar textura en el renderizador WebGL1 sin asignar texturas nuevas por cuadro; fallback a color si el asset falla.
- Comparar con las cuatro fotos de referencia y la **opción B** para likeness sin artefactos, incluyendo perfil.

### Fase 4 — Rig, animación corporal y facial
- Un rig anatómico con jerarquía de huesos, mirada, apertura de mandíbula, parpadeo real y expresiones (miedo, alivio).
- Retarget de los eventos existentes (`untying/climb/hide/hidden/follow`), caminar sin deslizamiento, girar, agacharse, respirar.
- Pruebas 30/60/120 Hz y `prefers-reduced-motion`; ninguna animación altera colisiones ni mecánica.

### Fase 5 — Cinemáticas y preparación para ampliaciones
- Ajustar encuadres de desatar, subida del sótano, cocina americana y seguimiento para que el rostro sea visible.
- Añadir *hooks*, sin activar contenido narrativo inventado, para hablar, mirar a Kitty, reaccionar, manos y labios.
- Limpiar transiciones bruscas sin modificar rutas del puzzle ni comportamiento de Luis (teléfono).

### Fase 6 — Optimización, QA y preparación de integración
- Revisar FPS, memoria GPU, atlas, draw calls, colisiones y pérdidas de contexto WebGL en móvil.
- Pruebas funcionales y visuales, capturas reales o emuladas, análisis del diff contra main y plan de reversión.
- Dejar un PR revisable; **integración a main solo cuando el usuario apruebe**.

## Criterios innegociables

1. Conservar todos los estados del rescatado y sus eventos, diálogos y sonido.
2. No confundir Luis con Lois ni añadir representación 3D de Luis.
3. No tocar el juego clásico Corazones.
4. Sin cambio a secretos/credenciales, guardados existentes, Firebase ni despliegues en las fases de trabajo.
5. Perfil y malla alternativos, rollback simple; performance iPhone tan importante como parecido facial.
