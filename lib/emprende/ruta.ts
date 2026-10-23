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

export type Paso = { titulo: string; descripcion: string; tema?: TemaCurso };

const POR_ETAPA: Record<Etapa, Paso[]> = {
  idea: [
    { titulo: "Escribe tu idea en una frase", descripcion: "Qué vendes, a quién y por qué te lo comprarían a ti." },
    { titulo: "Pregúntales a 5 posibles clientes", descripcion: "Antes de invertir, comprueba que alguien lo necesita y pagaría por ello." },
  ],
  vendiendo: [
    { titulo: "Anota lo que vendes cada semana", descripcion: "Con eso sabes qué funciona y qué no.", tema: "negocio" },
  ],
  creciendo: [
    { titulo: "Revisa qué te deja más ganancia", descripcion: "Crece en lo que más te deja, no en lo que más vendes.", tema: "negocio" },
    { titulo: "Piensa a quién le enseñas", descripcion: "Si creces, alguien más tiene que saber hacerlo como tú.", tema: "mentoria" },
  ],
};

const POR_NECESIDAD: Record<Necesidad, Paso> = {
  clientes: { titulo: "Busca clientes donde ya están", descripcion: "Empieza por conocidos, grupos de la vereda o del barrio y ferias.", tema: "negocio" },
  precios: { titulo: "Calcula tu precio", descripcion: "Suma materiales y tu tiempo; nunca cobres por debajo de eso.", tema: "cobrar" },
  cuentas: { titulo: "Separa la plata del negocio", descripcion: "Un cuaderno o una hoja con lo que entra y lo que sale, cada día.", tema: "negocio" },
  formalizar: { titulo: "Saca el RUT", descripcion: "Es gratis en la DIAN. Después, si lo necesitas, registra el negocio en la Cámara de Comercio.", tema: "negocio" },
  digital: { titulo: "Muestra lo que haces por WhatsApp", descripcion: "Fotos claras, precio y cómo pedirlo. Un catálogo sencillo basta.", tema: "digital" },
  dinero: { titulo: "Conoce opciones de crédito pequeño", descripcion: "Pregunta por microcréditos y fondos de tu caja de compensación. Desconfía de quien te pida plata por adelantado.", tema: "negocio" },
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
