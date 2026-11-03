# Revisión de seguridad — 3 de noviembre de 2026

Base revisada: `main`, commit `ae6cfaa8df2e86e085196bbde5c42138a087b6bd`.
Trabajo local en `revision-seguridad-2`. Se leyeron `CLAUDE.md`, las reglas del brief y la
[revisión del 21 de octubre](revision-seguridad.md). Se revisaron los cambios posteriores de
equipo, organizaciones, preferencias de pago, retención, evidencias, etiquetas, caché y voz.

**Resultado:** el segundo factor protege las consultas del panel y la asignación de roles,
pero había un camino separado para reclamar perfiles con un rol nulo. También se confirmaron
lecturas excesivas, aceptación de invitaciones sin correo confirmado, fallos de integridad de
las revisiones y problemas de retención y privacidad del navegador. Se corrigieron en esta rama.
**A2 y M3 no estaban completamente cerrados:** sus pruebas anteriores cubrían solo parte del problema.

«Corregido en rama» significa código y pruebas locales; **no significa corregido en Supabase ni
en la web publicada**. Compartir la rama en GitHub mediante un PR en borrador permite revisarla;
`vercel.json` desactiva sus despliegues automáticos. No se fusionó en `main` ni se aplicó ninguna migración.
Las prioridades **P0** señalan violaciones de acceso o privacidad de las reglas 1–4 de `AGENTS.md`;
la gravedad técnica se indica aparte.

| # | Gravedad / prioridad | Hallazgo | Estado |
|---|---|---|---|
| S1 | Alta / P0 | Reportes de bienestar consultables por RPC, también indirectamente por el semáforo | Corregido en rama |
| S2 | Alta / P0 | Una invitación, incluida administración, no exigía correo confirmado | Corregido en rama; confirmar configuración de Auth |
| S3 | Media / P0 | Curaduría y administración podían leer celulares de billeteras ajenos | Corregido en rama |
| S4 | Media | La limpieza podía borrar operaciones recién terminadas según su fecha de creación | Corregido en rama |
| S5 | Media | «Escuchar» incluía contenido oculto y valores de formularios | Corregido en rama |
| S6 | Media / P0 | La voz elegida podía ser remota y recibir texto personal | Corregido en rama |
| S7 | Media | Cookie de actividad falsificable y renovación de sesión vencida pasando por `/entrar` | Corregido en rama; límite de alcance indicado abajo |
| S8 | Media / P0 | Cambiar `owner_id` daba lectura de la organización a alguien sin membresía | Corregido en rama |
| S9 | Alta / P0 | Un rol del equipo sin `aal2` quedaba nulo y podía reclamar un perfil de campo | Corregido en rama |
| A2 | Alta / P0 | Sustitución del objeto de una evidencia y verificación de contenido cambiado durante la revisión | Corregido en rama |
| M3 | Alta / P0 | Carrera al aprobar etiquetas y textos históricos no normalizados | Corregido en rama |
| M1 | Media; alta con SMS | Las cuotas propias no protegen el endpoint directo de Supabase Auth | Abierto; requiere configuración remota y CAPTCHA |
| M2 | Media; alta con SMS / P0 | Reclamar un perfil no exigía celular confirmado | Corregido en rama; confirmar configuración de Auth |
| M4 | Media | Faltaban cabeceras de seguridad | Corregido en rama, con CSP básica |
| M5 | Media / P0 | La exclusión de caché omitía rutas y conservaba cachés privadas antiguas | Corregido en rama |
| M6 | Media / P0 | Borrar el perfil sin completar Storage perdía las referencias a archivos | Mejorado en rama; ver límites operativos |
| B1 | Avisos altos y medios | Dependencias con avisos de `npm audit` | Abierto; sin actualización mayor automática |

## Confirmados con prueba

### S1 · Alta / P0 · Reportes privados mediante funciones públicas

- **Dónde:** `20261031000008_semaforo_trabajo_digno.sql`, funciones
  `organizacion_con_reportes(uuid)` y `evaluar_trabajo(...)`.
