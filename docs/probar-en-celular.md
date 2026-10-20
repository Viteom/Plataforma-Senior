# Probar el hito 1 en el celular

## Opción A: misma red wifi (rápida, sin instalar nada)

Sirve para recorrer las pantallas. **No** permite instalar la app como PWA, porque el
service worker exige HTTPS.

1. En el computador, dentro de `plataforma-senior`:

   ```bash
   npm run build
   ```

   ```bash
   npx next start -H 0.0.0.0 -p 3000
   ```

2. Conecte el celular al **mismo wifi** que el computador.
3. En el celular, abra Chrome (Android) o Safari (iPhone) y vaya a la dirección del computador,
   por ejemplo `http://192.168.78.113:3000`. Si su IP cambió, búsquela con `ipconfig` (línea
   "Dirección IPv4").
4. Si no carga, Windows puede estar bloqueando el puerto: acepte el aviso del Firewall para
   "Node.js" en redes privadas, o permítalo en *Firewall de Windows → Permitir una aplicación*.

## Opción B: con HTTPS, para instalarla en la pantalla de inicio

Hace falta una dirección `https://`. Hay dos caminos:

- **Vercel (recomendado, es lo que pide el hito 1):** cree la cuenta, importe el repositorio y
  cada cambio queda publicado con HTTPS. Necesita subir el repositorio a GitHub primero.
- **Túnel temporal:** con el programa `cloudflared` de Cloudflare instalado y `npx next start`
  corriendo, ejecute el comando de abajo. Le da una dirección `https://….trycloudflare.com` que
  sirve mientras el comando esté abierto.

  ```bash
  cloudflared tunnel --url http://localhost:3000
  ```

### Añadir a la pantalla de inicio

- **Android (Chrome):** menú ⋮ → *Instalar aplicación* (o *Añadir a pantalla de inicio*).
  Debe abrir sin barra del navegador y con el ícono "PS".
- **iPhone (Safari):** botón Compartir → *Añadir a pantalla de inicio*.

## Qué revisar

- [ ] La portada se lee sin hacer zoom; los botones se tocan sin errores.
- [ ] El botón **Ayuda** está arriba a la derecha en todas las pantallas.
- [ ] Desde la portada, la sección "Demostración del hito 1" lleva a cada área.
- [ ] Crear perfil: los 3 pasos avanzan; "Ninguna de las dos" muestra el mensaje y bloquea seguir.
- [ ] La barra inferior del talento marca la pantalla actual.
- [ ] Con la letra del celular en tamaño grande, nada se corta ni se sale de la pantalla.
- [ ] (Opción B) La app instalada abre sin barra del navegador; en modo avión muestra "No hay
      conexión a internet".
