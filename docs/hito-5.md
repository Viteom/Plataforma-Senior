# Hito 5: experiencias, ayuda y gestor

En `main` desde el 21 oct 2026 (rama `hito-5-experiencias-ayuda`). Todo funciona sin
servicios de pago: no usa la API de Claude, ni SMS, ni correos automáticos. Criterios de listo
del brief:

- [ ] **La Ceremonia del cuidado se puede pedir.** El flujo completo funciona: catálogo, ficha,
      cotización, cotizado, confirmado, realizado e informe de impacto. Lo probé en la base de
      datos y en las pantallas en modo demostración. La Ceremonia está cargada como **borrador**.
      Para que una empresa la vea, el equipo tiene que completar sabedora, duración, grupo,
      precio, momentos y testimonio, anotar la fecha en que la sabedora aprobó el texto y
      publicarla. Falta probarlo con Supabase real.
- [x] **Un gestor registra a alguien sin señal estable.** El registro se guarda en el celular y se
      envía solo cuando vuelve la señal. Lo probé cortando la conexión en el navegador. Falta
      probarlo en un celular real, en campo.

## Experiencias con saberes

- **Empresa** (`/empresa/experiencias`): ve el catálogo y la ficha (propósito, para quién,
  beneficios, momentos, formatos, duración, grupo, precio desde y testimonio). Pide cotización
  con formato, número de personas, mes y una nota. Solo una empresa con cuenta puede pedirla. El
  estado, el valor cotizado y el informe de impacto aparecen en `/empresa/procesos`.
- **Equipo** (`/equipo/experiencias`): crea y edita experiencias. Ve qué le falta a cada una para
  publicarse, publica o pausa, y lleva cada solicitud: recibida → cotizada (con valor) →
  confirmada → realizada → informe de impacto enviado.
- **Regla en la base:** una experiencia no puede quedar publicada sin la fecha de aprobación de
  la sabedora. La empresa solo ve experiencias publicadas y solo sus propias solicitudes. Tampoco
  puede crear una solicitud con valor ni con otro estado que «recibida».

## Registro asistido del gestor (`/gestor/registrar`)

1. **Datos:** nombre, municipio, oficio, celular y visibilidad.
2. **Historia:** escrita o grabada en audio. El audio queda para que el equipo lo transcriba,
   porque la transcripción automática es de pago.
3. **Foto:** se salta si la persona eligió ser reservada.
4. **Autorización:** firma en la pantalla o autorización grabada en audio.

Cada registro se guarda primero en el celular (IndexedDB). Con señal se envía de inmediato; sin
señal queda en «Esperando señal» y sale solo cuando vuelve. El gestor puede corregir, borrar o
enviar a mano los pendientes. Reenviar no duplica nada: el identificador lo crea el celular. Los
archivos van a almacenamiento privado (`autorizaciones`, `historias`, `fotos`).

**Cuando la persona entra después** con el celular que anotó el gestor, el perfil pasa a su
cuenta (`reclamar_perfil`). Así no hace falta enviarle un SMS al registrarla.

El celular y la autorización van a `talent_private`, que solo leen curador y admin.

## Ayuda (`/ayuda`, en todas las pantallas)

- **«Llámeme» sin cuenta:** la persona deja su celular y elige mañana o tarde. Llega a
  `/equipo/ayuda` y alguien del equipo la llama. Hay un tope de 3 pedidos al día por número, y
  nadie sin cuenta puede leer los pedidos.
- **Chat sin IA:** contesta con respuestas preparadas por el equipo (`lib/ayuda/respuestas.ts`) y
  enlaza a la pantalla que sirve.
  - **Temas de riesgo** (emergencia, violencia, fraude, salud, pagos): no reciben respuesta
    automática. Pasan al equipo y, en una emergencia, el chat indica el 123.
  - **Si no entiende dos veces seguidas**, ofrece que lo llamen.
  - **Cuando se encienda la IA**, se reemplaza `responder()` y lo demás queda igual.
- **WhatsApp del equipo:** sale de `NEXT_PUBLIC_WHATSAPP_EQUIPO`. Mientras no exista, dice
  «Número por definir».
- **Guía paso a paso** (`/ayuda/guia`): cómo usar la plataforma y cómo reconocer un fraude.

## Aprende y Emprende

- **Aprende** (`/aprende`): cursos gratuitos de otras entidades, filtrados por tema. Viene
  cargado Sofía Plus del SENA. El equipo agrega más en la tabla `courses`.
- **Emprende** (`/emprende`): la persona dice en qué va su negocio y con qué necesita ayuda. Recibe
  una ruta de pasos con enlaces a los cursos de cada tema. Si pide asesoría, se crea una
  solicitud para el equipo. Sin cuenta igual ve la ruta; solo no se guarda.

## Errores que encontré y corregí al probar

- **«Llámeme» sin cuenta:** devolvía una lista vacía en vez de negar el acceso. Ahora se niega del
  todo.
- **Editor de experiencias:** el botón de guardar desaparecía después de guardar una vez.
- **Mis procesos:** los enlaces a perfiles medían 30 px de alto. Ahora miden 44.
- **Chat:** decía que «Llámeme» estaba abajo, pero está arriba.

## Pruebas

318 en total (269 al cerrar el hito 4). Las nuevas del hito 5:

- **Base de datos (15):** experiencias y regla de publicación, cotizaciones, impacto, «Llámeme»
  sin cuenta y su tope, registro del gestor, reclamar el perfil, Aprende y Emprende.
- **Chat (14):** respuestas, temas de riesgo y límites.
- **Ruta de Emprende (4).**

## Pendiente

- Probar con Supabase real. El almacenamiento de archivos solo existe allí.
- Probar el registro del gestor en un celular real, en campo.
- Completar y publicar la Ceremonia del cuidado (datos de la sabedora y su aprobación).
- Subir fotos de las experiencias desde el editor. Hoy se escriben las direcciones.
- Transcribir las historias grabadas: lo hace el equipo; con IA, cuando se decida pagarla.
- Chat con la API de Claude, cuando se decida pagarla.
- Número de WhatsApp del equipo.
- Que el equipo revise y amplíe los cursos de Aprende.
