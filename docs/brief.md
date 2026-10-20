# Brief para Claude Code v2 — Plataforma Senior

Oct 19, 2026 · @Mateo

Actualizado el 20 de octubre de 2026: se incorporan los vacíos A1 a A5 del análisis de
competencia (`docs/analisis-competencia.md`). Son avisos al talento por SMS, verificación de
empresas y antifraude, evidencia del perfil, la conversación de una hora como forma de contratar
y la guía de tarifas. Afectan el alcance, el modelo de datos, las reglas y los hitos 3 y 4.

## Cómo usar este documento

Este brief reemplaza al anterior y es la única fuente para construir el MVP en Claude Code. Claude Code no ve las conversaciones de diseño: todo lo que debe saber está aquí.

- Expórtalo a Markdown desde el menú del documento.
- Crea el repositorio (por ejemplo, plataforma-senior) y guarda el archivo como docs/brief.md.
- Abre Claude Code en esa carpeta y pega el primer mensaje de la última sección. Claude Code creará un CLAUDE.md con las reglas para todas las sesiones siguientes.
- Avanza un hito a la vez. Al terminar cada uno, pruébalo en un celular real antes de pedir el siguiente.
- Ten listas las cuentas antes del hito 2: Supabase, Vercel, Twilio (Verify y número de voz), Resend con dominio verificado, API de Claude y, para el hito del agente de voz, ElevenLabs. Las llaves van como variables de entorno, nunca en el código ni pegadas en el chat.

Referencias visuales: el lienzo de wireframes y el prototipo para celular. Claude Code no puede abrir estos enlaces: toma capturas de las pantallas y guárdalas en docs/pantallas/ para que las use como referencia.

## Qué construimos y alcance del MVP

Una web progresiva (PWA), primero para celular, que conecta a personas de 45 años o más con empresas. La plataforma gira alrededor del perfil, no de la vacante: cada persona muestra lo que ya resolvió (su huella de experiencia) y cómo se le puede contratar. Las empresas exploran perfiles, buscan por un problema o contratan experiencias guiadas por sabedoras y sabedores del campo. Es para un piloto de 12 meses en una ciudad y su territorio.

| Entra en el MVP | Queda para después |
|---|---|
| Registro con código por SMS o correo, sin contraseña | App nativa y notificaciones push |
| Perfil, huella de experiencia por historias (escritas, dictadas o por llamada) y formas de contratar | Matching que se ajusta solo con datos |
| Visibilidad reservada o visible, elegida por la persona | Pagos dentro de la plataforma |
| Empresa: explorar perfiles, buscar por un problema, ver sugeridos, conectar | Integración con la API de WhatsApp Business |
| Experiencias con saberes: catálogo, ficha y solicitud de cotización | Vitrina pública de emprendimientos |
| Rol de gestor territorial: registra personas en su nombre | Plataforma propia de cursos con certificados |
| Panel de curaduría, ayuda y solicitudes | Agenda automática con Vasees |
| Acompañante: chat, “Llámame” y agente de voz (hito 6) | Agente de voz para empresas |
| Aprende (catálogo enlazado) y Emprende (diagnóstico y ruta) |  |
| Avisos al talento por SMS cuando llega una oportunidad (A1) |  |
| Verificación de empresas, avisos antifraude y botón para reportar (A2) |  |
| Evidencia del perfil: referencia, fotos o documentos del trabajo y evaluaciones (A3) |  |
| "Conversación de una hora" como forma de contratar (A4) y guía de tarifas (A5) |  |

## Reglas que no se negocian

Van al CLAUDE.md del repositorio y aplican a todo el código.