- **Cómo se aprovecha:** se consulta cualquier UUID de empresa y se averigua si alguien reportó
  problemas de trato o pago. El auxiliar estaba abierto incluso sin sesión. El evaluador también
  devolvía ese dato en `motivos` a cualquier cuenta autenticada. Revocar solo el auxiliar no bastaba.
- **Prueba:** `S01` en `tests/db/revision-seguridad-2.test.ts`: antes la llamada resolvía normalmente;
  después ambas RPC deniegan a talento y empresas, y el auxiliar también a `anon`.
- **Cómo se arregla:** revocar `EXECUTE` a `PUBLIC`, `anon` y `authenticated` en ambas funciones.
  Los triggers `SECURITY DEFINER` mantienen su uso interno. El semáforo de los retos sigue funcionando.
- **Estado:** corregido en rama, migración `20261103000002`. Esto cierra la consulta arbitraria de
  otras organizaciones; el estado de revisión de las condiciones propias sigue siendo visible por diseño.

### S2 · Alta / P0 · Invitación sin demostrar posesión del correo

- **Dónde:** `aceptar_invitacion()` en `20261102000001_equipo_organizacion_y_pagos.sql`.
- **Cómo se aprovecha:** una sesión cuyo `auth.users.email` coincide con una invitación puede
  aceptarla aunque el correo no esté confirmado. Si la invitación es de administración, puede
  gestionar miembros y retirar a los anteriores. El endpoint RPC no depende de la pantalla de códigos.
- **Prueba:** `S02` en `tests/db/revision-seguridad-2.test.ts`: antes aceptaba el UUID de la empresa
  con `email_confirmed_at` vacío; después devuelve `null` y no crea membresía. Confirmado, sí acepta.
- **Cómo se arregla:** exigir correo confirmado, rechazar roles nulos, conservar la exclusión de
  cuentas del equipo y de talento con perfil. Serializar la aceptación por cuenta y comprobar la
  invitación bajo bloqueo, tomando primero el bloqueo de la organización.
- **Estado:** corregido en rama, `20261103000002`. **Confirm email debe estar activado en el
  proyecto real:** una fecha autoconfirmada por configuración no demuestra posesión. Se corrigió
  también la configuración local, cubierta por `tests/unit/config-auth-seguridad.test.ts`.

### S3 · Media / P0 · Lectura excesiva de preferencias de pago

- **Dónde:** política `pago_ver` de `talent_payout_preferences`.
- **Cómo se aprovecha:** cualquier curador o admin con `aal2` podía consultar la preferencia y
  el celular de la billetera de cualquier persona. El flujo actual no necesita esta lectura del equipo.
- **Prueba:** `S03` en `tests/db/revision-seguridad-2.test.ts`: antes curaduría obtenía una fila;
  ahora otro talento, una empresa, curaduría y administración no leen ni modifican la fila.
- **Cómo se arregla:** lectura y escritura exclusivamente del titular, con RLS. La prueba anterior
  de organizaciones se actualizó porque antes exigía expresamente que el equipo sí pudiera leerla.
- **Estado:** corregido en rama, `20261103000002`. El propietario de la base y una llave de servicio
  siguen siendo accesos privilegiados; no se promete que RLS frene al administrador de infraestructura.

### S4 · Media · Retención desde la fecha equivocada

- **Dónde:** `limpiar_datos_vencidos()` en `20261103000001_panel_y_retencion.sql`.
- **Cómo se aprovecha:** no requiere un atacante. Una ayuda creada hace dos años y cerrada hoy
  podía desaparecer en la siguiente limpieza. Lo mismo ocurría con un aviso creado hace más de
  90 días y recién enviado. Una invitación creada hace 31 días podía borrarse tras solo 24 días
  vencida; una cancelación reciente tampoco conservaba sus 30 días.
