# Auditoría de defectos — ValeTeAmo V2

**Fecha:** 2026-11-24  
**Rama:** `feature/valeteamo-v2-game-feel-integral`  
**PR:** https://github.com/lugal3/valeteamo/pull/39

## Criterio de seguridad

**No fusionar ni desplegar** con fallos de navegador sin investigar. Los resultados de pruebas antiguas no certifican cambios nuevos. Ningún arreglo de pruebas puede sustituir comprobar que el jugador obtiene objetos mediante los puzles normales.

## Incidencias confirmadas en GitHub Actions

| Prioridad | Síntoma | Evidencia | Diagnóstico | Acción |
|---|---|---|---|---|
| Alta | Con ratón capturado, un clic para leer una nota no la abre | Auditoría integral #45444787141, `mobile-input` | La superficie invisible `.lab-look` cubre el canvas en escritorio; la acción de mundo solo aceptaba `e.target===canvas`. Los teletransportes del harness tampoco sincronizaban `lookTarget` | **Código corregido**: aceptar clic de mundo en `canvas` o `.lab-look` bajo pointer lock; sincronizar cámara del harness para test reproducible. Pendiente repetir browser |
| Alta, por verificar | La prueba del rescate no llega a la llave roja del piano | Auditoría integral #45444787141, `rc-rescue` | El harness pretendía recoger una llave desde una partida que ya indicaba `pianoSolved:true` sin haberla guardado en `picked`. El premio ya no es una recogida libre en la cocina | **Fixture corregida**: inicia el escenario RC con la llave previamente obtenida y guardada; la adquisición mediante piano sigue comprobándose por separado en `house-checkpoint-browser`. Pendiente repetir navegador |
| Alta, por verificar | El test de checkpoints falla al abrir el cajón del descansillo | Auditoría integral #45444787141, `3d-checkpoints` | El cajón está vacío; la linterna es un objeto colocado **encima** del mueble. No debe ser requisito del progreso | **Test corregido** para interactuar directamente con la linterna. **Nuevo control físico:** ejecutar `house-space-audit.cjs` en el gate de release, para detectar objetivos realmente inaccesibles |
| Baja | La escena «Casa 3D» no se encuentra en pruebas de producción | Auditoría integral #45444787141, `3d-production` | La tarjeta real se llama «Casa 3D · 0% · Entrada» y el test buscaba nombre exacto «Casa 3D» | **Test corregido** con selector de nombre visible real |
| Media | El test de emotes no puede abrir ajustes desde un ratón capturado | Cosmos #45444787210, `emotes-browser` | La barra de ajustes se oculta intencionalmente durante pointer lock, pero el test intentaba usarla sin soltar el cursor | **Test corregido**: Escape y comprobar liberación antes de abrir ajustes |
| Media | En Chromium escritorio software, el movimiento de Kitty no alcanza distancia esperada en 320 ms | Auditoría integral #45444787141, `emy-desktop` | Un fotograma WebGL1 puede tardar más que el timeout de espera fijo | **Test corregido**: verificar avance simulado con timeout y soltar la tecla siempre en `finally` |

La auditoría previa **sí aprobó** `npm test`, `npm run test:perf`, `npm run build`, prólogo 2D, persecución y escondites, Emy móvil y WebKit. No se infiere que todos los escenarios hayan pasado en la última versión.

## Riesgos de flujo que requieren supervisión

1. **Acceso real a objetos/puzles:** el nuevo `house-space-audit.cjs` verifica conectividad de habitaciones y que los elementos interactivos se puedan alcanzar; esta comprobación es indispensable para descartar bloqueos por colisiones. Se deben inspeccionar los errores, si aparecen, antes de cambiar geometría.
2. **Rescate de Louis:** validar la obtención legítima de la llave roja en el compartimento del piano, la trampilla, la liberación y el paso a la cocina sin teletransportaciones. No cambiar `puzzleEvent` ni el estado de `canRescue` para sortear tests.
3. **Emy y armario:** se mantiene la regresión de escondite independiente en `npm test`; la validación visual todavía requiere partida completa en móvil.
4. **Rendimiento WebGL1:** no convertir decoración estática a dinámica sin medir el presupuesto de vértices. El test de compilación y rendimiento no garantiza FPS estables en todos los teléfonos.
5. **Persistencia y final:** revisar guardados durante cinemáticas y tras cerrar el juego, cambios entre pisos, trayectorias del RC y final normal; no suponer que un test fixture equivale a jugar sin atajos.
6. **Audio y accesibilidad:** activar sonido en iPhone real, revisar subtítulos, foco, accesibilidad y zonas seguras en pantalla horizontal. Un navegador simulado no sustituye el dispositivo físico.

## Verificaciones finales y autorización

El flujo `.github/workflows/valeteamo-v2-release-qa.yml` ejecuta tests unitarios y de rendimiento, accesibilidad de toda la casa y escenarios de navegador. **Los arreglos anteriores se consideran implementados, NO validados**, hasta que los jobs correspondientes estén verdes en el commit que realmente los contiene.

No se ha realizado merge a `main` ni despliegue en Firebase. Antes de aprobar publicación: CI totalmente verde, revisión manual de usuario, fotos/audios autorizados y comprobación en iPhone y PC.