- La edad nunca se muestra a empresas ni entra al matching. Fecha de nacimiento, foto, año de graduación y estado de pensión no son entradas del cálculo; un test automatizado falla si aparecen.
- Perfil primero. No existe el concepto de “vacante” en la interfaz: hay perfiles, problemas y experiencias.
- La persona decide su visibilidad. Reservado: la empresa ve huella y oficio, sin nombre ni foto hasta la doble aceptación. Visible: nombre, foto e historia.
- Accesibilidad WCAG 2.2 AA. Letra base de 18 px o más, botones de 56 px de alto, una acción principal por pantalla, nada comunicado solo con color.
- Español sencillo de Colombia. Nunca “adulto mayor”, “tercera edad” ni “abuelos” en la interfaz; sí “talento con trayectoria”.
- Siempre hay una salida humana. El botón de ayuda está en todas las pantallas y el agente pasa a una persona cuando no entiende o se lo piden.
- Reglas de acceso por fila (RLS) desde el primer día y llaves de API solo en el servidor.
- Marca en tokens. Colores y tipografía en variables: el brandbook llega después. Mientras tanto, fuente Atkinson Hyperlegible y escala de grises como en los wireframes.
- Solo empresas verificadas llegan al talento. Una empresa sin NIT verificado puede explorar, pero no pedir conexiones ni aparecer en las oportunidades. Cada oportunidad y cada SMS recuerdan que nadie de la plataforma ni de una empresa le va a pedir dinero.

## Stack recomendado

Un stack común y bien documentado; Claude Code puede proponer cambios si los justifica antes de programar.

| Capa | Elección | Para qué |
|---|---|---|
| Aplicación web | Next.js con TypeScript, como PWA | Una sola base para celular y escritorio |
| Estilos y componentes | Tailwind CSS con componentes accesibles (Radix o shadcn/ui) | Construir rápido y vestir con el brandbook después |
| Datos y acceso | Supabase: Postgres, Auth, Storage, RLS | Usuarios, perfiles, fotos, reglas por rol |
| Código por SMS | Twilio Verify conectado a Supabase Auth | Entrada sin contraseña por celular |
| Correo | Resend (SMTP de Supabase Auth y avisos) | Códigos por correo y notificaciones |
| IA | API de Claude con salida JSON estructurada | Historias a huella; problemas a requisitos; chat de ayuda |
| Agente de voz | ElevenLabs Agents con número de Twilio | Llamadas guiadas salientes y línea de ayuda |
| Dictado en la web | Web Speech API del navegador | Contar la historia hablando, sin costo en v1 |
| Alojamiento | Vercel (web) y Supabase (datos) | Despliegue sencillo |
| Analítica | PostHog o Plausible, sin datos sensibles | Tiempo de registro, abandono, uso de ayuda |

Pendiente de validar: costos mensuales con el volumen del piloto (SMS, minutos de voz, llamadas a la IA) y que la región de los servidores cumpla la Ley 1581 para transferencia internacional de datos.

## Modelo de datos

Postgres con RLS en cada tabla. La fecha de nacimiento vive aparte y solo la lee el equipo; las empresas consultan vistas anónimas, nunca las tablas de talento directamente.