- **Prueba:** los casos `S04` de `tests/db/revision-seguridad-2.test.ts` conservan operaciones recién
  terminadas, eliminan las realmente vencidas y comprueban que la API no puede antedatar el cierre.
  Antes se eliminaban las filas recientes descritas arriba.
- **Cómo se arregla:** `cerrada_en` y `finalizada_en`, mantenidas por triggers; conservar un año
  desde el cierre y 90 días desde el final del aviso. Invitaciones: 30 días desde vencimiento o
  cancelación. Para cierres históricos sin fecha fiable se concede el plazo completo desde la
  migración; para avisos enviados se usa `enviado_en` cuando existe.
- **Estado:** corregido en rama, `20261103000004`. No cambia los plazos de OTP, IA ni auditoría,
  ni elimina perfiles, evidencias, historias o casos de bienestar. Los plazos necesitan aprobación legal.
- **Permisos:** `panel_equipo()` y `resumen_equipo()` admiten `authenticated`, pero su cuerpo
  exige equipo y `aal2`. La limpieza revoca ejecución a `PUBLIC`, `anon` y `authenticated`:
  ningún usuario de la app, incluido un admin con `aal2`, la ejecuta. El propietario y el cron que
  corre como propietario sí; otros roles privilegiados, como `service_role`, dependen de los
  grants administrativos del proyecto, que no se pudieron inspeccionar remotamente.

### S5 · Media · Lectura de contenido invisible

- **Dónde:** `textoDe()` en `lib/voz.ts`.
- **Cómo se aprovecha:** al tocar «Escuchar esta pantalla», el clon del DOM incluía texto con
  `hidden`, `display:none`, detalles cerrados, contenido de `textarea` y opciones de `select`.
  La persona podía oír en público algo que no había elegido mostrar.
- **Prueba:** `S05` en `tests/unit/voz-seguridad.test.tsx`: antes el texto contenía todos esos
  valores. Ahora conserva texto visible y el resumen de un detalle cerrado, sin sus contenidos.
- **Cómo se arregla:** recorrer el DOM real y sus estilos efectivos; omitir zonas privadas,
  ancestros ocultos, formularios y detalles cerrados. No leer valores de campos.
- **Estado:** corregido en rama. La lectura del texto personal que sí está visible sigue siendo
  voluntaria y comienza únicamente al tocar el control.

### S6 · Media / P0 · La voz podía ser un servicio remoto

- **Dónde:** `useVoz()` en `lib/voz.ts`, usado por `components/talento/voz.tsx`.
- **Cómo se aprovecha:** se escogía la primera voz en español sin comprobar `localService`.
  Una voz remota puede procesar fuera del dispositivo la pantalla, incluidos datos personales.
  No es equivalente a una voz local ni a la promesa de no usar servicios externos.
- **Prueba:** `S06` en `tests/unit/voz-seguridad.test.tsx`: con una voz remota primero y una local
  después, antes se seleccionaba la remota; después se selecciona únicamente la local.
- **Cómo se arregla:** exigir voz local en español y seleccionarla expresamente. Si no existe,
  no ofrecer reproducción mediante una voz remota ni dejar que el navegador elija por defecto.
  Cancelar al ocultar o abandonar la página y al salir.
- **Estado:** corregido en rama. Se probó la selección mediante la API simulada, no tráfico de
  proveedores reales. `localService` es la declaración del navegador; falta comprobar dispositivos reales.

### S7 · Media · Inactividad manipulable

- **Dónde:** `lib/auth/inactividad.ts`, `middleware.ts`, entrada del equipo.
- **Cómo se aprovecha:** se podía enviar una cookie con la fecha actual, porque `HttpOnly` no
  aporta integridad. Además, una sesión vencida con `aal2` recibía actividad nueva pasando por
  `/entrar`, donde se omitía la comprobación de antigüedad.
- **Prueba:** `tests/unit/inactividad-seguridad.test.ts`: ambos caminos pasaban antes. Ahora
  cierran la sesión. También se comprueba que una firma válida permite entrar, vence a los 30
  minutos y no sirve en otra cuenta ni otra sesión.
