# Brief para Claude Code v2 — Plataforma Senior

Oct 19, 2026 · @Mateo

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
| talent_offers | id, talent_id, tipo (horas, proyecto, mentoría, fraccional, medio tiempo, experiencia), horas por semana, modalidad, tarifa esperada | Talento, equipo, empresa |
| stories | id, talent_id, texto o transcripción, origen (escrito, dictado, llamada, gestor) | Talento, equipo |
| footprint_tags | id, talent_id, story_id, capa, etiqueta, confirmada, evidencia | Empresa ve solo las confirmadas |
| taxonomy | id, capa, etiqueta canónica, sinónimos, sector | Pública |
| companies | id, nombre, NIT, sector, tamaño, ciudad, contacto | Empresa propia, equipo |
| needs | id, company_id, problema (texto), formatos, duración, modalidad, presupuesto | Empresa propia, equipo |
| need_requirements | id, need_id, capa, etiqueta, obligatorio o deseable | Empresa propia, equipo |
| connections | id, company_id, talent_id, origen (exploración, problema), need_id, puntaje y desglose, razón del curador, estado | Según estado |
| experiences | id, talent_id, nombre, propósito, temas, para quién, beneficios, momentos, formato (territorio, sede), lugar, duración, grupo mín/máx, precio desde, % para la sabedora, fotos, estado | Pública cuando está publicada |
| experience_requests | id, experience_id, company_id, formato elegido, personas, mes, nota, estado, valor cotizado | Empresa propia, equipo |
| impact_records | id, experience_request_id o connection_id, personas impactadas, horas, pago a la persona | Equipo; empresa ve su reporte |
| help_requests | id, user_id, canal (chat, llamada, botón), motivo, estado, atendido_por | Equipo |
| call_sessions | id, user_id, tipo (registro, huella, ayuda), inicio, duración, transcripción, consentimiento, escalada a humano | Equipo |
| entrepreneurship_diagnostics | id, talent_id, etapa, necesidades, quiere asesoría | Talento, equipo |

Estados de una conexión: propuesta → elegida por curador o pedida por la empresa → enviada al talento → interesa o descarta → visible para la empresa → la empresa quiere conocer → conexión abierta → cerrada con evaluación.

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
| /oportunidades | Oportunidades | Conexiones propuestas; “Me interesa” |
| /mi-perfil | Nueva | Ver y editar perfil, ofertas y visibilidad; qué empresas lo buscaron |
| /aprende, /emprende | Aprende y Emprende | Catálogo filtrable; diagnóstico y ruta |
| /ayuda | Ayuda | Chat, “Llámame”, WhatsApp del equipo, guía |

Empresa (escritorio)

| Ruta | Pantalla |
|---|---|
| /empresa/explorar | Explorar perfiles, filtrados por forma de contratar |
| /empresa/perfil/[id] | Nueva: ficha de perfil (anónima si es reservado) con sus formas de contratar |
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

### Matching versión 1

Puntaje por reglas en el servidor sobre etiquetas confirmadas, con pesos en una tabla de configuración. Se usa cuando la empresa busca por un problema; al explorar perfiles se ordena por coincidencia con lo que la empresa escribió en el buscador.

| Componente | Peso |
|---|---|
| Situaciones vividas | 30 % |
| Saber del oficio y normas | 15 % |
| Contexto y escala | 15 % |
| Formato y disponibilidad (filtro duro) | 15 % |
| Confiabilidad y evidencia | 10 % |
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
- Perfil y huella: perfil en 3 pasos con visibilidad, ofertas, historia escrita o dictada, extracción con IA, confirmación de etiquetas, taxonomía semilla y /mi-perfil. Listo cuando una historia real produce etiquetas que la persona reconoce.
- Empresa y conexiones: explorar perfiles, ficha de perfil, buscar por un problema, puntaje, panel de curaduría, oportunidades del talento y procesos de la empresa. Listo cuando un caso va de búsqueda a conexión aceptada.
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
Vamos a construir el MVP de una plataforma para talento de 45 años o más en Colombia.Lee docs/brief.md completo antes de escribir código y mira las capturas en docs/pantallas/.1. Crea un CLAUDE.md con la sección "Reglas que no se negocian" del brief.2. Revisa qué skills tienes disponibles (frontend-design, plataforma-senior) y úsalas al diseñar pantallas.3. Propón la estructura de carpetas, las migraciones de la base de datos y tus preguntas.4. Cuando las apruebe, construye el hito 1 y dime cómo probarlo en mi celular.
```

Hitos siguientes

```
Hito 2: construye acceso y roles según docs/brief.md. Incluye pruebas de que unaempresa no puede leer datos de talento ni la fecha de nacimiento.
```

```
Hito 3: construye perfil, visibilidad, ofertas y huella de experiencia según el brief.Muéstrame el prompt de extracción antes de conectarlo a la API de Claude.
```

```
Hito 4: construye el lado empresa (explorar, ficha de perfil, buscar por un problema),el puntaje y el panel de curaduría. Agrega un test que falle si la edad entra al matching.
```

```
Hito 5: construye experiencias con saberes, registro asistido del gestor, chat de ayuda,"Llámame" con atención humana, Aprende y Emprende. Carga la Ceremonia del cuidado como borrador.
```

```
Hito 6: integra el agente de voz de ElevenLabs con Twilio siguiendo la sección"Acompañante" del brief. Empieza por el guion de registro y el escalado a humano.
```

```
Hito 7: haz la revisión de accesibilidad WCAG 2.2 AA, seguridad y analítica,y dame una lista de lo que falta para abrir el piloto.
```