| Tabla | Campos principales | Quién la lee |
|---|---|---|
| users | id, rol (talento, empresa, curador, gestor, admin), teléfono o correo | Supabase Auth |
| talent_profiles | user_id, nombre, ciudad o vereda, resumen, visibilidad (reservado/visible), foto, estado, registrado_por (gestor) | Talento, equipo; empresa según visibilidad |
| talent_private | user_id, fecha de nacimiento, autorización de datos (fecha y versión), pensión (opcional) | Solo equipo |
| talent_offers | id, talent_id, tipo (conversación, horas, proyecto, mentoría, fraccional, medio tiempo, experiencia), horas por semana, modalidad, tarifa esperada, quiere orientación de tarifa | Talento, equipo, empresa |
| rate_guides | id, tipo de oferta, unidad (hora, conversación, mes, proyecto), rango mínimo y máximo, fuente, fecha de revisión | Pública; la edita el equipo |
| evidence | id, talent_id, tipo (referencia, foto o documento, evaluación), archivo o contacto, estado (pendiente, verificada, rechazada), verificada_por, autorizada para empresas | Talento, equipo; empresa solo las verificadas y autorizadas, por vista |
| stories | id, talent_id, texto o transcripción, origen (escrito, dictado, llamada, gestor) | Talento, equipo |
| footprint_tags | id, talent_id, story_id, capa, etiqueta, confirmada, evidencia | Empresa ve solo las confirmadas |
| taxonomy | id, capa, etiqueta canónica, sinónimos, sector | Pública |
| companies | id, nombre, NIT, sector, tamaño, ciudad, contacto, verificada (fecha, fuente, verificada_por), estado (activa, pausada por reporte) | Empresa propia, equipo; el talento ve nombre y sello cuando la conexión le llega |
| company_reports | id, company_id, connection_id, reportado_por, motivo, estado, resuelto_por | Equipo; quien reporta ve el suyo |
| notifications | id, user_id, canal (SMS, correo), plantilla, connection_id, enviado, entregado, respondido | Equipo |
| needs | id, company_id, problema (texto), formatos, duración, modalidad, presupuesto | Empresa propia, equipo |
| need_requirements | id, need_id, capa, etiqueta, obligatorio o deseable | Empresa propia, equipo |
| connections | id, company_id, talent_id, origen (exploración, problema), need_id, puntaje y desglose, razón del curador, estado, evaluación de la empresa y del talento al cerrar | Según estado |
| experiences | id, talent_id, nombre, propósito, temas, para quién, beneficios, momentos, formato (territorio, sede), lugar, duración, grupo mín/máx, precio desde, % para la sabedora, fotos, estado | Pública cuando está publicada |
| experience_requests | id, experience_id, company_id, formato elegido, personas, mes, nota, estado, valor cotizado | Empresa propia, equipo |
| impact_records | id, experience_request_id o connection_id, personas impactadas, horas, pago a la persona | Equipo; empresa ve su reporte |
| help_requests | id, user_id, canal (chat, llamada, botón, seguimiento de aviso, orientación de tarifa), motivo, estado, atendido_por | Equipo |
| call_sessions | id, user_id, tipo (registro, huella, ayuda), inicio, duración, transcripción, consentimiento, escalada a humano | Equipo |
| entrepreneurship_diagnostics | id, talent_id, etapa, necesidades, quiere asesoría | Talento, equipo |

Estados de una conexión: propuesta → elegida por curador o pedida por la empresa → enviada al talento → interesa o descarta → visible para la empresa → la empresa quiere conocer → conexión abierta → cerrada con evaluación. En cualquier momento puede pasar a "pausada por reporte" si el talento reporta a la empresa. Solo pasa de "elegida" a "enviada al talento" si la empresa está verificada.

Estados de una solicitud de experiencia: recibida → cotizada → confirmada → realizada → reporte de impacto enviado.

## Pantallas y rutas

Cada ruta corresponde a una pantalla del lienzo o del prototipo; los textos y el comportamiento se toman de allí. Las marcadas “nueva” no tienen wireframe aún: Claude Code propone el diseño siguiendo el estilo de las demás.

Talento (celular)

| Ruta | Pantalla | Nota |
|---|---|---|
| /entrar, /entrar/codigo | Registro y código | Celular o correo, sin contraseña |
| /perfil/nuevo | Perfil en 3 pasos | Paso 3 suma la elección de visibilidad |
| /huella | Huella de experiencia | Escribir, dictar o pedir que lo llamen |
| /inicio | Inicio | Siguiente paso, oportunidades, Aprende |
| /oportunidades | Oportunidades | Conexiones propuestas; “Me interesa”; sello de empresa verificada, aviso antifraude y “Reportar esta empresa” |
| /mi-perfil | Nueva | Ver y editar perfil, ofertas, tarifas y visibilidad; agregar evidencias; qué empresas lo buscaron |
| /aprende, /emprende | Aprende y Emprende | Catálogo filtrable; diagnóstico y ruta |
| /ayuda | Ayuda | Chat, “Llámame”, WhatsApp del equipo, guía |

Empresa (escritorio)