- **Cómo se arregla:** HMAC-SHA-256 de la marca, ligada a `sub` y `session_id`; comprobarla
  también en `/entrar` y renovarla solo tras validarla.
- **Estado:** corregido en rama. Requiere **`EQUIPO_SESSION_SECRET` de al menos 32 caracteres
  aleatorios, solo en servidor**, documentado en `.env.example`. Sin él el equipo falla cerrado;
  las cookies anteriores obligan a entrar de nuevo. Rotarlo también obliga a volver a entrar.
- **Límite:** esto protege la navegación web. La fecha de esta cookie no forma parte del JWT
  enviado directamente a Supabase. No certifica una caducidad universal de 30 minutos para API:
  hay que revisar expiración, revocación e inactividad de Auth en el proyecto real.

### S8 · Media / P0 · `owner_id` como puerta alternativa de lectura

- **Dónde:** `companies.owner_id` y política `empresa_ver`.
- **Cómo se aprovecha:** un admin de organización podía poner como propietario a un UUID ajeno
  mediante `UPDATE`. Esa cuenta obtenía lectura de la fila sin invitación, membresía ni comprobación
  del correo, por la excepción `owner_id = auth.uid()` necesaria durante el alta.
- **Prueba:** `S08` en `tests/db/revision-seguridad-2.test.ts`: antes aceptaba el cambio; ahora lo
  rechaza y la cuenta ajena sigue sin ver la empresa.
- **Cómo se arregla:** impedir cambios directos del titular desde los roles de la API. El alta y
  `quitar_miembro` mantienen la referencia internamente. Las operaciones de administración toman
  un bloqueo de organización antes de comprobar rol y conservar al menos un admin.
- **Estado:** corregido en rama, `20261103000002`. Las pruebas anteriores de retirada del
  propietario siguen pasando. PGlite no demuestra concurrencia real entre varias sesiones de Postgres.

### M2 y S9 · Media/alta / P0 · Reclamar perfiles sin la autenticación requerida

- **Dónde:** `reclamar_perfil()` en `20261024000001_experiencias_ayuda.sql`.
- **Cómo se aprovecha:** M2 seguía abierto: bastaba `auth.users.phone` sin confirmar. Además,
  `mi_rol()` devuelve `NULL` para curaduría/admin sin `aal2`; `mi_rol() <> 'talento'` también
  devuelve `NULL`, y el `IF` no rechazaba esa sesión. Con el celular coincidente podía adquirir
  un perfil de campo y leer su información por las políticas del propietario, sin entrar al panel.
- **Prueba:** casos `M2` y «el equipo sin aal2» de `tests/db/revision-seguridad-2.test.ts`.
  Antes ambos recibían el perfil. Ahora un teléfono sin confirmar y un rol nulo reciben `null`;
  talento con teléfono confirmado sí lo reclama.
- **Cómo se arregla:** `IS DISTINCT FROM 'talento'`, `phone_confirmed_at`, bloqueo por cuenta y
  bloqueo de la fila de perfil antes de asignarla. Se mantiene la exclusión de empresas.
- **Estado:** corregido en rama, `20261103000002`. También se activaron las confirmaciones en
  `supabase/config.toml`. **Confirm phone debe activarse en la nube antes del piloto**: Auth puede
  autoconfirmar fechas si esa opción está desactivada. No se cambiaron ajustes del proyecto remoto.

### A2 · Alta / P0 · Integridad de la evidencia, incluidos archivo y revisión

- **Dónde:** políticas de `storage.objects` del bucket `evidencias`, `revisarEvidencia` y su pantalla.
- **Cómo se aprovecha:** aunque no cambiara `archivo_path`, su propietario podía borrar el objeto
  y volver a subir otro en la misma ruta. Además, una descripción pendiente podía cambiar tras
  verla el equipo y antes del `UPDATE` que la verificaba, por ejemplo a «Tengo 62 años».
