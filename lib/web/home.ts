// Textos e imágenes del home (maqueta aprobada el 1 de noviembre de 2026). Los retratos son fotos de
// banco de Pexels, de uso libre; los oficios y las ciudades son ilustrativos: no describen a esas
// personas ni a talento de Kánna. Nada de edades en las tarjetas ni promesas de contratación.

export type Foto = { src: string; ancho: number; alto: number; alt: string };

const foto = (nombre: string, ancho: number, alto: number, alt: string): Foto => ({
  src: `/web/home/${nombre}.webp`,
  ancho,
  alto,
  alt,
});

// Franja del banner: un oficio o profesión por columna, mezcla de campo y ciudad.
export const FRANJA = [
  { foto: foto("caficultor", 640, 960, ""), oficio: "Caficultor", lugar: "Huila" },
  { foto: foto("contadora", 640, 960, ""), oficio: "Contadora", lugar: "Medellín" },
  { foto: foto("sastre", 640, 1137, ""), oficio: "Sastre", lugar: "Bogotá" },
  { foto: foto("enfermera", 640, 960, ""), oficio: "Enfermera", lugar: "Cali" },
  { foto: foto("asesor", 1000, 1500, ""), oficio: "Asesor financiero", lugar: "Bogotá" },
  { foto: foto("artesana", 640, 960, ""), oficio: "Artesana", lugar: "Nariño" },
  { foto: foto("gerente", 1000, 1498, ""), oficio: "Gerente comercial", lugar: "Barranquilla" },
  { foto: foto("modista", 640, 960, ""), oficio: "Modista", lugar: "Pereira" },
  { foto: foto("docente", 640, 960, ""), oficio: "Docente", lugar: "Manizales" },
];

// Retratos de «Tu experiencia vale más»: tarjetas altas que se deslizan despacio, cada una con su oficio.
export const RETRATOS = [
  { foto: "disenador", oficio: "Diseñador", lugar: "Medellín" },
  { foto: "abogada", oficio: "Abogada", lugar: "Bogotá" },
  { foto: "agricultor", oficio: "Agricultor", lugar: "Boyacá" },
  { foto: "administrador", oficio: "Administrador", lugar: "Cali" },
  { foto: "cocinera", oficio: "Cocinera", lugar: "Cartagena" },
  { foto: "ingeniero", oficio: "Ingeniero", lugar: "Bucaramanga" },
  { foto: "carpintero", oficio: "Carpintero", lugar: "Cali" },
  { foto: "sabedora", oficio: "Sabedora", lugar: "Cauca" },
  { foto: "zapatero", oficio: "Zapatero", lugar: "Bogotá" },
  { foto: "caficultor-cafetal", oficio: "Caficultor", lugar: "Huila" },
];

export type Paso = { titulo: string; texto: string };

export const PASOS_EMPRESA: Paso[] = [
  { titulo: "Cuentas tu reto", texto: "Qué necesitas resolver, cuántas horas y cuánto pagas. No es un cargo: es un problema concreto." },
  { titulo: "Kánna revisa las condiciones", texto: "Un semáforo de trabajo digno revisa pago, jornada y descansos. Lo que no cumple, vuelve con ajustes." },
  { titulo: "Te proponemos hasta 5 perfiles", texto: "Ves la huella y el oficio. El nombre y la foto, solo cuando la persona acepta conocerte." },
  { titulo: "Eliges y conversan", texto: "Si a la persona le interesa, agendan una conversación. Nuestro equipo los pone en contacto." },
  { titulo: "Acuerdan y trabajan", texto: "Un acuerdo claro, revisado por Kánna, con acompañamiento durante todo el trabajo." },
];

export const PASOS_TALENTO: Paso[] = [
  { titulo: "Cuéntanos tu historia", texto: "Hablando o escribiendo, como te quede más fácil. Sin hoja de vida y sin contraseñas." },
  { titulo: "Armemos tu huella", texto: "Ordenamos lo que sabes hacer en capacidades. Tú confirmas cada una antes de que alguien la vea." },
  { titulo: "Te llega una oportunidad", texto: "Por SMS y en la app. Nadie de Kánna ni de una organización te va a pedir dinero." },
  { titulo: "Tú decides", texto: "Si te interesa, se conocen. Si no, no pasa nada: tu perfil sigue ahí." },
  { titulo: "Trabajas acompañado", texto: "Tú pones el ritmo. Te preguntamos cómo vas y siempre hay una persona para ayudarte." },
];

export const MANERAS = ["En un proyecto", "Una asesoría", "Una mentoría", "Enseñándole algo nuevo al equipo"];

