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
    { titulo: "Escriba su idea en una frase", descripcion: "Qué vende, a quién y por qué se lo comprarían a usted." },
    { titulo: "Pregúntele a 5 posibles clientes", descripcion: "Antes de invertir, compruebe que alguien lo necesita y pagaría por ello." },
  ],
  vendiendo: [
    { titulo: "Anote lo que vende cada semana", descripcion: "Con eso sabe qué funciona y qué no.", tema: "negocio" },
  ],
  creciendo: [
    { titulo: "Revise qué le deja más ganancia", descripcion: "Crezca en lo que más le deja, no en lo que más vende.", tema: "negocio" },
    { titulo: "Piense a quién le enseña", descripcion: "Si crece, alguien más tiene que saber hacerlo como usted.", tema: "mentoria" },
  ],
};

const POR_NECESIDAD: Record<Necesidad, Paso> = {
  clientes: { titulo: "Busque clientes donde ya están", descripcion: "Empiece por conocidos, grupos de la vereda o del barrio y ferias.", tema: "negocio" },
  precios: { titulo: "Calcule su precio", descripcion: "Sume materiales y su tiempo; nunca cobre por debajo de eso.", tema: "cobrar" },
  cuentas: { titulo: "Separe la plata del negocio", descripcion: "Un cuaderno o una hoja con lo que entra y lo que sale, cada día.", tema: "negocio" },
  formalizar: { titulo: "Saque el RUT", descripcion: "Es gratis en la DIAN. Después, si lo necesita, registre el negocio en la Cámara de Comercio.", tema: "negocio" },
  digital: { titulo: "Muestre lo que hace por WhatsApp", descripcion: "Fotos claras, precio y cómo pedirlo. Un catálogo sencillo basta.", tema: "digital" },
  dinero: { titulo: "Conozca opciones de crédito pequeño", descripcion: "Pregunte por microcréditos y fondos de su caja de compensación. Desconfíe de quien le pida plata por adelantado.", tema: "negocio" },
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