- **Prueba:** «A2 ampliado» en `tests/db/revision-seguridad-2.test.ts` reproduce el borrado del
  objeto; `A2` en `tests/db/etiquetas-revision.test.ts` llama la acción real con contenido cambiado.
  Ambas fallaban antes. Se prueba además una revisión válida, la invalidación de versiones y el
  rechazo de revisión por una cuenta de talento. Las pruebas antiguas de A2 siguen pasando.
- **Cómo se arregla:** impedir borrar, sobrescribir o recrear objetos mientras estén enlazados
  a evidencias, incluso pendientes. Para cambiar el archivo se utiliza otra ruta. Añadir una
  revisión UUID mantenida por trigger y aprobar mediante RPC atómica con bloqueo y comparación
  de la versión vista en pantalla. Validar también descripción y nota destinadas a empresas.
- **Estado:** corregido en rama, `20261103000003`. Se conserva la decisión de ocultar una evidencia
  y la eliminación del perfil. El borrado completo usa el cliente de servicio, solo en servidor;
  véase M6. Las pruebas de Storage simulan sus tablas y políticas, no el servicio de archivos real.

### M3 · Alta / P0 · Aprobación de otro texto y etiquetas históricas

- **Dónde:** `revisarEtiqueta` y el trigger de `20261025000002_huella_inclusiva.sql`.
- **Cómo se aprovecha:** la acción leía y validaba un texto, pero aprobaba por `id` después de
  que el talento pudiera cambiarlo. Un texto con edad o teléfono recibía la aprobación. Además,
  las filas ligadas al catálogo anteriores al trigger conservaban textos suplantados.
- **Prueba:** `tests/db/etiquetas-revision.test.ts`: una prueba ejecuta la acción real y cambia
  el texto entre lectura y aprobación; otra aplica las migraciones desde antes del trigger con
  una fila histórica falsa. Antes ambas fallaban. El matching sigue excluyendo etiquetas libres
  sin aprobación, comprobado por sus pruebas anteriores.
- **Cómo se arregla:** RPC atómica `revisar_etiqueta`, bloqueo y comparación del texto y capa que
  se vieron en pantalla, incluida la opción de sumar al catálogo. Normalizar las etiquetas históricas.
- **Estado:** corregido en rama, `20261103000003`. La migración corrige texto y capa para que
  coincidan con el `taxonomy_id` ya elegido; no cambia la elección de la persona.

## Pendientes anteriores y defensa del navegador

### M1 · Media, alta al activar SMS · Límite externo de códigos

- **Dónde:** `app/(publico)/entrar/acciones.ts`, `registrar_intento_codigo` y Supabase Auth.
- **Cómo se aprovecha:** la llave pública permite pedir OTP directamente a Auth sin ejecutar el
  límite de Next. Añadir otra comprobación de Next no cierra ese endpoint.
- **Prueba:** lectura de los dos caminos; no hay acceso remoto para certificar las cuotas o el CAPTCHA.
- **Cómo se arregla:** configurar Rate Limits y Attack Protection de Auth según el piloto,
  integrar el token CAPTCHA en la entrada y el reenvío y probar el endpoint directo. Activar
  CAPTCHA sin integrar el token en los formularios bloquearía el ingreso actual.
- **Estado:** **abierto**. Se conserva el límite propio como segunda capa. No se modificó Auth
  remotamente ni se presenta una prueba local como garantía del límite del proveedor.

### M4 · Media · Cabeceras