| Ruta | Pantalla |
|---|---|
| /empresa/explorar | Explorar perfiles, filtrados por forma de contratar |
| /empresa/perfil/[id] | Nueva: ficha de perfil (anónima si es reservado) con sus formas de contratar, rango de tarifa y evidencias verificadas |
| /empresa/experiencias | Catálogo de experiencias con saberes |
| /empresa/experiencias/[slug] | Ficha de experiencia y solicitud de cotización |
| /empresa/problema/nuevo | Buscar por un problema |
| /empresa/problema/[id] | Talento sugerido para ese problema |
| /empresa/procesos | Nueva: conexiones y solicitudes con su estado |

Equipo y gestor

| Ruta | Pantalla | Rol |
|---|---|---|
| /equipo | Panel de curaduría | Curador, admin |
| /equipo/problema/[id] | Nueva: revisar 10 propuestos y elegir 5 | Curador |
| /equipo/experiencias | Nueva: crear y publicar experiencias, gestionar solicitudes | Admin |
| /equipo/ayuda | Nueva: solicitudes de ayuda y llamadas escaladas | Curador |
| /equipo/empresas | Nueva: verificar empresas (NIT en RUES) y resolver reportes | Curador, admin |
| /equipo/evidencias | Nueva: llamar referencias y aprobar fotos o documentos; editar la guía de tarifas | Curador |
| /gestor/registrar | Nueva: registro asistido en campo | Gestor |

Registro asistido (gestor): pensado para celular y conexión intermitente. El gestor crea el perfil en nombre de la persona, graba o escribe su historia, toma la foto, registra la autorización de datos (firma en pantalla o audio de aceptación) y guarda un borrador si no hay señal. La persona recibe luego un SMS con su código para entrar, si tiene celular.

## Registro, huella de experiencia y matching

### Registro sin contraseña

- La persona elige celular (por defecto) o correo; el celular se normaliza a +57.
- Código de 6 números por SMS (Twilio Verify) o correo (Resend), válido 10 minutos, con autocompletado (autocomplete="one-time-code").
- Reenvío después de 45 segundos; máximo 5 intentos por hora por número, con mensaje claro y acceso a ayuda.
- Primera vez: perfil en 3 pasos y luego huella. Ya registrado: inicio.
- Sesión de 90 días en el dispositivo. El SMS dice de dónde viene: “[MARCA]: tu código es 123456. No lo compartas con nadie.”
- Requisito de entrada: 45 años o más, o 20+ años de experiencia u oficio. Si no cumple, mensaje amable y lista de espera.

### Huella de experiencia

La persona cuenta un problema difícil que resolvió (escrito, dictado, por llamada o con el gestor). El servidor envía la historia a la API de Claude con la taxonomía y un esquema JSON obligatorio; las etiquetas llegan sin confirmar y la persona quita las que no son suyas. Etiquetas nuevas fuera de la taxonomía van a revisión del equipo.

```
{  "situaciones": ["Apertura de una planta nueva"],  "contexto": ["Empresa familiar", "Alimentos", "Antioquia"],  "escala": ["Equipo de 40 personas"],  "oficio": ["Producción de alimentos"],  "normas": ["INVIMA", "SG-SST"],  "transferir": ["Formó a los supervisores"],  "dudas": ["¿En qué año fue?"]}
```

Reglas del prompt: extraer solo lo dicho, nunca inventar cifras ni normas; nunca inferir edad, salud ni estado civil; preferir etiquetas canónicas; español sencillo, máximo 6 palabras por etiqueta. El mismo contrato traduce el problema de una empresa en requisitos obligatorios y deseables.

### Formas de contratar y tarifas (A4 y A5)

- Nueva forma de contratar: **conversación**, de 1 a 2 horas, para que la empresa consulte un problema concreto antes de comprometerse con un proyecto. Es la primera opción de la lista en el paso 2 del perfil y en los filtros de la empresa. Se paga por fuera de la plataforma, como las experiencias.
- Al poner su tarifa, la persona ve un rango orientativo para esa forma de contratar (tabla `rate_guides`). El equipo define y revisa los valores antes del piloto: la plataforma no inventa cifras. Puede elegir "Prefiero que el equipo me oriente"; en ese caso se crea una solicitud de ayuda.
- La empresa ve el rango de la persona, nunca un número exacto, hasta que la conexión está abierta.

