// Textos de la web informativa. Tuteo (brandbook), nada de edades ni de promesas de contratación.
// Los perfiles son ejemplos de redacción sobre fotos de banco (Pexels, uso libre): no describen a esas personas y
// las fotografías son ilustrativas: no identifican a talento de Kánna.

export const MENU_WEB = [
  { href: "/talento", etiqueta: "Talento" },
  { href: "/organizaciones", etiqueta: "Organizaciones" },
  { href: "/campo", etiqueta: "Talento del campo" },
  { href: "/ayuda", etiqueta: "Ayuda" },
] as const;

export type Retrato = { src: string; ancho: number; alto: number; alt: string };

export const RETRATOS = {
  libro: { src: "/web/retrato-libro.webp", ancho: 900, alto: 1350, alt: "Fotografía de un profesor de barba canosa con un portátil en un auditorio" },
  sombrero: { src: "/web/retrato-sombrero.webp", ancho: 900, alto: 599, alt: "Fotografía de un artesano con gafas que sonríe en su taller" },
  azul: { src: "/web/retrato-azul.webp", ancho: 900, alto: 599, alt: "Fotografía de una enfermera con uniforme azul que mira de frente" },
  rojo: { src: "/web/retrato-rojo.webp", ancho: 900, alto: 897, alt: "Fotografía de una ejecutiva de cabello canoso que sonríe en una reunión" },
  cocina: { src: "/web/retrato-cocina.webp", ancho: 900, alto: 1350, alt: "Fotografía de un chef de barba canosa con una olla en la mano" },
} satisfies Record<string, Retrato>;

// Perfiles de ejemplo para la galería de oficios: oficio, capacidades y forma de trabajar.
export const PERFILES_MUESTRA = [
  { retrato: RETRATOS.cocina, oficio: "Cocina de producción", capacidades: ["Producción por lotes", "Formación de aprendices"], lugar: "Medellín", forma: "Por proyecto" },
  { retrato: RETRATOS.rojo, oficio: "Contabilidad y finanzas", capacidades: ["Salida de crisis de caja", "NIIF para pymes"], lugar: "Bogotá", forma: "Conversación de una hora" },
  { retrato: RETRATOS.libro, oficio: "Docencia y bibliotecas", capacidades: ["Promoción de lectura", "Formación de docentes"], lugar: "Manizales", forma: "Mentoría" },
  { retrato: RETRATOS.azul, oficio: "Enfermería", capacidades: ["Cuidado en casa", "Formación de cuidadores"], lugar: "Cali", forma: "Por horas" },
  { retrato: RETRATOS.sombrero, oficio: "Ebanistería", capacidades: ["Organización de taller", "Restauración de muebles"], lugar: "Pasto", forma: "Por proyecto" },
];

export const OFICIOS = [
  "Ebanistería",
  "Contabilidad",
  "Enfermería",
  "Tejido",
  "Cocina",
  "Mantenimiento industrial",
  "Docencia",
  "Agricultura",
  "Construcción",
  "Costura",
  "Mecánica",
  "Ingeniería",
  "Administración",
  "Peluquería",
];

export type Paso = { titulo: string; texto: string };

export const PASOS_TALENTO: Paso[] = [
  {
    titulo: "Entra con un código",
    texto: "Te llega un código de 6 números por mensaje de texto o por correo. No necesitas contraseña.",
  },
  {
    titulo: "Cuenta lo que sabes",
    texto:
      "Escribe o háblale al celular: un reto que resolviste, cómo lo hiciste y cómo terminó. Si prefieres, te llamamos y lo contamos juntos.",
  },
  {
    titulo: "Elige cómo trabajar",
    texto:
      "Por horas, por proyecto, como mentor, en una conversación de una hora o guiando un taller. Tú pones tu tarifa.",
  },
  {
    titulo: "Conversa y decide",
    texto:
      "Una organización verificada se interesa en tu perfil. Tú decides si quieres conversar, y tu nombre se muestra solo si aceptas.",
  },
];

export const PASOS_ORGANIZACION: Paso[] = [
  {
    titulo: "Verifica tu organización",
    texto: "Entras con un código y nos das el NIT. Lo revisamos antes de que puedas invitar a alguien a conversar.",
  },
  {
    titulo: "Cuenta tu reto",
    texto:
      "Qué está pasando, qué has intentado y qué necesitas. No hace falta escribir un cargo: escribe el problema.",
  },
  {
    titulo: "Recibe perfiles",
    texto:
      "Explora perfiles por lo que saben hacer, o deja que el equipo te proponga hasta 5 personas que pueden aportar.",
  },
  {
    titulo: "Conversen",
    texto:
      "Invitas a conversar y la persona decide. Si acepta, ves su nombre y acuerdan cómo trabajar: una hora, por proyecto o por horas.",
  },
];

