# VALETEAMO · experiencia cósmica de cumpleaños

## Dónde está
En el repositorio ORIGINAL, no en el satélite vacío. El código visual reside en src/experience/ y NO importa Phaser, house.js ni el estado de los tres juegos.

## Cómo abrir la vista previa ANTES del 5 de diciembre
1. En la pantalla del contador, tocar ⚙ e introducir LP.
2. Pasar la portada, abrir **Pruebas**.
3. Elegir: **Contador y colores**, **Regalo animado**, o **Galaxia y constelaciones**.
4. En la barra inferior de prueba cambiar entre escenas, elegir paleta y calidad.
5. El contador conserva fecha real incluso en modo LP; el botón **Simular desbloqueo** prueba la transición sin alterar la fecha.

## Flujo público
- Antes de las 00:00 del 5 de diciembre de 2026 en Santiago: contador bloqueado; LP permite probar el juego, como antes.
- Después: botón Abrir mi sorpresa -> caja que se transforma -> galaxia -> recuerdos -> cartas -> misterio -> final -> juego original.
- No se toca la historia, las partidas guardadas, la casa ni los sprites 2D.

## Personalización
- Fecha y zona horaria de Santiago: src/experience/cosmos-config.ts.
- Paletas: PALETTES (rosado / aurora / medianoche); los colores no están fijados como referencia final.
- Recuerdos: arreglo MEMORIES, con seis constelaciones. x/y/z son sus posiciones en el espacio visual.
- Fotografías: campo image acepta ruta a un recurso en public/. Vacío muestra un placeholder pixelado ilustrado.
- Retratos: pixelPortrait queda reservado para futuros sprites sin modificar los modos existentes.
- Cartas: campo letter. No hay textos personales definitivos.
- Sonido: sintetizador ambiental ORIGINAL generado con Web Audio tras pulsar ♫ ON; no incluye canciones de terceros. La música aportada se integrará cuando esté disponible.

## Implementación visual
React 19 + TypeScript + Vite existentes. Galaxia renderizada en Canvas 2D con estrellas en coordenadas 3D proyectadas con perspectiva, nebulosas, anillos, constelaciones y drag/zoom. No se añadió Three.js ni un segundo motor para evitar problemas con package-lock y el WebGL1 existente. Se puede reemplazar el renderizador por Three.js en este mismo módulo sin alterar el contrato de escenas.

## iPhone y orientación
- Diseño vertical prioritario para la parte visual; se adapta a horizontal y escritorio.
- El juego conserva su rotación horizontal; NO cambiamos sus controles.
- Safari > Compartir > Añadir a pantalla de inicio > Abrir como app web si aparece. El manifest ya ofrece display: standalone.

## Próxima integración
src/experience/game-bridge.ts define el contrato de eventos OPEN_GAME, RETURN_TO_MEMORIES y SAVE_EXPERIENCE_PROGRESS. Actualmente el adaptador reenvía OPEN_GAME a la aplicación que ya existía, sin duplicar el juego.

## Verificación
npm test, npm run build y node tests/cosmos.cjs. Los tests del resto del juego siguen en el mismo lugar. No afirmes que una prueba se completó si su ejecución no se pudo verificar.

## Material visual pendiente
Los dos videos originales de referencia, la foto exacta y una paleta definitiva no están en este repositorio. Esta versión usa una interpretación editable rosa/violeta/azul y arte generado por código, no una reproducción exacta de esas referencias.
