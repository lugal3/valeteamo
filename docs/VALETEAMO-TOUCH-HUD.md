# V3.8 — corrección de cámara multitáctil

- Joystick independiente; arrastre de cámara sobre HUD, incluso si nace sobre botón; 8 px de umbral y clasificación irreversible durante el gesto. Pulsación activa una sola vez al soltar, incluso con un dedo secundario; los clicks de compatibilidad duplicados y los de arrastre/cancelación se bloquean en captura antes de acciones del HUD/hotbar. El clic de ratón, teclado y mando sigue intacto. La cámara mantiene el delta inicial al superar umbral.
- Excluye menús, piano, teléfono, controles de asomarse y RC; no cambia ratón, mando, sensibilidad, puzles o estética. No elimina gestos reservados del sistema iOS. Redimensionado menor no cancela ambos pulgares; cambio de orientación sí.
- Prueba Chromium multitouch real vía CDP + punteros sintéticos Chromium/WebKit, tap nativo, repetición arrastre/retorno, independencia de joystick y no activar agachar. Pendiente CI e iPhone físico.
- Corrige también el test landscape-gate de LP: abre manual si el inicio no lo muestra automáticamente.