// Perfiles del panel de ejemplo: una capacidad, no un cargo, y por qué encaja con el reto.
export const PERFILES_RETO = [
  { capacidad: "Organización de materiales", porque: "Ha ordenado bodegas e inventarios de planta.", etiquetas: ["Inventarios", "Rotación"] },
  { capacidad: "Control de calidad", porque: "Puede revisar que lo almacenado cumpla las buenas prácticas.", etiquetas: ["BPM", "Auditoría"] },
  { capacidad: "Formación de aprendices", porque: "Puede enseñarle el método a tu equipo para que se sostenga.", etiquetas: ["Mentoría", "Procesos"] },
];

// Oficios y profesiones: cada uno cambia el retrato.
export const OFICIOS_HOME = [
  { nombre: "Derecho", foto: foto("abogada", 1000, 1500, "Retrato de una abogada en su oficina"), pie: "Abogada · Bogotá" },
  { nombre: "Confección", foto: foto("sastre", 640, 1137, "Retrato de un sastre en su taller"), pie: "Sastre · Bogotá" },
  { nombre: "Contabilidad", foto: foto("contadora", 640, 960, "Retrato de una contadora con una carpeta"), pie: "Contadora · Medellín" },
  { nombre: "Caficultura", foto: foto("caficultor-cafetal", 1000, 1334, "Retrato de un caficultor en su cafetal"), pie: "Caficultor · Huila" },
  { nombre: "Docencia", foto: foto("docente", 640, 960, "Retrato de una docente frente al tablero"), pie: "Docente · Manizales" },
  { nombre: "Carpintería", foto: foto("carpintero", 640, 853, "Retrato de un carpintero trabajando la madera"), pie: "Carpintero · Cali" },
];

export const GARANTIAS = [
  { titulo: "NIT verificado", texto: "Revisamos el NIT de cada organización en el RUES antes de que pueda contactar a alguien." },
  { titulo: "Trabajo digno", texto: "Un semáforo revisa pago, jornada y descansos de cada reto y cada acuerdo." },
  { titulo: "Tu edad no se muestra", texto: "La edad nunca se muestra a las empresas ni cuenta en ningún cálculo." },
  { titulo: "Nadie pide dinero", texto: "Kánna es gratis para el talento. Nadie te va a pedir dinero, nunca." },
  { titulo: "Tus datos, tuyos", texto: "Decides qué se ve. Puedes descargar o borrar tu información cuando quieras." },
  { titulo: "Siempre una persona", texto: "Ayuda por WhatsApp o por llamada, en todas las pantallas." },
];

export const PREGUNTAS_HOME = {
  talento: [
    { p: "¿Cuánto me cuesta?", r: "Nada. Kánna es gratis para el talento. Nadie de Kánna ni de una organización te va a pedir dinero." },
    { p: "¿Necesito hoja de vida o saber de tecnología?", r: "No. Puedes contar tu historia hablando, y un gestor puede registrarte en persona si lo prefieres." },
    { p: "¿Las empresas ven mi edad?", r: "No. Tu edad nunca se muestra ni cuenta para nada. Ven tu huella y tu oficio; tu nombre y tu foto, solo si tú aceptas." },
    { p: "Mi saber es del campo, ¿cuenta?", r: "Sí. Tejer, cultivar o cocinar también son capacidades. Un gestor te acompaña a registrarte sin usar la app." },
    { p: "¿Y si necesito ayuda?", r: "Siempre hay una persona: por el botón de ayuda, por WhatsApp o pidiendo que te llamemos." },
  ],
  empresas: [
    { p: "¿Cómo se paga a las personas?", r: "Acuerdan el pago antes de empezar y Kánna revisa que sea justo. Los pagos por la plataforma llegan pronto." },
    { p: "¿Por qué no veo la edad ni la foto?", r: "Porque decides por lo que la persona sabe hacer. La foto y el nombre llegan cuando ambos aceptan conocerse." },
    { p: "¿Puedo llevar un taller del campo a mi equipo?", r: "Sí. Los diseñamos con las personas del territorio; pueden ser en tu sede o en el territorio, y te enviamos la cotización antes de confirmar." },
    { p: "¿Puede usar Kánna todo mi equipo?", r: "Sí. Invitas a tu equipo con roles: administración, procesos o solo lectura." },
  ],
};

// Lo que lee el botón «Escucha cómo funciona» con la voz del navegador (sin servicios externos).
export const AUDIO_COMO_FUNCIONA =
  "Hola. Kánna conecta a personas de cuarenta y cinco años o más, y al talento del campo, con organizaciones que necesitan resolver retos concretos. " +
  "Si eres talento, nos cuentas tu historia hablando o escribiendo. Nosotros la ordenamos contigo en una huella de capacidades. " +
  "Cuando una organización quiere hablarte de un trabajo, te avisamos por mensaje de texto y tú decides si te interesa. " +
  "Tu edad nunca se muestra, y nadie te va a pedir dinero. Si necesitas ayuda, siempre hay una persona del equipo para acompañarte.";
