# Muebles, tele y perseguidor de la casa 3D

La revisión usa las paredes, vanos, ventanas, posiciones de escondite y rutas existentes como referencia. El recorrido del estudio al dormitorio y la llegada por la ventana se comprueban en la auditoría de circulación con un cuerpo de 64 cm de ancho.

| Zona | Distribución e interacción |
| --- | --- |
| Recibidor y pasillo | Consola junto al muro con la nota inicial. Alfombra centrada y ruta despejada hacia la escalera. |
| Sala de estar | Sofá junto al muro oeste, mesa de centro más estrecha y tele frente al sofá. La llegada por la ventana conserva espacio de aterrizaje. Se pueden inspeccionar la taza y el sofá, abrir el cajón de los mandos y recoger su pila. |
| Estudio | Silla alineada con el escritorio y librero y planta contra sus muros. La llave sigue en el cajón original y el librero se puede inspeccionar. |
| Cocina | Refrigerador, horno y encimera ordenados en una misma pared. El refrigerador tiene puerta con bisagra, estantes y una lista interior. Un cajón guarda una nota. La mesa queda entre las sillas y la trampilla conserva su acceso. |
| Baño | Lavamanos pegado al muro, toalla colgada y paso libre hacia el espejo. El gabinete tiene bandeja deslizante y contiene una pila y una nota. La llave del agua abre y cierra el chorro. |
| Dormitorio | Cabecera más próxima al muro y peluche del velador inspeccionable. Se conservan las rutas de entrada y salida del armario y de debajo de la cama. |
| Sala de lectura y descansillo | Asiento, mesa y librero agrupados. Cajón registrable con pila. El banco se apoya contra el muro del fondo. |
| Sala de música | Tocadiscos y guitarra inspeccionables. En el altar de Louis hay un retrato ilustrado, hilos, velas, un vinilo y un dossier que identifica al presidente Friedrich Weiss. |

Los materiales de madera, tapicería, vidrio y metal se generan en el atlas del motor. Las ampolletas tienen vidrio esmerilado, casquillo, rosca y pantalla con borde metálico. Conservan los circuitos y las sombras de cada habitación.

La tele abre un primer plano del aparato al pulsar E o **Encender tele**. Usa el reproductor oficial con el segmento 0–15 s de [Raccoon eats grapes with his little hands](https://www.youtube.com/watch?v=jyCmnvBbm8Q). Al terminar vuelve al inicio. El botón de apagar cierra el reproductor. Cuando el navegador bloquea el inicio automático, se puede pulsar ▶ dentro de la tele. El video se carga desde YouTube al encender el aparato.

El presidente tiene traje, corbata, insignia, pelo blanco y ojos azules. Su marcha usa la distancia recorrida para alternar los apoyos, flexionar rodillas y codos y girar el cuerpo de forma progresiva. Durante la persecución se inclina hacia delante y acentúa el braceo. La búsqueda, las colisiones y la detección siguen a cargo de `pursuer.js`.

Para validar el cambio, ejecutar `npm test`, `npm run build`, `node tests/house-furniture-browser.cjs` y `node tests/pursuer-browser.cjs`. La prueba de muebles verifica el bucle mediante la API del reproductor y comprueba en pantalla táctil emulada los cajones, la puerta del refrigerador y el altar.
