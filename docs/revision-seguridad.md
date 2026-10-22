# Revisión de seguridad — 21 de octubre de 2026

Revisé la base de datos (las 8 migraciones, las vistas, las funciones y los 4 buckets de archivos),
las acciones del servidor, `middleware.ts`, la configuración de Next, el service worker y las
dependencias. También corrí el asesor de seguridad de Supabase sobre el proyecto real, solo para
leer, sin cambiar nada.

**En resumen:** no encontré nada **crítico**. Ninguna empresa puede leer la fecha de nacimiento, la
pensión ni los datos privados. Una empresa sin verificar tampoco llega al talento: la base lo
impide. Sí hay **3 hallazgos altos**, que se pueden aprovechar hoy con la llave pública, y
**7 medios**. Todo lo grave sale de lo mismo: hay datos que el equipo revisó o verificó y que
después alguien puede cambiar sin que la base lo frene.

| # | Gravedad | Hallazgo | Cómo se confirmó |
|---|---|---|---|
| A1 | Alta | Una empresa verificada puede cambiarse el nombre y el NIT y conserva el sello | **Arreglado** (22 oct), prueba en verde |
| A2 | Alta | La persona puede cambiar una evidencia ya verificada y borrar o mejorar la evaluación que le dejó una empresa | **Arreglado** (22 oct), prueba en verde |
| A3 | Alta | «Llámeme» sin cuenta permite llenar la base y la cola del equipo | **Arreglado** (22 oct), prueba en verde |
| M1 | Media | El límite de 5 códigos por hora se salta llamando directo a Supabase | Leyendo el código |
| M2 | Media (alta al prender SMS) | Reclamar un perfil del gestor no exige que el celular esté confirmado | Leyendo el código; depende de la configuración |
| M3 | Media | Etiquetas nuevas llegan a las empresas sin revisión del equipo (pueden llevar un celular) | Prueba que falla |
| M4 | Media | Faltan cabeceras de seguridad (CSP, antimarco, etc.) | Leyendo el código |
| M5 | Media | El celular guarda 24 horas las pantallas con datos personales, aun después de «Salir» | Leyendo el código de Serwist |
| M6 | Media | «Borrar cuenta» deja la foto, el audio de la historia y la autorización | Leyendo el código |
| M7 | Media | Verificar el NIT en el RUES no prueba que quien registra sea de esa empresa | Sospecha de proceso |
| B1–B8 | Baja | Detalles de defensa en profundidad | Ver abajo |

Las pruebas están en [`tests/db/seguridad.test.ts`](../tests/db/seguridad.test.ts). Cada una
describe lo que debería pasar. El 22 de octubre se arreglaron A1, A2 y A3 en `supabase/migrations/20261026000001_seguridad_altos.sql`, y sus 8 pruebas
quedaron en verde. **Solo sigue fallando, a propósito, la de M3**, hasta que se arregle. La
migración **ya está aplicada en la base real** desde el 22 de octubre: se corrió en el SQL Editor
y la versión `20261026000001` quedó anotada en `supabase_migrations.schema_migrations`. Después de
aplicarla, el asesor de seguridad de Supabase mostró los mismos avisos de antes y ninguno nuevo.
Eso era lo esperado: el asesor no revisa reglas como estas, que se comprueban con las pruebas.

---

## Confirmados con prueba

### A1 · Alta · Una empresa verificada puede cambiar su nombre y su NIT

- **Dónde:** `supabase/migrations/20261021000001_acceso.sql:319` (política `empresa_editar`) y el
  trigger `proteger_verificacion` en `supabase/migrations/20261023000002_empresa_conexiones.sql:23`.
  El talento ve ese nombre en `talent_opportunities_view` (misma migración, línea 412).
- **Cómo se aprovecha:** alguien registra «Panadería Pérez SAS» con un NIT real y el equipo la
  verifica en el RUES. Al día siguiente, desde su sesión, se cambia el nombre a «Ecopetrol». El
  trigger solo cuida las columnas de verificación y el estado, así que el sello «Empresa
  verificada» sigue puesto. La persona ve «Ecopetrol · Empresa verificada» en su oportunidad. Con
  talento de 45 años o más, que es justo a quien buscan las estafas, el riesgo es alto.