### Evidencia y confiabilidad (A3)

El componente "Confiabilidad y evidencia" del matching (10 %) sale solo de tres fuentes:

| Fuente | Cómo se obtiene | Aporte al componente |
|---|---|---|
| Referencia verificada | La persona (o el gestor) deja nombre y teléfono de alguien que conoce su trabajo; el equipo llama y registra una línea | 40 % |
| Foto o documento del trabajo | La persona o el gestor lo sube; el equipo lo aprueba | 30 % |
| Evaluaciones de conexiones cerradas | Promedio de la evaluación de la empresa al cerrar | 30 % |

- Una persona nueva sin evidencias no queda fuera: el componente se calcula sobre lo que hay, y el curador ve "Sin evidencias todavía" en vez de un cero.
- La empresa ve una evidencia solo si está verificada y la persona la autorizó. Al aprobar una evidencia, el equipo revisa que no muestre la edad: fechas de grado, años de servicio o fotos de documentos de identidad.
- Una referencia nunca se comparte con la empresa: solo la línea que escribió el equipo.

### Avisos al talento (A1)

Sin notificaciones push ni WhatsApp en el MVP, el aviso por SMS es lo que permite que la persona se entere de una oportunidad.

- Cuando una conexión pasa a "enviada al talento", sale un SMS (Twilio Messaging) y, si la persona tiene correo, también un correo (Resend).
- Texto del SMS, sin nombre de empresa (privacidad): “[MARCA]: tiene una oportunidad nueva. Entre a [enlace corto] con su código. Nadie le va a pedir dinero.”
- Solo entre 8 a. m. y 7 p. m., máximo un SMS al día por persona; si hay varias oportunidades, se agrupan.
- Si no hay respuesta en 3 días, se crea una solicitud de ayuda para que alguien del equipo la llame.
- Responder SALIR detiene los avisos; queda registrado en `notifications` y la persona puede activarlos de nuevo desde /mi-perfil.

### Matching versión 1

Puntaje por reglas en el servidor sobre etiquetas confirmadas, con pesos en una tabla de configuración. Se usa cuando la empresa busca por un problema; al explorar perfiles se ordena por coincidencia con lo que la empresa escribió en el buscador.

| Componente | Peso |
|---|---|
| Situaciones vividas | 30 % |
| Saber del oficio y normas | 15 % |
| Contexto y escala | 15 % |
| Formato y disponibilidad (filtro duro) | 15 % |
| Confiabilidad y evidencia (ver "Evidencia y confiabilidad") | 10 % |
| Ubicación y modalidad | 5 % |
| Expectativa económica | 5 % |
| Propósito y cultura (opcional en v1) | 5 % |

Cada conexión guarda el desglose para mostrar “Coincide con tu problema”. El sistema propone 10, el curador deja máximo 5 con una línea de por qué, y nada llega a la empresa sin el “Me interesa” de la persona. Reporte mensual de sesgos por género, rango de edad, región y nivel digital, con datos agregados.

## Experiencias con saberes

Talleres y ceremonias guiados por personas mayores desde su oficio, co-diseñados con la metodología de Vasees, que las empresas contratan para sus equipos. La persona mayor no usa la plataforma: el gestor y el equipo cargan todo por ella.

Flujo

- El gestor registra el perfil visible de la persona con su historia, fotos y autorización.
- El equipo crea la experiencia en /equipo/experiencias: propósito, para quién, beneficios, momentos, formato, lugar, duración, grupo, precio desde y porcentaje para la sabedora. Se publica solo cuando la persona aprobó cómo aparece.
- La empresa ve el catálogo, abre la ficha y pide cotización eligiendo “en el territorio” o “en tu sede”, número de personas, mes y una nota.
- El equipo recibe la solicitud por correo y en el panel, cotiza y confirma fuera de la plataforma (en v1 no hay pagos en línea).
- Después de la experiencia, el equipo registra el impacto (personas, horas, pago a la sabedora) y la empresa recibe su reporte.

