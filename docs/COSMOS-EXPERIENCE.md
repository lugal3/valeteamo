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


## Referencia audiovisual de 23,1 segundos (14 noviembre 2026)
La referencia es un clip vertical de TikTok con un ejemplo visual en su mitad superior; el código y los elementos externos de TikTok **no son parte de la web**.
- 1,5–2,4 s: panel granate/negro con título «Una Galaxia de Amor para Ti», dos mascotas blancas, subtítulo y botón rosa alargado.
- 2,5–4,6 s: el panel se apaga y las partículas fucsias se concentran en un torbellino, desde puntos dispersos hacia el núcleo.
- 4,6–6,4 s: aparece la galaxia plana en espiral, núcleo rosa vibrante y un corazón vertical de miles de puntos luminosos.
- 6,4–10,5 s: movimiento orbital suave con etiquetas rosas como «MI AMOR ETERNO», «HAPPY BIRTHDAY», corazones y mascotas pequeñas.
- 10,5–18,0 s: al tocar una constelación, aparece una tarjeta compacta granate con ilustración, título en serif, descripción y opción para volver.
Esta implementación usa partículas renderizadas en Canvas 2D y dos mascotas SVG **originales** para permitir cambiar después a imágenes personalizadas. NO reutiliza fotogramas, música o recursos de TikTok.

### Pruebas directas desde LP
En Pruebas se ofrecen cinco entradas: contador, regalo, inicio con personajes, formación de partículas y galaxia lista.
Las fechas, guardados del juego, casa WebGL1 y modos Phaser siguen intactos. El video original muestra una escena ajena: no se puede prometer identidad cuadro a cuadro sin su código y assets originales. Las transiciones/colores/estructura se reproducen desde cero.