- **Prueba:** `A1 · ...` → la base acepta `update companies set nombre = 'Ecopetrol'`.
- **Cómo se arregla:** en `proteger_verificacion`, si la empresa ya está verificada, rechazar
  cambios de `nombre` y `nit` que no vengan del equipo. Otra opción es quitar la verificación
  (poner `verificada_en` en null) para que el equipo vuelva a revisar.
- **Estado: arreglado.** Se eligió rechazar el cambio. Si la empresa necesita corregir su nombre o
  su NIT, lo hace el equipo después de volver a mirar el RUES.

### A2 · Alta · Lo verificado se puede cambiar después, y las evaluaciones malas se pueden borrar

- **Dónde:** `supabase/migrations/20261022000001_perfil_huella.sql:121` (`evidencia_editar`),
  `:125` (`evidencia_borrar`) y el trigger `proteger_verificacion_evidencia` en `:130`. Solo
  protege `estado`, `verificada_por`, `nota_equipo` y `tipo`. La evaluación de la empresa se crea en
  `20261023000002_empresa_conexiones.sql:260`. Las empresas ven la descripción por
  `company_evidence_view` (`lib/datos/consultas.ts:66`).
- **Cómo se aprovecha:**
  1. La persona sube un certificado y el equipo lo verifica (y revisa que no muestre la edad).
     Después ella cambia la descripción a «Gerente general de Nestlé», o cambia el archivo por otro
     que puede mostrar la fecha de grado. Sigue apareciendo como «verificada».
  2. Una empresa cierra la conexión con «1 de 5». La persona cambia el texto a «5 de 5» o borra
     esa evidencia. Así pierde sentido la evaluación, que el brief cuenta como prueba de
     confiabilidad.
- **Prueba:** `A2 · ...` (4 casos) → la base acepta los tres cambios y el borrado.
- **Cómo se arregla:** en el trigger, si `old.estado = 'verificada'`, rechazar cambios de
  `descripcion`, `archivo_path`, `referencia_*` y `talent_id`. La persona sí puede seguir cambiando
  `autorizada_empresas`. Si quiere corregir algo, se crea una evidencia nueva que vuelve a revisión.
  Además, `evidencia_borrar` no debe permitir que la persona borre las de `tipo = 'evaluacion'`.
  Ocultarlas sí, con `autorizada_empresas`, si el equipo así lo decide.
- **Estado: arreglado.** Una evidencia verificada ya no cambia de texto, archivo, referencia ni
  perfil, y la persona no puede borrar una evaluación (sí se borra si borra todo su perfil).
  **Queda una decisión para el equipo:** hoy la persona todavía puede ocultarle una evaluación a
  las empresas con `autorizada_empresas`.

### A3 · Alta · «Llámeme» sin cuenta sirve para llenar la base

- **Dónde:** `supabase/migrations/20261024000001_experiencias_ayuda.sql:111` (`pedir_llamada`,
  abierta a `anon` en la línea 137). La columna `motivo` no tiene tope de largo
  (`20261022000001_perfil_huella.sql:73`).
- **Cómo se aprovecha:** la llave pública está en el navegador de cualquiera. Con ella, un script
  llama `pedir_llamada` directo, sin pasar por la pantalla, que sí recorta el motivo a 300 letras:
  - Manda motivos de un megabyte cada uno. Unas 500 llamadas llenan los 500 MB del plan gratuito
    y la base queda en solo lectura: nadie puede registrarse ni guardar nada.
  - El tope es de 3 por número, pero hay mil millones de números posibles. La cola del equipo se
    llena de pedidos falsos y los reales se pierden.
  - Puede poner celulares de otras personas para que el equipo llame a desconocidos.
  - Las personas con cuenta pueden hacer lo mismo en `help_requests` (política `ayuda_crear`), que
    tampoco tiene tope de largo.
- **Prueba:** `A3 · ...` → la base acepta un motivo de 100.000 letras y 50 pedidos seguidos.
- **Cómo se arregla:**
  1. `check (length(motivo) <= 500)` en `help_requests` y lo mismo dentro de la función.
  2. Un tope global por hora para pedidos sin cuenta (por ejemplo, 30). Si se pasa, la pantalla
     muestra el WhatsApp del equipo.
  3. Al prender producción, poner un CAPTCHA amable (Cloudflare Turnstile, que casi nunca le pide
     nada a la persona) en «Llámeme» y en `/entrar`.
