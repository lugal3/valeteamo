# Probar ahora en iPhone

Versión 1.1: sala compacta, animaciones e impactos. Se conserva el recorrido de seis salas.

1. Conecta el iPhone a la misma Wi-Fi del PC.
2. Mantén el PC encendido. La entrega deja un servidor **estable** en segundo plano.
3. Abre en Safari: **http://192.168.1.15:5173/** (dirección del PC comprobada al preparar esta entrega).
4. Pulsa Entrar al jardín y gira a horizontal.
5. Arrastra a la izquierda para moverte y a la derecha para apuntar/disparar. Botones pequeños de bomba y activo abajo a la derecha.

Si ya tenías abierta la versión anterior, recarga una vez para cargar la nueva. Después, cambiar de app solo pausa; pulsa Continuar al regresar. No hay guardado al recargar.

Opcional para aprovechar más espacio: Safari → Compartir → Añadir a pantalla de inicio → «Abrir como app web», si aparece. Abre el icono creado. No es obligatorio y no ofrece juego offline. Las barras de Safari normal no se pueden quitar a la fuerza desde el juego.

Si la IP cambia al reconectar Wi-Fi, consulta `ipconfig` en el PC y usa su nueva IPv4; no se ha cambiado la configuración de red. No hay túnel ni publicación web.

## Volver a arrancarlo tras apagar el PC

En la carpeta del proyecto:

```powershell
npm install
npm run build
npm run preview -- --port 5173 --strictPort
```

Si el puerto ya está ocupado por el servidor de esta entrega, no abras otro. Para desarrollar usa `npm run dev`; la recarga de Vite puede reiniciar partidas al editar fuentes.

La revisión visual de esta mejora quedó parcial para evitar interferir con League of Legends. No se afirma que se haya probado en Safari de iPhone físico.
