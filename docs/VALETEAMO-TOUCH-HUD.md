# V3.8 — corrección de cámara multitáctil

- Joystick independiente; arrastre de cámara sobre HUD, incluso si nace sobre botón; 8 px de umbral y clasificación irreversible durante el gesto. Pulsación activa una sola vez al soltar, incluso con un dedo secundario; los clicks de compatibilidad duplicados y los de arrastre/cancelación se bloquean en captura antes de acciones del HUD/hotbar. El clic de ratón, teclado y mando sigue intacto. La cámara mantiene el delta inicial al superar umbral.
- Excluye menús, piano, teléfono, controles de asomarse y RC; no cambia ratón, mando, sensibilidad, puzles o estética. No elimina gestos reservados del sistema iOS. Redimensionado menor no cancela ambos pulgares; cambio de orientación sí.
- Prueba Chromium multitouch real vía CDP + punteros sintéticos Chromium/WebKit, tap nativo, repetición arrastre/retorno, independencia de joystick y no activar agachar. Pendiente CI e iPhone físico.
- Corrige también el test landscape-gate de LP: abre manual si el inicio no lo muestra automáticamente.

## Resultado de CI y ajustes
- SHA 27dc950: mobile-input PASS, incluyendo `PASS touch HUD Chromium` (CDP + sintético) y `PASS touch HUD WebKit` (sintético y tap nativo). Compilación, 3D-production, RC, 2D y epílogo PASS. Emy WebKit falló en tap del mapa SVG, cosmos esperaba el cartel eliminado y checkpoint de cinta no se completó. Se conserva habitación inicial para un tap breve en mapa con fallback touchend; se actualiza aserción cosmos y añade diagnóstico de cinta sin cambiar su lógica. Nuevo SHA pendiente de pruebas; no se afirma iPhone físico ni se fusiona todavía.