- **Estado: arreglado (1 y 2).** El motivo de `help_requests` tiene un tope de 500 letras y el
  teléfono, de 20. Sin cuenta se aceptan máximo 30 pedidos por hora en total. Si se pasa, la
  pantalla le dice a la persona que escriba por WhatsApp o lo intente en una hora. El CAPTCHA (3)
  sigue pendiente para producción. Las personas con cuenta todavía pueden crear muchas solicitudes
  cortas: llenar la base así tomaría cerca de un millón de pedidos, pero conviene ponerles un tope
  diario más adelante.

### M3 · Media · Etiquetas nuevas llegan a las empresas sin pasar por el equipo

- **Dónde:** `company_talent_view` muestra toda etiqueta `confirmada`
  (`20261023000002_empresa_conexiones.sql:363`), y la persona puede escribir etiquetas con texto
  libre (`20261021000001_acceso.sql:276`). El brief dice que las etiquetas fuera de la taxonomía
  pasan por el equipo.
- **Cómo se aprovecha:** desde la API, la persona (o alguien que se haga pasar por talento)
  inserta la etiqueta «Escríbame al 300…» o «Tengo 62 años» ya confirmada. La ven todas las
  empresas. Eso se salta la regla de no dar el celular antes de abrir la conexión y puede revelar
  la edad (regla 1).
- **Prueba:** `M3 · ...`.
- **Cómo se arregla:** en la vista, mostrar solo `taxonomy_id is not null`, o agregar una columna
  `aprobada_por_equipo` para las nuevas.

---

## Confirmados leyendo el código (sin prueba automática)

### M1 · Media · El límite de códigos de `/entrar` se puede saltar

- **Dónde:** `app/(publico)/entrar/acciones.ts:19`. El límite de 5 por hora se revisa en Next antes
  de pedir el código, pero Supabase Auth acepta pedidos directos con la llave pública
  (`lib/supabase/config.ts:4`).
- **Cómo se aprovecha:** un script llama `/auth/v1/otp` de Supabase directo con muchos correos. No
  pasa por `registrar_intento_codigo`. Solo lo frena el tope de correos por hora del proyecto. Si
  lo agota, **nadie puede entrar** esa hora, y de paso quema la cuota de Resend y la reputación del
  dominio. El día que se prenda el SMS, cada mensaje cuesta plata.
- **Cómo se arregla:** el límite de verdad tiene que estar en Supabase. En *Authentication → Rate
  Limits*, dejar topes bajos. En *Authentication → Attack Protection*, prender el CAPTCHA
  (Turnstile) y mandar el token desde `/entrar`. El límite propio se puede dejar como segunda capa.

### M2 · Media (alta al prender SMS) · Reclamar el perfil del gestor no exige celular confirmado

- **Dónde:** `supabase/migrations/20261024000001_experiencias_ayuda.sql:180` lee `auth.users.phone`
  sin mirar `phone_confirmed_at`. En la configuración local, `supabase/config.toml:271` tiene
  `enable_confirmations = false` para SMS, y la línea `:227` lo tiene igual para correo.
- **Cómo se aprovecha:** si se prende el ingreso por celular y en la nube queda apagado «Confirm
  phone», alguien se registra con el celular de doña Rosa sin recibir el código (Supabase también
  acepta registro con contraseña) y `reclamar_perfil` le entrega el perfil que el gestor creó en
  campo, con su nombre, su historia y su audio. Hoy no se puede hacer porque el SMS está apagado.
- **Cómo se arregla:** en la función, agregar `and phone_confirmed_at is not null`. En el panel de
  Supabase, revisar que «Confirm email» y «Confirm phone» estén prendidos antes de encender Twilio.

### M4 · Media · Faltan cabeceras de seguridad

- **Dónde:** `next.config.ts:9`. No hay `headers()`.
- **Cómo se aprovecha:** sin `frame-ancestors` ni `X-Frame-Options`, otra página puede meter la
  plataforma en un marco invisible y engañar a la persona para que toque «Borrar mi cuenta» o «Me
  interesa» (se llama *clickjacking*). Sin CSP, si algún día se cuela un script, nada lo frena.
