# Prueba integral de la experiencia de cumpleaños

## Flujo público que debe funcionar

Fecha real: 5 de diciembre de 2026, 00:00, America/Santiago.
Antes de esa hora la web muestra únicamente el contador público, con el acceso LP administrativo aparte.
A las 00:00 se muestra el botón «Abrir mi sorpresa»; es necesario pulsarlo para empezar. El flujo es: contador → regalo → portada con personajes → entrar → túnel direccional de estrellas → galaxia → corazón → juego 2D original en Phaser.
La galaxia PÚBLICA no debe mostrar ningún engranaje, barra inferior, encabezado ni controles de pruebas; el menú de pruebas solo aparece dentro del pequeño engranaje en la experiencia LP.

## Pruebas automáticas

En GitHub, PR → Checks → Verificar experiencia cósmica, el run debe quedar VERDE:
- npm test: juego original intacto.
- node tests/cosmos.cjs: zona horaria y datos.
- node tests/galaxy-arrival.cjs: descenso, espiral y corazón.
- node tests/tunnel-perspective.cjs: 28 líneas de perspectiva coherentes y reducción gradual de la apertura.
- npm run build: compilación en producción.
- node tests/cosmos-browser.cjs: LP en tamaño iPhone, transición continua, navegación, gestos y 2D.
- node tests/cosmos-public-flow.cjs: simula el reloj de Chile antes y después de medianoche, sin alterar la fecha real ni Firebase; prueba bloqueo, desbloqueo, intro, túnel, galaxia sin UI, corazón, menú y la escena 2D Phaser renderizando un canvas.

Las capturas quedan disponibles en Actions → ejecución → Artifacts → cosmos-visual-check.

## Prueba manual con el iPhone

1. Abre el enlace público en Safari. Desde el contador entra por ⚙ y el acceso LP, luego Pruebas.
2. Elige «Inicio del video» → «Entrar a nuestro universo».
3. Comprueba que el túnel NO sea una nube dispersa: deberían verse trayectorias fucsias hacia el mismo centro, girar y estrecharse antes del núcleo.
4. En toda la secuencia no debe haber paneles flotantes, barras laterales o botones inferiores.
5. En la galaxia, solo engranaje discreto arriba izquierda. Abre y cierra para repetir el túnel o regresar a Pruebas.
6. Haz zoom con los dos dedos; desde un computador, con la rueda del mouse.
7. Toca el corazón principal → «Comenzar juego 2D» → aparece «El jardín de los deseos» → pulsa «Comenzar aventura» para confirmar que el juego carga.
8. Antes de la fecha real el contador público debe seguir bloqueado. NO cambies la fecha configurada para probar: la prueba automática ya simula el día exacto.

## Antes de compartir el regalo

Confirma que el PR pasó las pruebas, que se incorporó a main y que el workflow Publicar Valeteamo en Firebase terminó con success. Comprueba el enlace desde Safari sin versiones antiguas de la app guardadas. Si la PWA instalada está desactualizada, cierra la app y abre el mismo enlace en Safari. Ninguna prueba en Chromium garantiza por completo el comportamiento del iPhone real, por lo que esta inspección manual es importante.

La configuración de la fecha pública, los archivos del juego 2D/3D y su avance no se modifican para estas pruebas.
