# Backoffice del equipo: entrada y panel de inicio

## Entrada con segundo factor (`/equipo/entrar`)

Curaduría y administración entran con correo y clave, y después con el código de 6 números de una
app de verificación (TOTP: Google Authenticator, Microsoft Authenticator u otra). La primera vez, la
pantalla muestra un código QR para activar el segundo factor.

La protección no depende de la pantalla: la migración `20261101000001` hace que `mi_rol()` no dé el
rol de curador ni de admin a una sesión sin segundo factor (`aal2`). Con solo la clave o el código
por SMS, RLS trata la cuenta como si no tuviera rol. El gestor de campo no entra en esta regla.

La sesión del equipo se cierra tras 30 minutos sin uso (`lib/auth/inactividad.ts`). Es un control de
la app, no de Supabase: la marca de actividad se renueva en cada pantalla del equipo.

Quien entra por `/entrar` con un código por SMS y tiene rol de equipo llega directo al paso del
segundo factor.

## Crear una cuenta del equipo

Hasta que exista la pantalla «Equipo y permisos»:

1. En Supabase, Authentication → Users → Add user → Create new user, con el correo y una clave
   temporal, y «Auto Confirm User».
2. En el SQL Editor, dale el rol y, si quieres, el nombre que verá en el panel:

   ```sql
   update user_roles set rol = 'curador' where user_id = (select id from auth.users where email = 'correo@dominio');
   update auth.users set raw_user_meta_data = raw_user_meta_data || '{"nombre":"Ana Ruiz"}' where email = 'correo@dominio';
   ```

3. La persona entra en `/equipo/entrar` y activa su segundo factor con el código QR.

Si alguien pierde el celular, administración borra su factor en Supabase (Authentication → Users →
la persona → Multi-factor authentication) y la persona lo activa de nuevo al entrar. Se hace después
de confirmar su identidad en persona o por videollamada.

## Panel de inicio (`/equipo`)

- **Primero, lo que tiene plazo:** casos de bienestar abiertos (y cuántos pasaron la revisión
  sugerida de 48 horas), solicitudes de ayuda y avisos por dar.
- **Por decidir:** pendientes por área, con enlace a cada cola.
- **Lo último del equipo:** retos aprobados y organizaciones verificadas, con quién lo hizo o si fue
  el semáforo.
- **Cómo va la semana:** personas nuevas, organizaciones verificadas, conversaciones, acuerdos en
  curso y el resultado del semáforo.

Todo sale de `resumen_equipo()`: cifras y nombres de organizaciones, nunca datos de una persona del
talento. Leer el resumen no abre casos de bienestar.

La antigua página de curaduría ahora está en `/equipo/curaduria`.

## Aplicar

La migración y el código se publican juntos: con la migración sin el código nuevo, el equipo que
entra por SMS pierde sus permisos; con el código sin la migración, el panel no tiene resumen.

Pendiente para la siguiente entrega: «Equipo y permisos» (invitar, cambiar rol, quitar acceso,
restablecer el segundo factor) y «Registro de actividad».
