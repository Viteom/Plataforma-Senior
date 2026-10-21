# Conectar Supabase (sin servicios de pago)

Proyecto: `grmafhdgtgjyryopykdp`, en `https://grmafhdgtgjyryopykdp.supabase.co`.

Con Supabase conectado, la app sale del modo demostración. Pide entrar con código y guarda los
datos de verdad.

## Lo que cambia sin servicios de pago

- **Entrar con correo: sí.** Supabase envía el correo con el código con su servicio incluido.
  Sirve para probar, con dos límites: pocos correos por hora y solo a los correos de los miembros
  de la organización en Supabase. Para el piloto hará falta un servidor de correo propio. Resend,
  por ejemplo, tiene un plan gratuito pero pide un dominio verificado.
- **Entrar con celular: no.** El SMS necesita Twilio, que es de pago. Mientras tanto, la opción
  «celular» de `/entrar` muestra el error de siempre y la persona puede usar correo.
- **«Llámeme», chat, registro del gestor, Aprende y Emprende** funcionan sin nada más.

## 1. Llaves en `.env.local`

Ya están la dirección del proyecto y `OTP_PEPPER`, una clave interna generada al azar. Falta
pegar las dos llaves que están en *Project Settings → API Keys*:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: la **Publishable key** (`sb_publishable_…`).
- `SUPABASE_SERVICE_ROLE_KEY`: la **Secret key** (`sb_secret_…`). Va solo en el servidor y nunca
  se escribe en el chat.

## 2. Ajustes de Auth en el panel de Supabase

**Authentication → Sign In / Providers → Email**

- Email: activado. «Allow new users to sign up»: activado.
- Email OTP Expiration: `600` segundos.
- Email OTP Length: `6`.

**Authentication → URL Configuration**

- Site URL: `https://plataforma-senior.vercel.app`.
- Redirect URLs: agregar `http://localhost:3000/**`.

**Correo propio con Resend (obligatorio para editar las plantillas).** Con el correo incluido,
Supabase bloquea las plantillas y solo manda un enlace, que la app no usa.

1. En resend.com: *Domains → Add Domain* con `vasees.co`, región São Paulo.
2. En el DNS del dominio, agregar los registros que muestra Resend:
   - MX y TXT (SPF) en `send.vasees.co`.
   - TXT (DKIM) en `resend._domainkey.vasees.co`.
   - Son subdominios, así que no tocan el correo actual del dominio.
3. *Verify DNS Records* hasta que el dominio diga «Verified».
4. *API Keys → Create API Key*, con permiso «Sending access» y solo para ese dominio.
5. En Supabase, *Authentication → Emails → SMTP Settings*:
   - Host `smtp.resend.com`, puerto `465`, usuario `resend`.
   - Contraseña: la llave de Resend.
   - Remitente `codigos@vasees.co`, nombre «Plataforma Senior».
6. En *Authentication → Rate Limits*, revisar el tope de correos por hora.

**Authentication → Emails → Templates.** Cambiar dos plantillas, **Confirm signup** y **Magic
Link**, para que manden el código en vez de un enlace:

- Asunto: `Su código para entrar a Plataforma Senior`
- Cuerpo: todo el contenido de `supabase/templates/codigo.html`, pegado en la pestaña
  *Source*.
  - Es la misma plantilla que usa Supabase local (`config.toml`).
  - Al comienzo del archivo dice qué cambiar cuando llegue la marca: nombre, colores y logo.
- En *Sign In / Providers → Email*, «Email OTP Length» debe ser `6`. En proyectos nuevos viene
  en 8.

## 3. Migraciones

**Aplicadas el 21 oct 2026** desde el SQL Editor, en dos partes, porque Postgres no deja usar un
valor nuevo de un enum en la misma ejecución que lo crea. Quedaron anotadas en
`supabase_migrations.schema_migrations`, así que `supabase db push` solo aplicará las nuevas.

Para las próximas hay dos maneras:

- **Con el MCP de Supabase.** Ya está en `Proyectos-Claude/.mcp.json`; Claude aplica las 7
  migraciones de `supabase/migrations/` en orden y revisa el resultado.
- **Con la CLI**, que pide la contraseña de la base en la terminal:

  ```bash
  npx supabase login
  ```

  ```bash
  npx supabase link --project-ref grmafhdgtgjyryopykdp
  ```

  ```bash
  npx supabase db push
  ```

## Avisos de seguridad de Supabase (revisados el 21 oct 2026)

**Corregido.** Las funciones de trigger se podían llamar por `/rest/v1/rpc`. La migración
`20261025000001` les quita el permiso y `tests/db/funciones.test.ts` lo vigila.

**Quedan a propósito:**

- **Security Definer View (4 vistas `company_*` y `talent_opportunities_view`).**
  - Es el diseño de la regla 3: la empresa ve talento solo por estas vistas, sin permiso sobre
    las tablas.
  - Cada vista filtra por quien consulta (`mi_empresa()`, `es_mi_perfil()`).
  - Sin cuenta no se pueden leer: está comprobado con `has_table_privilege`.
- **Funciones SECURITY DEFINER ejecutables:**
  - Son las acciones de la app (`pedir_conexion`, `actuar_conexion`, `guardar_registro_gestor`…),
    y cada una revisa el rol por dentro.
  - También los ayudantes de las reglas por fila (`es_equipo`, `mi_empresa`…), que solo dicen algo
    del propio usuario.
  - Sin cuenta solo quedan «Llámeme» (`pedir_llamada`) y el límite de códigos.
- **RLS sin políticas** (`talent_private`, `otp_attempts`, `private_access_log`, `ia_usos`): nadie
  las lee directo. Se usan solo a través de funciones.
- **Leaked password protection:** no aplica, porque la app no usa contraseñas.

## 4. Primer admin

Primero, la persona entra una vez por `/entrar` con su correo. Después, en el editor SQL o por
el MCP, se cambia su rol:

```sql
update user_roles set rol = 'admin'
where user_id = (select id from auth.users where email = 'correo@dominio.co');
```

Para probar el registro asistido, se asigna `gestor` de la misma forma. Para la curaduría, se
asigna `curador`.

## 5. Vercel

Cuando la prueba local funcione, se copian las mismas variables en *Vercel → Settings →
Environment Variables* y se vuelve a desplegar.

La versión publicada deja de ser una demostración: cualquiera que entre verá el inicio de sesión
y datos reales, que al principio estarán vacíos.
