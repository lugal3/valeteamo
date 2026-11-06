# Kitty · El jardín de los deseos

Prototipo local de cumpleaños · 4 de diciembre de 2026. React + TypeScript + Vite + Phaser. Inspiración libre de juegos de salas; no es una reproducción exacta de Isaac. Ilustraciones pixeladas y audio originales generados por código. No requiere servicios, cuentas ni assets remotos. Solo juego: no incluye álbum, preguntas ni correo.

## Ejecutar en Windows
Instala Node.js 20.19+ (o 22.12+), abre una terminal en esta carpeta y ejecuta:

```powershell
npm install
npm run dev
```

Abre la dirección Local que imprime Vite (normalmente http://localhost:5173).

### Desde iPhone por la misma Wi-Fi
1. Mantén el servidor encendido en el PC.
2. Ejecuta `ipconfig` y busca la dirección IPv4 del adaptador Wi-Fi, por ejemplo `192.168.1.35`.
3. En Safari del iPhone abre `http://192.168.1.35:5173` (sustituye la IP). **localhost en el iPhone es el propio teléfono**, no tu PC.
4. Si Windows pregunta por acceso de Node a la red, permite redes privadas. Evita Wi-Fi de invitados que aísla dispositivos. No requiere túneles ni publicación.
5. Pulsa Jugar y gira a horizontal. Puedes ocultar las barras con Añadir a pantalla de inicio; fullscreen es opcional y Safari puede no admitirlo.

```powershell
npm run build
npm run preview
```
Preview normalmente usa el puerto 4173. `dev` y `preview` ya escuchan en `0.0.0.0`.

## Controles
- Táctil: toca y arrastra en la mitad izquierda para moverte; en la derecha para apuntar/disparar libremente. Dos dedos independientes, círculos invisibles hasta tocar. Desplaza el dedo unos píxeles para dar dirección.
- Botones inferiores: bomba y activo. Botones superiores: pausa y música/sonido.
- PC: WASD mueve; ratón pulsado apunta/dispara o flechas disparan; B bomba, Espacio activo, Esc pausa.
- Se pausa al cambiar de aplicación/perder foco o girar a vertical. Al volver, pulsa Continuar. Soltar, cancelar un toque, pausar o cambiar de sala limpia las entradas.

## Recorrido y economía
Exactamente seis salas fijas en una sola ruta lineal en zigzag, sin bifurcaciones:

```
Inicio    → Combate 1
                 ↓
Combate 2 ← Tesoro
  ↓
Tienda    → Jefe
```

Las puertas de combate quedan bloqueadas hasta limpiar la sala. Se puede volver por el mapa. Recompensa y recarga solo una vez por sala. Empiezas con 12 monedas, 1 llave y **5 bombas**: las dos ofertas cuestan 5 y 7 monedas, así que ambos objetos son accesibles desde el principio. El tesoro usa una llave una sola vez. Enemigos dejan monedas; salas de combate añaden llave y curación. Recoge recompensas antes de salir (los pickups no recogidos desaparecen al cambiar de sala).

- Tesoro: **Brimstone**, mantener dirección carga 0,85 s y lanza rayo que atraviesa enemigos. Se repite mientras mantienes disparo.
- Tienda: **Kitty Cat’s head**, interpretación del nombre pedido inspirada en Guppy’s Head. Reemplaza el activo por cuatro proyectiles aliados perseguidores. No vuelve a la pila en esta partida.
- Tienda: **Holy Mantle**, bloquea un golpe por entrada a sala; combina con rayo y cabeza.
- Activo inicial: pila temática de caca. Permanece en la sala, bloquea el avance enemigo y absorbe sus balas. No es un escudo personal. Una sala de combate limpia recarga el activo.
- Bombas de lazo: 1,5 s, radio generoso y daño alto (22). Sin daño propio.
- Tres corazones = seis impactos iniciales. Rojo/alma/oscuro son una representación visual simplificada; no aplican reglas separadas ni explosión de corazón oscuro. Curar recupera dos impactos, hasta seis.
- Kuromi traviesa persigue y dispara dirigido; Cinnamoroll flota en ondas y lanza abanicos. El destello rosa anticipa el disparo.
- Mega Kuromi alterna anillos de balas y tres círculos de eclipse que explotan tras 0,95 s. La barra inferior muestra su vida. Al derrotarla **camina hasta la escotilla dorada central** para completar; derrotarla no termina automáticamente.

La ruta está pensada para aproximadamente 3–5 minutos, según exploración y puntería; no hay límite de tiempo. Muerte y final permiten reiniciar todo.

## Editar y extender
- `src/config.ts`: estadísticas, economía, invulnerabilidad, nombres, mapa y textos de objetos. Velocidad/daño/alcance/cadencia se usan en el juego.
- `src/game.ts`: escena y sistemas de combate, colisiones, puertas, pickups y controles. `src/art.ts` contiene matrices de píxeles de las texturas; cambia colores/letras o reemplaza el registro por sprites locales. `spawn()` ajusta vida de enemigos/jefe; `update()` contiene patrones y tiempos.
- `src/audio.ts`: secuencia musical de ocho notas y síntesis de efectos; sin archivos de audio externos. El botón ♪ silencia todo. Si Web Audio no está disponible el juego continúa.
- `src/main.tsx`: interfaz React, bienvenida, pausa, giro y final.
- `src/style.css`: paleta, tamaños, safe areas y altura dinámica.

El canvas lógico es 960×540 y se escala proporcionalmente; pueden quedar márgenes para preservar el encuadre en teléfonos muy anchos. Los botones respetan safe areas. El audio requiere el gesto Jugar. Prototipo de uso personal, con personajes de Sanrio como referencia temática; no afiliado a Sanrio.

## Pruebas y partida estable

`npm test` ejecuta las pruebas de integración lógica. Para evitar reinicios mientras se editan archivos usa `npm run build` y `npm run preview`. El servidor de desarrollo de Vite recarga al cambiar código; cambiar de aplicación solo pausa. No hay persistencia al recargar la página.

## Validación
Consulta `VALIDACION.md` para los resultados concretos de esta entrega. No se ha probado en iPhone físico; comprobar Safari en ambos teléfonos es el siguiente paso recomendado.