Primera experiencia cargada como ejemplo: “Ceremonia del cuidado”. A través del tejido, encarna el cuidado y abre la conversación sobre cómo esa labor ha recaído históricamente en las mujeres y sobre la importancia de que quienes cuidan también sean cuidadas. Pensada para equipos de enfermería y cuidado. Los datos que faltan (nombre y pueblo de la tejedora, duración, grupo, precio, momentos, testimonio) se cargan como borrador hasta que el equipo los complete.

## Acompañante: chat, llamada guiada y agente de voz

La ayuda tiene tres canales y siempre una salida humana. La llamada es la pieza que más rompe la barrera tecnológica: puede registrar a la persona y armar su huella conversando.

| Canal | Qué hace | Hito |
|---|---|---|
| Chat en la web | Responde dudas y guía paso a paso con la API de Claude y las preguntas frecuentes | 5 |
| “Llámame” | La persona deja su número y el horario; en v1 la llama alguien del equipo | 5 |
| Agente de voz | ElevenLabs Agents con número de Twilio: llamada saliente para registro, huella y ayuda; también contesta la línea de ayuda | 6 |
| Persona del equipo | Recibe lo que el chat o el agente escalan, desde /equipo/ayuda | 5 |

### Personalidad del agente

- Nombre: [NOMBRE DEL ASISTENTE], por definir con el brandbook.
- Voz: español colombiano neutro, cálido y pausado; frases cortas; trata de “usted” salvo que la persona pida tutear.
- Actitud: paciente con los silencios y las repeticiones; nunca apura; celebra lo que la persona cuenta sin exagerar.
- Siempre es transparente: se presenta como asistente virtual de [MARCA], nunca finge ser una persona.

### Guion base de la llamada de registro y huella

- Saludo y transparencia: “Buenos días, ¿hablo con [nombre]? Le habla [NOMBRE DEL ASISTENTE], el asistente virtual de [MARCA]. Usted pidió que lo llamáramos para crear su perfil. Antes de seguir: nunca le vamos a pedir códigos, contraseñas ni dinero.”
- Consentimiento: “Esta llamada se transcribe para armar su perfil. ¿Está de acuerdo?” Si dice que no, ofrece que lo llame una persona del equipo y termina.
- Datos básicos: nombre, ciudad o vereda, a qué se ha dedicado.
- La historia: “Cuénteme un problema difícil que le tocó resolver en su trabajo. ¿Qué pasó, qué hizo usted y cómo terminó?” Repregunta una o dos veces para precisar, sin interrogar.
- Formas de trabajar: horas, proyecto, mentoría, talleres; cuántas horas a la semana.
- Fecha de nacimiento: la pide al final, explicando que solo la ve el equipo y que las empresas nunca ven la edad.
- Cierre: resume en voz alta lo que entendió, dice que le llegará un mensaje de texto para revisar su perfil y ofrece el número de ayuda.

### Cuándo pasa a una persona

- La persona lo pide o se nota frustrada o confundida después de dos intentos.
- Menciona una emergencia, un problema de salud, una situación de violencia o un posible fraude.
- Pregunta por pagos, contratos o condiciones de una oportunidad concreta.
- La llamada pasa de [N] minutos sin avanzar.

### Lo que el agente nunca hace

- Pedir códigos, contraseñas, datos bancarios o dinero.
- Prometer un empleo, un ingreso o un plazo.
- Preguntar por salud, estado civil, religión o política.
- Llamar sin que la persona lo haya pedido, o fuera del horario que eligió.
- Llamar desde un número distinto al publicado en la plataforma.

Técnico: cada llamada se guarda en call_sessions con consentimiento, duración y transcripción; la transcripción pasa por la misma extracción de huella; tope de duración por llamada y de llamadas por persona al día para controlar costos.

## Privacidad, seguridad y accesibilidad

Privacidad (Ley 1581 de 2012)

