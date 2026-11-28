# V4.0 — Diseño sonoro y masterización

Base V3.9 c5db135; rama independiente de hotfix #54. No merge sin validación.

## Primera implementación
- Medición PCM real por clip corto, 40 ms RMS activo p75, pico, duración. Ganancia individual acotada 0.25–4 salvo reducción adicional por pico. Música, piano, emotes, motor y ambiente conservan dinámica original. Cues quietos target -25 dBFS activo, efectos -19, alertas -15; objetivos iniciales, no medición física de SPL ni LUFS.
- Ganancia maestra base .45→.72, efectos .68→.85, perfiles equilibrado/cinematográfico/claridad. Distancia y oclusión se preservan, menos atenuación en claridad. No altera la IA. Preferencias antiguas personalizadas y mute migran; valores que coinciden con el antiguo default de efectos/puertas reciben los nuevos defaults.
- Menú Audio: maestro 0–3×, amplificación 0–4× independiente, efectos/música/ambiente 0–2×, categorías 0–3×, lectura de dB de ganancia, medidor post-compresión de pico y RMS de bloque (no LUFS), reset, vista de alerta/susto, copia de mezcla y mediciones.
- Compresor y curva de seguridad a la salida; no garantiza seguridad auditiva. Música externa no se controla desde el navegador.
- Auditoría CI FFmpeg: todos los assets de audio bajo src/public y cues de ambos sprites con lead-in respetado; LUFS integrado, true peak, PCM RMS y ganancia recomendada. Pendiente cifras reales y comparativa de salida renderizada, escucha y ajuste final, laboratorio completo A/B.

## Comparación con música de referencia
- Auditoría anterior: 60 entradas, luz −29.38 LUFS, puerta −23.24, madera −21.45, alerta sprite Ogg −19.88, tensión −17.40. Son niveles originales, no salida del juego.
- Alta claridad: mayor presencia espacial (×1.65), EQ 105 Hz y presencia 1.8 kHz +3 dB, compresión de foley 4:1 con recuperación y ganancia 3.2×, ambiente/música reducidos. Alertas compensadas para que el incremento global del perfil no las amplifique innecesariamente. Valores iniciales pendientes de medición.
- CI renderiza el HouseSound real en Chromium OfflineAudioContext, baseline c5db135 y perfiles equilibrado/claridad, usando assets decodificados y aislando los eventos de fondo. Mide picos, RMS, LUFS, dBTP y contraste en 300–4000 Hz frente a la pista instrumental de tensión normalizada a −14/−11 LUFS. El informe falla si los objetivos iniciales de contraste a −14 no se alcanzan (puerta tras muro exenta). No afirma equivalencia con Spotify, altavoz físico ni seguridad auditiva. Pendiente pruebas de escucha y ajustes según resultados.
