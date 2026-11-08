// Emprende: diagnóstico corto → ruta de pasos (brief, "Aprende y Emprende"). Lógica pura, sin IA.

export type Etapa = "idea" | "vendiendo" | "creciendo";
export type Necesidad = "clientes" | "precios" | "cuentas" | "formalizar" | "digital" | "dinero";
export type TemaCurso = "digital" | "cobrar" | "mentoria" | "negocio" | "oficio";

export const ETAPAS: { valor: Etapa; etiqueta: string }[] = [
  { valor: "idea", etiqueta: "Tengo una idea" },
  { valor: "vendiendo", etiqueta: "Ya vendo algo" },
  { valor: "creciendo", etiqueta: "Mi negocio ya funciona y quiero crecer" },
];

export const NECESIDADES: { valor: Necesidad; etiqueta: string }[] = [
  { valor: "clientes", etiqueta: "Conseguir clientes" },
  { valor: "precios", etiqueta: "Saber cuánto cobrar" },
  { valor: "cuentas", etiqueta: "Llevar las cuentas" },
  { valor: "formalizar", etiqueta: "Formalizar mi negocio (RUT, Cámara de Comercio)" },
  { valor: "digital", etiqueta: "Vender por WhatsApp o internet" },
  { valor: "dinero", etiqueta: "Conseguir plata para empezar o crecer" },
];

// La clave es fija: con ella se guarda qué pasos ya hizo la persona aunque cambie el texto.
export type Paso = { clave: string; titulo: string; descripcion: string; tema?: TemaCurso };

const POR_ETAPA: Record<Etapa, Paso[]> = {
  idea: [
    { clave: "idea-frase", titulo: "Escribe tu idea en una frase", descripcion: "Qué vendes, a quién y por qué te lo comprarían a ti." },
    { clave: "idea-clientes", titulo: "Pregúntales a 5 posibles clientes", descripcion: "Antes de invertir, comprueba que alguien lo necesita y pagaría por ello." },
  ],
  vendiendo: [
    { clave: "ventas-semana", titulo: "Anota lo que vendes cada semana", descripcion: "Con eso sabes qué funciona y qué no.", tema: "negocio" },
  ],
  creciendo: [
    { clave: "ganancia", titulo: "Revisa qué te deja más ganancia", descripcion: "Crece en lo que más te deja, no en lo que más vendes.", tema: "negocio" },
    { clave: "ensenar", titulo: "Piensa a quién le enseñas", descripcion: "Si creces, alguien más tiene que saber hacerlo como tú.", tema: "mentoria" },
  ],
};

const POR_NECESIDAD: Record<Necesidad, Paso> = {
  clientes: { clave: "clientes", titulo: "Busca clientes donde ya están", descripcion: "Empieza por conocidos, grupos de la vereda o del barrio y ferias.", tema: "negocio" },
  precios: { clave: "precio", titulo: "Calcula tu precio", descripcion: "Suma materiales y tu tiempo; nunca cobres por debajo de eso.", tema: "cobrar" },
  cuentas: { clave: "cuentas", titulo: "Separa la plata del negocio", descripcion: "Un cuaderno o una hoja con lo que entra y lo que sale, cada día.", tema: "negocio" },
  formalizar: { clave: "rut", titulo: "Saca el RUT", descripcion: "Es gratis en la DIAN. Después, si lo necesitas, registra el negocio en la Cámara de Comercio.", tema: "negocio" },
  digital: { clave: "whatsapp", titulo: "Muestra lo que haces por WhatsApp", descripcion: "Fotos claras, precio y cómo pedirlo. Un catálogo sencillo basta.", tema: "digital" },
  dinero: { clave: "credito", titulo: "Conoce opciones de crédito pequeño", descripcion: "Pregunta por microcréditos y fondos de tu caja de compensación. Desconfía de quien te pida plata por adelantado.", tema: "negocio" },
};

export function rutaPara(etapa: Etapa, necesidades: Necesidad[]): Paso[] {
  const pasos = [...POR_ETAPA[etapa]];
  // En orden de la lista, sin repetir.
  for (const n of NECESIDADES.map((x) => x.valor)) {
    if (necesidades.includes(n)) pasos.push(POR_NECESIDAD[n]);
  }
  return pasos;
}

export const esEtapa = (v: unknown): v is Etapa => ETAPAS.some((e) => e.valor === v);
export const esNecesidad = (v: unknown): v is Necesidad => NECESIDADES.some((n) => n.valor === v);

export const IDEA_MAX = 500;
export const esClavePaso = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9-]{1,40}$/.test(v);
export const etiquetaEtapa = (e: Etapa) => ETAPAS.find((x) => x.valor === e)?.etiqueta ?? e;

// La línea que la persona escribe en cada paso, ahí mismo en Kánna (antes, en un cuaderno).
export const RESPUESTA_MAX = 300;
const PREGUNTA_PASO: Record<string, string> = {
  "idea-frase": "Tu frase",
  "idea-clientes": "¿A quién le vas a preguntar? ¿Qué te dijeron?",
  "ventas-semana": "¿Qué vendiste esta semana?",
  ganancia: "¿Qué es lo que más ganancia te deja?",
  ensenar: "¿A quién le podrías enseñar?",
  clientes: "¿Dónde puedes encontrar a tus clientes?",
  precio: "¿Cuánto vas a cobrar y por qué?",
  cuentas: "¿Dónde vas a anotar lo que entra y lo que sale?",
  rut: "¿Qué te falta para sacar el RUT?",
  whatsapp: "¿Qué vas a mostrar primero por WhatsApp?",
  credito: "¿Qué opciones vas a averiguar?",
};
export const preguntaPaso = (clave: string) => PREGUNTA_PASO[clave] ?? "Escribe aquí lo que hiciste o lo que piensas hacer";