- Autorización expresa de datos al registrarse, por la persona o por el gestor en su nombre, con fecha, versión y medio (pantalla, firma o audio).
- Consentimiento aparte para grabar o transcribir llamadas y para publicar nombre, foto e historia.
- La edad solo la ve el equipo; las empresas ven vistas anónimas según la visibilidad.
- Descargar y borrar los propios datos desde /mi-perfil.
- Revisar que la API de IA y el proveedor de voz no usen los datos para entrenar modelos, y documentarlo en la política.
- Pendiente con abogado: política de tratamiento, registro ante la SIC si aplica y transferencia internacional de datos.

Seguridad

- RLS en todas las tablas y pruebas automatizadas de que una empresa no lee datos fuera de una conexión aceptada.
- Límites de intentos para códigos y para llamadas salientes (costos y abuso).
- Llaves de API solo en el servidor; webhooks de Twilio y ElevenLabs verificados con firma.
- Registro de quién del equipo ve datos privados.

Antifraude (A2)

- Toda empresa se verifica antes de pedir conexiones: el equipo confirma el NIT y el nombre en el RUES y registra fecha, fuente y quién verificó. Mientras tanto la empresa puede explorar, y lo ve explicado en pantalla.
- El talento ve el nombre de la empresa con el sello "Empresa verificada" (ícono y texto, no solo color) en cada oportunidad.
- Aviso fijo en /oportunidades, en cada conexión y en los SMS: nadie de la plataforma ni de una empresa le va a pedir dinero, códigos ni contraseñas, ni pagos por "aportes a salud y pensión" o cursos.
- Botón "Reportar esta empresa" en cada oportunidad y conexión. El reporte pausa las conexiones abiertas con esa empresa y el equipo lo revisa en máximo 2 días hábiles.
- Una empresa con dos reportes confirmados queda pausada para todo el talento.

Accesibilidad (WCAG 2.2 AA)

- Contraste mínimo 4,5:1; nada comunicado solo con color.
- Botones de 56 px de alto en acciones principales, mínimo 44 px en todo lo demás.
- Etiquetas visibles, errores en texto claro y sin límites de tiempo ocultos.
- Funciona con zoom al 200 % y con lector de pantalla en Android e iOS.
- Prueba manual en un Android de gama media antes de cada entrega.

## Plan por hitos

Siete hitos en orden. Cada uno termina con algo que se puede probar en un celular real; no se pasa al siguiente sin probar el anterior.

- Base: proyecto Next.js, Supabase, tokens de diseño, menús de los tres roles y pantallas vacías navegables, despliegue en Vercel. Listo cuando se abre en el celular y se añade a la pantalla de inicio.
- Acceso y roles: entrada con código por SMS y correo, roles (talento, empresa, curador, gestor, admin), RLS y la tabla privada de fecha de nacimiento. Listo cuando una persona entra sola en menos de 2 minutos y una empresa no puede leer datos de talento.
- Perfil y huella: perfil en 3 pasos con visibilidad, ofertas (incluida la conversación de una hora), guía de tarifas, historia escrita o dictada, extracción con IA, confirmación de etiquetas, taxonomía semilla, carga de evidencias y /mi-perfil. Listo cuando una historia real produce etiquetas que la persona reconoce, y la persona elige su tarifa viendo el rango sin pedir ayuda.
- Empresa y conexiones: explorar perfiles, ficha de perfil, buscar por un problema, puntaje con el componente de evidencia, panel de curaduría, verificación de empresas, revisión de evidencias, oportunidades del talento con aviso por SMS, antifraude y reporte, y procesos de la empresa. Listo cuando un caso va de búsqueda a conexión aceptada, la persona se entera por SMS sin entrar a revisar, y una empresa sin verificar no puede llegar al talento.
- Experiencias, ayuda y gestor: catálogo y ficha de experiencias, solicitud de cotización, registro de impacto, registro asistido del gestor, chat de ayuda, “Llámame” con atención humana, Aprende y Emprende. Listo cuando la Ceremonia del cuidado se puede pedir y un gestor registra a alguien sin señal estable.
- Agente de voz: ElevenLabs con número de Twilio, llamada saliente de registro y huella, línea de ayuda, escalado a humano y call_sessions. Listo cuando una persona sin práctica digital termina con su perfil armado por teléfono.
- Listo para el piloto: revisión de accesibilidad AA, analítica, textos legales, pruebas de seguridad y carga de datos iniciales. Listo cuando pasa la revisión y la política de datos está aprobada.

