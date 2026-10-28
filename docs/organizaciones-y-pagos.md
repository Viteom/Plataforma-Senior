# Equipo de la organización y pagos del talento

Migración `20261102000001_equipo_organizacion_y_pagos.sql`.

## Varias personas por organización

Antes cada organización tenía una sola cuenta (`companies.owner_id`). Ahora `company_members` guarda
quién es parte de cada organización y con qué rol:

| Rol | Puede |
| --- | --- |
| Administración (`admin`) | Todo lo de procesos, invitar personas, cambiar roles, quitar acceso y editar los datos de la organización. |
| Procesos (`procesos`) | Publicar retos, explorar talento, conversar y proponer acuerdos. |
| Solo lectura (`lectura`) | Ver retos y procesos. La base bloquea cualquier cambio, también por RPC. |

- `mi_empresa()` ahora sale de `company_members`, así que todas las políticas existentes funcionan
  para cualquier persona del equipo. Cada cuenta sigue en una sola organización.
- Quien registra la organización queda como administración. Siempre queda al menos una persona con
  administración.
- Todo el equipo ve el talento con las mismas reglas: sin nombre ni foto hasta la doble aceptación.

### Invitaciones

Administración invita un correo con un rol. **Kánna todavía no envía correos** (no hay dominio ni
proveedor): la persona invitada entra por `/entrar?para=empresa` con ese correo y, al verificar el
código, `aceptar_invitacion()` la suma al equipo. La invitación vence en 7 días. Una cuenta de
talento con perfil, o del equipo Kánna, nunca se convierte en cuenta de organización.

Cuando haya proveedor de correo, el aviso de invitación se envía desde `invitarPersona`.

## Cómo prefiere recibir sus pagos el talento (`/mi-perfil/pagos`)

`talent_payout_preferences` guarda solo la preferencia: Nequi, Daviplata, cuenta de banco o giro en
efectivo (Gana u otra red, con la cédula). Para Nequi y Daviplata, si el celular es distinto al de la
cuenta, se guarda ese número.

- **El número de una cuenta de banco no se guarda en Kánna.** Se escribirá en la página segura del
  proveedor de pagos cuando se contrate. Así, una falla en Kánna no expone cuentas bancarias.
- La ve la persona y el equipo Kánna; ninguna organización. Se incluye en la descarga de datos y se
  borra con el perfil.
- Que una opción aparezca no significa que funcione: depende del proveedor de pagos que se contrate.
  La pantalla dice que Kánna todavía no hace pagos.

## Aplicar

Se aplica después de `20261101000001` (segundo factor del equipo). No cambia nada visible para una
organización de una sola cuenta: quien la registró queda como administración.
