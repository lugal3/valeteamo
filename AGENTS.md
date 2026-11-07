# Instrucciones de trabajo — VALETEAMO (para Codex y asistentes)
Lee **[docs/CONTEXTO-CODEX-VALETEAMO.md](docs/CONTEXTO-CODEX-VALETEAMO.md)** al comenzar; es el mapa maestro de las experiencias y los documentos existentes.

## Restricción principal del propietario
**NO TOCAR EL 2D** hasta recibir instrucciones expresas. Incluye historia de cumpleaños Phaser-isométrica, juego clásico de seis salas, prólogo del rescate, sprites/arte, controles, música, CSS, progreso, guardados y rutas relacionadas. No eliminar, migrar, consolidar, simplificar ni sustituir esos modos por el 3D; no borrar archivos de `src/` ni `public/` en tareas documentales.

## Aislamiento de tareas
La casa 3D está en `src/lab/`; el prólogo 2D en `src/demo/RescueDemo.tsx`; la orquestación compartida en `src/StoryApp.tsx`; el clásico y la historia están documentados en el contexto. **Cualquier cambio a archivos compartidos exige análisis de impacto y permiso**. «Pruebas» son checkpoints, no múltiples juegos.

## Flujo
Para una tarea nueva: identificar módulo → leer fuentes y tests relevantes → proponer cambios → rama separada → ejecutar `npm test`, `npm run build` y pruebas de navegador adecuadas → informar. No fusionar a `main` ni desplegar Firebase si no se pide. No cambiar claves localStorage ni ejecutar `npm run sprites` sobre plantillas editadas. No subir secretos, servicio Firebase JSON ni fotos privadas.