Los hitos 1 y 2 pueden avanzar mientras corren las pruebas con usuarios; del 3 en adelante conviene incorporar esos hallazgos.

## Skills y herramientas para Claude Code

Tu cuenta no tiene hoy ninguna skill ni plugin de diseño o desarrollo web: las instaladas sirven para documentos, hojas de cálculo, presentaciones, navegador e investigación. Para diseñar y construir la plataforma, esto es lo que conviene usar o crear.

| Herramienta | Estado | Para qué la usa Claude Code |
|---|---|---|
| frontend-design | Viene con Claude; en Claude Code, verificar con /skills o /plugin e instalarla si no aparece | Dar a las pantallas una dirección visual cuidada y no genérica |
| Skill propia “plataforma-senior” | Por crear con skill-creator (instalada en tu cuenta) | Guardar las reglas de este brief (accesibilidad, lenguaje, edad, tokens) para que se apliquen en cada sesión y en cada pantalla |
| built-in-browser / chrome-browser | Instaladas | Abrir la web en desarrollo, recorrer los flujos y revisar errores en consola |
| deep-research | Instalada | Investigar proveedores, costos de SMS y voz, o normativa cuando haga falta |
| Conector de Supabase (MCP) | Opcional, por conectar | Crear tablas, reglas RLS y revisar datos sin salir de Claude Code |

Recomendación: antes del hito 1, crear la skill “plataforma-senior” con las secciones “Reglas que no se negocian”, “Pantallas y rutas” y “Acompañante” de este documento. Así el diseño sale coherente aunque se trabaje en muchas sesiones. Se puede crear en este mismo chat y quedará disponible en tu cuenta.

## Mensajes para pegar en Claude Code

Un mensaje para arrancar y uno por hito. Pega el siguiente solo cuando hayas probado el anterior en el celular.

Primer mensaje (arranque y hito 1)

```
Vamos a construir el MVP de una plataforma para talento de 45 años o más en Colombia.
Lee docs/brief.md completo antes de escribir código y mira las capturas en docs/pantallas/.
1. Crea un CLAUDE.md con la sección "Reglas que no se negocian" del brief.
2. Revisa qué skills tienes disponibles (frontend-design, plataforma-senior) y úsalas al diseñar pantallas.
3. Propón la estructura de carpetas, las migraciones de la base de datos y tus preguntas.
4. Cuando las apruebe, construye el hito 1 y dime cómo probarlo en mi celular.
```

Hitos siguientes

```
Hito 2: construye acceso y roles según docs/brief.md. Incluye pruebas de que una
empresa no puede leer datos de talento ni la fecha de nacimiento.
```

```
Hito 3: construye perfil, visibilidad, ofertas (con la conversación de una hora), guía de tarifas,
evidencias y huella de experiencia según el brief. Muéstrame el prompt de extracción antes de
conectarlo a la API de Claude. Los rangos de tarifa quedan vacíos hasta que el equipo los defina.
```

```
Hito 4: construye el lado empresa (explorar, ficha de perfil, buscar por un problema),
el puntaje, el panel de curaduría, la verificación de empresas, el antifraude con reporte y el
aviso por SMS al talento. Agrega un test que falle si la edad entra al matching y otro que falle
si una empresa sin verificar puede pasar una conexión a "enviada al talento".
```

```
Hito 5: construye experiencias con saberes, registro asistido del gestor, chat de ayuda,
"Llámame" con atención humana, Aprende y Emprende. Carga la Ceremonia del cuidado como borrador.
```

```
Hito 6: integra el agente de voz de ElevenLabs con Twilio siguiendo la sección
"Acompañante" del brief. Empieza por el guion de registro y el escalado a humano.
```

```
Hito 7: haz la revisión de accesibilidad WCAG 2.2 AA, seguridad y analítica,
y dame una lista de lo que falta para abrir el piloto.
```
