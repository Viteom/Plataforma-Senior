# Hito 2: acceso y roles

Rama `hito-2-acceso`. Criterios de listo del brief:

- [ ] Una persona entra sola en menos de 2 minutos. **Falta probarlo:** necesita las cuentas.
- [x] Una empresa no puede leer datos de talento: probado con 33 pruebas contra las migraciones
      reales (`tests/db/acceso.test.ts`).

## Qué quedó hecho

**Base de datos** (`supabase/migrations/20261021000001_acceso.sql`)

- Rol inicial al registrarse: `talento`, o `empresa` si entra por `/entrar?para=empresa`. Nadie
  puede pedirse un rol del equipo; curador, gestor y admin los asigna un admin.
- Reglas por fila en todas las tablas:
  - El talento ve y edita solo lo suyo.
  - El gestor ve lo que registró mientras la persona no tenga cuenta.
  - Curador y admin ven todo.
  - Las empresas no leen ninguna tabla de talento.
- `talent_private` (fecha de nacimiento, autorización, pensión) no tiene ningún camino de lectura
  directa, ni siquiera para el equipo:
  - Se guarda con `guardar_datos_privados()`.
  - El equipo la lee con `ver_datos_privados(perfil, motivo)`, que exige un motivo y lo registra
    en `private_access_log`. Así se cumple "Registro de quién del equipo ve datos privados".
- `company_talent_view` para empresas:
  - Solo perfiles publicados y solo etiquetas confirmadas.
  - Sin tarifa exacta ni ningún dato privado.
  - Nombre, foto y resumen solo si la persona eligió "visible".
- Verificación de empresas (regla 9): las columnas `verificada_*` solo las cambia el equipo; un
  trigger lo impide a la propia empresa.
- Límite de 5 códigos por hora por número o correo, guardando un hash y no el dato.

**Aplicación**

- `middleware.ts`: refresca la sesión y manda a cada rol a su área (`lib/auth/rutas.ts`). Ayuda
  queda abierta para todos.
- `/entrar` y `/entrar/codigo` conectados a Supabase Auth:
  - Celular normalizado a +57 y correo validado.
  - Mensajes de error claros, que no borran lo que la persona escribió.
  - Muestra a dónde se envió el código: "300 *** 4567".
  - Reenvío a los 45 segundos.
  - Primera vez va a `/perfil/nuevo`; si ya tiene perfil, a `/inicio`.
- Botón "Salir" en Mi perfil, en la barra de empresa y en la de equipo.
- `supabase/config.toml`:
  - Reenvío cada 45 s y código de 10 minutos.
  - Sesión de 90 días y SMS en español.
  - Bloque de Twilio Verify, listo para activar.
- **Modo demostración:** sin las variables de Supabase, la app funciona como en el hito 1, sin
  inicio de sesión. Es lo que corre hoy en Vercel.

**Privacidad encontrada al probar:** antes, un formulario enviado antes de que cargara la página
podía dejar el celular en la URL. Ahora todos se envían por POST, y una prueba
(`tests/unit/formularios.test.ts`) falla si un formulario nuevo lo olvida.

## Lo que falta y necesita cuentas

1. **Supabase en la nube** (región São Paulo): crear el proyecto y aplicar las migraciones.

   ```bash
   npx supabase link --project-ref <ref-del-proyecto>
   ```

   ```bash
   npx supabase db push
   ```

2. **Twilio Verify** para SMS: en Supabase, *Authentication → Providers → Phone* → Twilio Verify,
   con Account SID, el SID del servicio de Verify y el token.
   - En Twilio, nombre el servicio "Plataforma Senior" para que el SMS diga de dónde viene.
   - Verify usa su propia plantilla de mensaje, así que el texto exacto del brief ("[MARCA]: tu
     código es…") depende de lo que permita Twilio.
3. **Resend** con dominio verificado como SMTP de Supabase (*Authentication → Emails → SMTP*), y
   la plantilla del correo con el código en español.
4. **Variables en Vercel y en `.env.local`** (ver `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - `OTP_PEPPER`: un texto largo al azar, solo en el servidor.
   - Al ponerlas, la app sale del modo demostración.
5. **Crear el primer admin**, una vez, desde el editor SQL de Supabase, después de que esa persona
   entre por primera vez:

   ```sql
   update user_roles set rol = 'admin'
   where user_id = (select id from auth.users where email = 'correo@dominio.co');
   ```

   Después el admin asigna curador y gestor de la misma forma (pantalla propia en un hito
   posterior).

## Para el hito 3

- La pantalla de perfil debe guardar en `talent_profiles` y llamar a `guardar_datos_privados()`
  con la versión de la autorización de datos (texto legal pendiente con el abogado).
- Las pantallas de empresa todavía usan `lib/demo.ts`; pasan a `company_talent_view` en el hito 4.