- **Dónde:** `next.config.ts`, nuevo `lib/privacidad/cabeceras.ts`.
- **Cómo se aprovecha:** sin protección de marcos, otra web podía intentar clickjacking.
- **Prueba:** `tests/unit/cabeceras-seguridad.test.ts` fallaba antes por ausencia de cabeceras.
- **Cómo se arregla:** CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`,
  política de referencia y permisos de cámara, ubicación y micrófono. HSTS en producción.
  Conexiones del navegador limitadas al origen propio y al proyecto Supabase configurado.
- **Estado:** corregido en rama. La CSP permite scripts en línea para la hidratación de Next;
  **no se declara una CSP estricta contra XSS**. Una política con nonces requiere otra adaptación.

### M5 · Media / P0 · Caché privada y salida

- **Dónde:** `app/sw.ts`, `components/layout/formulario-salida.tsx`, middleware.
- **Cómo se aprovecha:** la corrección anterior excluía varias rutas, pero `/aprende`, `/emprende`,
  API y rutas futuras todavía caían en `defaultCache`. La actualización no borraba respuestas
  privadas que ya existían en `pages`, `pages-rsc` o `cross-origin`.
- **Prueba:** `tests/unit/cache-seguridad.test.ts` reproduce la selección de estrategia con el
  service worker real y comprueba la limpieza de cachés antiguas y el orden de limpieza al salir.
- **Cómo se arregla:** lista permitida de recursos estáticos propios y `/sin-conexion`; el resto,
  incluidos RSC y otros dominios, usa `NetworkOnly`. Filtrar también la precaché. Limpiar cachés
  de respuestas al activar la versión nueva y al salir; mantener solo las precachés estáticas.
  Las respuestas y redirecciones protegidas reciben `Cache-Control: private, no-store`.
- **Estado:** corregido en rama. Un dispositivo que no descargue la versión nueva conserva su
  trabajador antiguo: verificar actualización, salida y uso sin conexión en celular antes del piloto.

### M6 · Media / P0 · Borrado de archivos

- **Dónde:** `borrarCuenta` y `lib/privacidad/borrar-archivos.ts`.
- **Cómo se aprovecha:** la eliminación anterior ignoraba errores de Storage, omitía audio y
  autorizaciones y borraba el perfil perdiendo sus referencias. El bloqueo correcto de objetos
  de A2 exige además realizar el borrado completo con el cliente de servicio.
- **Prueba:** `tests/unit/borrado-seguridad.test.ts`: sin llave, antes se borraba el perfil y se
  redirigía; ahora se conserva el perfil y se solicita ayuda. También se comprueba el fallo de
  Storage, la limpieza paginada de los cuatro buckets y subcarpetas, sin tocar otro perfil.
- **Cómo se arregla:** verificar la sesión y obtener su perfil en servidor; limpiar exclusivamente
  sus carpetas con el cliente privilegiado antes de eliminar el perfil. Ante errores, conservar
  el perfil para reintentar; si falla borrar Auth después, dejar solicitud para el equipo.
- **Estado:** mejorado en rama. Storage, Postgres y Auth no son una transacción distribuida:
  faltan ensayo real de reintentos y conciliación de huérfanos, especialmente con subidas simultáneas.

## Lo que se comprobó y sigue protegido

- Los registros públicos solo conceden talento o empresa; `user_roles` no permite autoasignarse
  curador/admin. Una cuenta admin sin `aal2` no cambia roles ni obtiene `panel_equipo` o `resumen_equipo`.
- Lectura, escritura y RPC de organizaciones se probaron también con rol `lectura` y otra empresa.
  No pueden escribir ni invitar fuera de su permiso; retirar a un miembro le quita el acceso.
- `talent_payout_preferences` solo tiene `talent_id`, `metodo`, `celular`, `actualizado_en`.
  No existe columna de cuenta bancaria ni campo de cuenta en el formulario; el celular solo se
  admite para Nequi/Daviplata, con formato colombiano. La acción usa su perfil de sesión y
  selecciona columnas explícitas; la descarga de datos es la del titular. No hay cobros activos.
- Las pruebas existentes de edad, matching, vistas anónimas, RLS, empresas verificadas y
  evidencias siguen en la suite completa. Ninguna migración aplicada se editó ni se añadió
  lectura empresarial de `talent_private`, bienestar o preferencias de pago.
- Las nuevas funciones privilegiadas tienen `search_path` fijo y permisos explícitos. No se
  introdujeron secretos de cliente ni registros con contenido privado.

## Asesores de Supabase y dependencias

**Asesores: no ejecutados.** El proyecto de pruebas documentado es `grmafhdgtgjyryopykdp`.
No hay herramienta de Supabase disponible, `SUPABASE_ACCESS_TOKEN` ni credencial CLI guardada.
No se usó una llave pública como sustituto de acceso administrativo ni se consultó producción.
Queda pendiente ejecutar Security Advisor en pruebas y adjuntar los avisos y su comparación con
el 21 de octubre. No se afirma que el asesor esté limpio.

`npm audit --omit=dev --json` informó **8 paquetes afectados: 5 altos, 3 moderados, 0 críticos**.
Incluye avisos de Zod, PostCSS, glob y minimatch, propagados por Next y Serwist. Referencias:
[Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
[PostCSS](https://github.com/advisories/GHSA-qx2v-qp2m-jg93),
[source maps](https://github.com/advisories/GHSA-6g55-p6wh-862q),
[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) y
[minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).
No se reprodujo su explotación en Kánna; la severidad viene del asesor npm. Las soluciones
automáticas propuestas incluyen cambios mayores de Next/Serwist: no se ejecutó `audit fix --force`.
**B1 sigue abierto**, con el detalle actualizado, y requiere una actualización de dependencias
con validación propia. No se mantiene la afirmación antigua de que todos los avisos son solo de construcción.

## Comprobaciones y límites

- Las pruebas nuevas se ejecutaron antes de corregir: fallaron los permisos de reportes,
  confirmaciones, lectura de pagos, retención, Storage, carreras de revisión, normalización
  histórica, contenido oculto, voz remota, actividad falsificable y cabeceras ausentes.
- Se ejecutaron también rutas válidas para evitar cerrar el acceso legítimo: aceptar invitación
  confirmada, reclamar perfil con celular confirmado, revisar evidencia vigente y sumar etiquetas.
- Resultado final de `npm test`: **587 pruebas aprobadas en 39 archivos**.
- `npm run build`: aprobado con fuentes locales reales, sin simulación de fuentes.
- `npm run lint`: aprobado. El build incluye comprobación de tipos.
- Servidor local de producción: `/`, `/equipo/entrar` y `/mi-perfil/pagos` respondieron 200
  con CSP, protección de marcos y `nosniff`; no se publicó un despliegue para comprobarlo.
- La primera compilación falló al descargar Google Fonts por restricciones de red. Se conservaron
  las cuatro familias existentes mediante `next/font/local`, con archivos originales y licencias
  en `app/fonts/`; la compilación ya no depende de Google Fonts.
- Las pruebas de base usan PGlite en memoria. No sustituyen un recorrido con Auth, MFA y Storage
  reales, pruebas de concurrencia entre conexiones, un celular real ni el asesor remoto.
- No se inspeccionaron datos reales ni se certifica ausencia de explotación previa. La normalización
  histórica corrige el catálogo; las etiquetas libres y evidencias ya aprobadas necesitan revisión
  humana si hay indicios de que se usaron las carreras descritas.
- Antes de publicar: configurar el secreto de actividad; revisar confirmaciones, cuotas y CAPTCHA
  de Auth; ejecutar los asesores y el recorrido en pruebas. La publicación la realiza el responsable.

## Migraciones nuevas para aplicar, en orden

Prerequisito: migraciones de la base revisada hasta `20261103000001_panel_y_retencion.sql`.
Las tres siguientes están **pendientes de aplicar por el responsable**:

1. `20261103000002_seguridad_acceso.sql` — RPC privadas, invitaciones confirmadas, administración
   de miembros, titular de organización, reclamación de perfiles y RLS de preferencias de pago.
2. `20261103000003_integridad_evidencias_etiquetas.sql` — objetos de evidencia protegidos,
   revisiones atómicas con versión y normalización histórica de etiquetas.
3. `20261103000004_retencion_por_cierre.sql` — fechas de terminación y limpieza desde cierre,
   envío, cancelación o vencimiento, conservando la tarea cron existente.