export type Pregunta = { pregunta: string; respuesta: string };

export const PREGUNTAS_TALENTO: Pregunta[] = [
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta:
      "Para el talento, Kánna no cuesta nada. Nadie de Kánna ni de una organización te va a pedir dinero para conectarte con una oportunidad. Si alguien lo hace, no pagues y avísanos.",
  },
  {
    pregunta: "¿Necesito saber de tecnología?",
    respuesta:
      "No. Entras con un código que te llega al celular o al correo, y puedes contar tu historia hablando. Si te enredas, te llamamos y lo hacemos juntos.",
  },
  {
    pregunta: "¿Es solo para profesionales?",
    respuesta:
      "No. Una tejedora, un ebanista, una contadora y un técnico de mantenimiento están al mismo nivel. Contamos lo que sabes hacer, con o sin título.",
  },
  {
    pregunta: "¿Quién ve mi nombre y mi foto?",
    respuesta:
      "Tú decides. En modo reservado, una organización solo ve tu experiencia y tus capacidades. Tu nombre y tu foto aparecen cuando aceptas conversar.",
  },
  {
    pregunta: "¿Las organizaciones ven mi edad?",
    respuesta:
      "No. Tu edad no se muestra a ninguna organización y no se usa para buscar ni ordenar perfiles.",
  },
  {
    pregunta: "¿Cómo sé que una organización es real?",
    respuesta:
      "Revisamos el NIT de cada organización. Solo las verificadas pueden invitarte a conversar. Si algo te parece raro, avísanos desde Ayuda.",
  },
  {
    pregunta: "¿Y si no tengo correo?",
    respuesta:
      "Puedes entrar con tu celular: el código te llega por mensaje de texto. También puedes registrarte con una persona de nuestro equipo en tu territorio.",
  },
  {
    pregunta: "¿Me garantizan un trabajo?",
    respuesta:
      "No prometemos contrataciones. Hacemos visibles tus capacidades para que encuentres oportunidades con sentido para ti, y tú decides cuáles tomar.",
  },
];

export const PREGUNTAS_ORGANIZACION: Pregunta[] = [
  {
    pregunta: "¿Por qué piden el NIT?",
    respuesta:
      "Porque las personas confían en que quien les escribe es real. Hasta verificar el NIT puedes explorar perfiles, pero no invitar a nadie a conversar.",
  },
  {
    pregunta: "¿Por qué no veo nombres ni fotos?",
    respuesta:
      "Cada persona decide su visibilidad. Muchas muestran primero su experiencia y su nombre aparece cuando aceptan tu invitación.",
  },
  {
    pregunta: "¿Puedo filtrar por edad?",
    respuesta:
      "No. Buscas por lo que una persona sabe hacer y por los retos que ha resuelto. La edad no se muestra ni entra en la búsqueda.",
  },
  {
    pregunta: "¿Puedo hablar antes de comprometerme?",
    respuesta:
      "Sí. La forma más sencilla de empezar es una conversación de una hora sobre tu reto. Después deciden juntos si sigue un proyecto.",
  },
  {
    pregunta: "¿Qué pasa si una persona no acepta?",
    respuesta:
      "No pasa nada malo. Te avisamos y puedes invitar a otra persona o pedirle al equipo nuevas propuestas.",
  },
  {
    pregunta: "¿Kánna garantiza el resultado?",
    respuesta:
      "No prometemos respuestas preparadas para todo. Te conectamos con perspectivas y capacidades que pueden aportar a tu reto.",
  },
];

// Promesas de confianza, en el orden en que preocupan.
export const PROMESAS = [
  { titulo: "Nadie te va a pedir dinero.", texto: "Ni Kánna ni una organización. Si alguien lo hace, no pagues y avísanos." },
  { titulo: "Solo organizaciones verificadas.", texto: "Revisamos el NIT antes de que puedan invitarte a conversar." },
  { titulo: "La edad nunca se muestra.", texto: "Ni tu fecha de nacimiento ni tu foto entran en la búsqueda." },
  { titulo: "Siempre hay una persona.", texto: "Si algo no te queda claro, te llamamos." },
];

export const CREDITOS = [
  {
    obra: "Sandoná, tierra de artesanas",
    autor: "JoaquinStevenMeneses",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Sandon%C3%A1,_tierra_de_artesanas.jpg",
  },
  {
    obra: "En el campo también se teje",
    autor: "JoaquinStevenMeneses",
    licencia: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:En_el_campo_tambi%C3%A9n_se_teje.jpg",
  },
];