- **Cómo se arregla:** agregar en `next.config.ts` estas cabeceras: `Content-Security-Policy`
  (con `frame-ancestors 'none'` y `connect-src` solo hacia el dominio de Supabase),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), geolocation=(), microphone=(self)` (el micrófono hace falta para
  dictar) y `Strict-Transport-Security`. Vercel pone esta última en sus dominios; hay que revisarla
  en el dominio propio.

### M5 · Media · Las pantallas con datos personales quedan guardadas en el celular

- **Dónde:** `app/sw.ts:19` usa `defaultCache` de Serwist. Esa caché guarda 24 horas las páginas y
  sus datos (`pages`, `pages-rsc`) y también lo que llega de otros dominios (`cross-origin`). La
  acción `salir` (`app/(publico)/entrar/acciones.ts:120`) no borra esa caché.
- **Cómo se aprovecha:** muchas personas usan un celular prestado o compartido. Después de «Salir»,
  otra persona sin señal abre `/mi-perfil` o `/oportunidades` y ve la última versión guardada, con
  nombre, historia y empresas.
- **Cómo se arregla:** guardar en caché solo lo público y lo estático (íconos, `/`, `/ayuda`,
  `/sin-conexion`). Las áreas con sesión deben ir siempre a la red (`NetworkOnly`). Al salir, borrar
  las cachés con `caches.delete(...)`.

### M6 · Media · «Borrar cuenta» no borra todos los archivos

- **Dónde:** `app/(talento)/mi-perfil/acciones.ts:205`. Solo borra el bucket `evidencias`. Los
  buckets `fotos`, `historias` y `autorizaciones` no tienen política de borrado
  (`20261024000001_experiencias_ayuda.sql:240`).
- **Cómo se aprovecha:** no es un ataque. Es un incumplimiento de la Ley 1581: la persona pide
  borrar todo y su foto, su voz y su firma siguen guardadas sin dueño.
- **Cómo se arregla:** borrar las carpetas `<id del perfil>/` de los cuatro buckets con la llave de
  servicio, en el servidor, antes de borrar el perfil. Si no hay llave, dejarlo en la solicitud
  `borrar_cuenta` para que lo haga el equipo.

### M7 · Media · Verificar el NIT no prueba que la persona sea de la empresa (sospecha de proceso)

- **Dónde:** `app/equipo/acciones.ts:121`. El brief (línea 297) pide confirmar NIT y nombre en el
  RUES.
- **Cómo se aprovecha:** cualquiera copia el NIT de una empresa real que aparece en el RUES y la
  registra. El NIT existe y el nombre coincide, así que pasa la verificación.
- **Cómo se arregla:** en el proceso, además del RUES, llamar al teléfono que figura en el RUES o en
  la página de la empresa (no al que dio quien se registró). Otra opción es pedir que el correo de
  la cuenta sea del dominio de la empresa. Hay que anotar en `verificada_fuente` cómo se confirmó.

---

## Bajos

| # | Hallazgo | Dónde | Qué hacer |
|---|---|---|---|
| B1 | `npm audit`: 6 altas y 1 moderada, **todas en herramientas de construcción** (`eslint-config-next`, `postcss` dentro de `next`). No llegan al celular de nadie | `package.json` | Actualizar `next` y `eslint-config-next` en la próxima actualización normal. No es urgente |
| B2 | La persona puede publicar su perfil sin huella llamando a la API. La regla solo está en la pantalla | `app/(talento)/mi-perfil/acciones.ts:62`; política `perfil_editar` en `20261021000001_acceso.sql:189` | Trigger: no pasar a `publicado` sin al menos una etiqueta confirmada |
| B3 | Con el rango mínimo y el máximo juntos se calcula la tarifa exacta con un error de ±1 % | `20261023000002_empresa_conexiones.sql:371` | Redondear a escalones fijos (por ejemplo, de 10.000 en 10.000) en vez de ±15 % |
| B4 | Cualquier cuenta con rol empresa, aunque no haya registrado su empresa, lee todos los perfiles publicados y sus evidencias sin límite (el límite de 300 solo está en la pantalla) | `20261023000002_empresa_conexiones.sql:380`, `20261022000001_perfil_huella.sql:157` | Pedir `mi_empresa() is not null` en las vistas y vigilar consultas masivas en los registros |
| B5 | El asesor de Supabase avisa que `mi_rol`, `es_equipo`, `es_mi_perfil` y `mi_empresa` se pueden llamar sin sesión. No devuelven nada útil, pero conviene cerrarlas. `anon` también tiene permisos de tabla por defecto; RLS lo frena, pero sobra | Migración de acceso | `revoke execute ... from anon` y `revoke all on <tablas privadas> from anon` |
| B6 | Si en producción faltan las variables de Supabase, la app entra en modo demostración y abre todas las áreas (con datos de ejemplo) | `middleware.ts:10`, `lib/supabase/config.ts:5` | En producción, fallar al arrancar si faltan las variables |
| B7 | Todas las acciones aceptan cuerpos de 25 MB (solo el gestor lo necesita) | `next.config.ts:12` | Bajarlo a 12 MB o mover la carga del gestor a subida directa a Storage |
| B8 | `registrar_intento_codigo` está abierta a `anon`: se pueden meter filas basura (se borran al día). Con `OTP_PEPPER` puesto, nadie puede bloquear el número de otra persona | `20261021000001_acceso.sql:366` | Basta con lo de M1 |

**Nota que no es de seguridad:** el registro del gestor sube los archivos con `upsert: true`, pero
ningún bucket tiene política de actualización. Si la señal se cae y el gestor reintenta, la subida
falla con «No pudimos subir la autorización» (`app/gestor/registrar/acciones.ts:58`).

**Sobre el asesor de Supabase:** «Security Definer View» ya está explicado en
`docs/conectar-supabase.md`. «Leaked Password Protection» no aplica porque no usamos contraseñas,
pero recuerda que Supabase sí acepta registro con contraseña (ver M2).

## Lo que revisé y está bien

- **Edad y datos privados:** `talent_private` no tiene ningún camino de lectura fuera de
  `ver_datos_privados`, que exige rol de equipo y deja registro. Ninguna vista de empresa ni el
  puntaje leen fecha de nacimiento, pensión ni `requisito_entrada`.
- **Empresas y tablas de talento:** una empresa no lee `talent_profiles`, `stories`,
  `footprint_tags`, `evidence` ni `connections` directamente. Solo entra por las vistas, y `anon`
  no lee ninguna vista.
- **Regla 9:** el trigger `conexion_regla_9` frena cualquier paso a `enviada_talento` de una empresa
  sin verificar o en pausa, venga de donde venga (también del equipo y de la consola).
- **Subir de rol:** nadie se pone curador, gestor ni admin solo. El registro solo da talento o
  empresa, y `user_roles` solo la cambia un admin.
- **Acciones del servidor:** ninguna usa la llave de servicio salvo borrar el usuario de Auth.
  Todas usan la sesión de la persona, así que RLS decide. Esto importa porque una acción de Next se
  puede llamar desde cualquier ruta y el `middleware` no la protege.
- **Llaves:** solo la URL y la llave pública llevan `NEXT_PUBLIC_`. `.env.local` está fuera del
  repositorio.
- **Datos personales en URL y registros:** el celular o el correo de `/entrar` van en una cookie
  `httpOnly` de 10 minutos, no en la URL. Los `console.error` solo escriben el código del error.
- **Archivos:** los 4 buckets son privados, con tamaño máximo y tipos permitidos. Las rutas
  empiezan con el id del perfil y la política lo exige. La pantalla de evidencias también revisa
  el tipo y el tamaño.

---

## Cuando haya medios de pago

Hoy la plataforma no cobra ni paga nada. En la v1, el equipo cotiza y confirma fuera de la
plataforma. Cuando se agregue una pasarela (Wompi, PayU, Mercado Pago, ePayco), esto es lo que no
se negocia:

1. **Nunca tocar datos de tarjeta.** Usar el formulario o la página de la pasarela, nunca un campo
   propio. Así la plataforma queda fuera del alcance de PCI DSS. En la base solo se guarda el id de
   la transacción, el estado y el monto.
2. **El monto lo decide el servidor.** El navegador manda «quiero pagar la solicitud X». El
   servidor busca `valor_cotizado` en la base y crea el cobro. Un monto que venga del navegador no
   se usa.
3. **El pago se confirma solo con el webhook firmado.** Que la persona vuelva a la página de
   «gracias» no prueba nada. El webhook se verifica con la firma de la pasarela (secreto solo en el
   servidor), se rechaza si es viejo (marca de tiempo) y se procesa una sola vez (guardar el id del
   evento con `unique`).
4. **Cuadrar monto y moneda** del webhook con lo que hay en la base antes de marcar «pagado».
5. **Estados solo hacia adelante** y con trigger, como la regla 9: `pendiente → aprobado →
   reembolsado`. Nadie salta de `pendiente` a `pagado` por la API.
6. **Pagos a las personas (sabedoras y talento):** doble revisión del equipo para cambiar una cuenta
   bancaria, aviso por SMS a la persona cuando cambie, y nunca pagar a una cuenta que se cambió el
   mismo día.
7. **Antifraude:** el aviso fijo de «nadie le va a pedir dinero» tiene que seguir siendo verdad. La
   plataforma **nunca** le cobra al talento. Si algún día lo hiciera, cambiar el aviso primero.
8. **Llaves de la pasarela** solo en variables del servidor, una de prueba y otra de producción,
   nunca con `NEXT_PUBLIC_`.
9. **Registro de auditoría** de cada cambio de estado de un pago (quién, cuándo, desde qué),
   guardado al menos 5 años por la DIAN.

Cuando llegue ese hito, agregar a `tests/db` pruebas como las de la regla 9: «un pago no pasa a
aprobado sin webhook» y «el monto no se puede cambiar desde la API».

---

## Revisar la seguridad cada cierto tiempo (propuesta, sin crear)

**Mi recomendación es combinar dos cosas.**

1. **Una GitHub Action en cada cambio (gratis y automática).** Corre `npm test` (con las pruebas de
   `tests/db/seguridad.test.ts`) y `npm audit --omit=dev --audit-level=high`, y falla si algo se
   rompe. Además, prender Dependabot para que proponga actualizaciones. Esto atrapa errores el
   mismo día, sin pensar.
2. **Una rutina de Claude programada, cada semana, para lo que requiere criterio.** La Action no
   mira la base real ni lee el código con ojo de atacante. La rutina sí:
   - **Cada lunes:**
     - Correr el asesor de seguridad y de rendimiento de Supabase (solo lectura) y comparar con la
       semana anterior.
     - Revisar `npm audit`.
     - Leer lo que cambió en `supabase/migrations` y en `app/**/acciones.ts` con la lista de
       chequeo de abajo.
     - Contar en la base las señales de abuso: pedidos de «Llámeme» por día, filas nuevas en
       `otp_attempts`, empresas creadas, reportes abiertos.
     - Dejar el informe en `docs/seguridad/AAAA-MM-DD.md` en una rama, con un PR, y avisarte solo
       si hay algo alto o crítico.
   - **El primer lunes de cada mes**, además:
     - Revisar las cabeceras del sitio en producción.
     - Revisar la configuración de Auth (confirmaciones, topes, CAPTCHA), que los buckets sigan
       privados y que las llaves no hayan cambiado de lugar.
     - Repasar los hallazgos de este informe que sigan abiertos.

   Para que la rutina no pueda dañar nada, el acceso a Supabase debe ser de **solo lectura**.

**Lista de chequeo para cada cambio**

- ¿Toda tabla nueva tiene RLS y políticas? ¿Alguna política deja que la persona cambie algo que el
  equipo verificó?
- ¿Alguna vista nueva para empresas toca `talent_private`, `stories` o datos de edad?
- ¿Toda función `security definer` revisa quién la llama y tiene `revoke ... from public, anon`?
- ¿Algún texto libre nuevo tiene tope de largo?
- ¿Alguna acción nueva usa `crearClienteAdmin`? Si es así, ¿revisa el rol antes?
- ¿Alguna variable nueva lleva `NEXT_PUBLIC_` sin ser pública?
- ¿Algún dato personal en una URL, en un registro o en la caché del service worker?

Si te parece, la creo cuando me lo apruebes: primero la Action (5 minutos) y después la rutina.
