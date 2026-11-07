# Probar la aventura en iPhone

1. Conecta el PC y el iPhone a la misma Wi-Fi y mantén el PC encendido.
2. En la carpeta del proyecto ejecuta `npm ci`, `npm run build` y `npm run preview -- --port 5173 --strictPort`.
3. En el PC usa `ipconfig` para buscar la dirección IPv4 de la red Wi-Fi. En Safari del teléfono abre `http://IP-DEL-PC:5173/`. La IP puede cambiar; `localhost` en el teléfono apunta al teléfono, no al PC.
4. La historia y las fotos están preparadas para vertical. Al iniciar un desafío gira a horizontal; al volver a él pulsa Continuar si aparece la pausa. Izquierda mueve y derecha apunta/dispara.
5. Opcional: Safari → Compartir → Añadir a pantalla de inicio, si quieres abrirlo como app web. No es obligatorio y no garantiza uso sin conexión. Safari puede seguir mostrando sus barras en la pestaña normal.

Si llega un enlace por WhatsApp u otra app y el navegador interno da problemas, utiliza su opción para abrir en Safari. Firewall, aislamiento de la red Wi-Fi o un PC suspendido pueden impedir la conexión. No se ha comprobado esta versión en un iPhone físico.
