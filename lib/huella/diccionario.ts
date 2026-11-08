import type { Capa } from "@/lib/ia/tipos";

// Diccionario de frases de todos los días → lenguaje de empresa. Sin IA y sin enviar la historia a
// nadie: se busca aquí mismo. «Hago visitas a los clientes» se propone como «Ventas»; la persona
// confirma o quita cada etiqueta. Cuando la etiqueta ya existe en la taxonomía se usa esa; si no,
// queda como etiqueta nueva y el equipo la revisa antes de que la vea una empresa.
//
// Las frases van en minúscula y sin tildes. Cada una se busca al comienzo de una palabra, así
// «vendia» reconoce «vendía» y «vendíamos».

export type EntradaDiccionario = { frases: string[]; capa: Capa; etiqueta: string };

export const DICCIONARIO: EntradaDiccionario[] = [
  {
    capa: "oficio",
    etiqueta: "Ventas",
    frases: ["hago visitas", "hacia visitas", "visitaba client", "visitas a client", "puerta a puerta", "vendia", "vendo ", "vendedor", "vendedora", "conseguia client", "consigo client"],
  },
  {
    capa: "oficio",
    etiqueta: "Atención al cliente",
    frases: ["atendia a la gente", "atendia client", "atiendo client", "atendia el public", "atencion al public", "atendia el mostrador", "atendia la caja"],
  },
  {
    capa: "oficio",
    etiqueta: "Contabilidad",
    frases: ["llevaba las cuentas", "llevo las cuentas", "cuadraba la caja", "cuadrar la caja", "hacia los balances", "manejaba la plata", "manejaba el dinero", "llevaba los libros"],
  },
  {
    capa: "oficio",
    etiqueta: "Administración",
    frases: ["hacia el papeleo", "papeleo", "manejaba el archivo", "hacia los tramites", "tramites", "llevaba la agenda", "organizaba la oficina"],
  },
  {
    capa: "oficio",
    etiqueta: "Compras",
    frases: ["hacia los pedidos", "hago los pedidos", "compraba la mercancia", "surtia", "surtir la tienda", "compraba los materiales"],
  },
  {
    capa: "oficio",
    etiqueta: "Logística",
    frases: ["despachaba", "hacia los despachos", "repartia", "hacia domicilios", "manejaba la bodega", "llevaba el inventario", "inventario"],
  },
  {
    capa: "oficio",
    etiqueta: "Cuidado de personas",
    frases: ["cuidaba a", "cuido a", "cuide a", "cuidar enfermos", "cuidaba enfermos", "cuidaba ninos", "cuidaba a los ninos", "acompanaba a personas"],
  },
  {
    capa: "oficio",
    etiqueta: "Cocina",
    frases: ["cocinaba", "cocino ", "hacia almuerzos", "hacia el almuerzo", "preparaba comida", "vendia comida", "hacia empanadas", "hacia tamales"],
  },
  {
    capa: "oficio",
    etiqueta: "Mantenimiento industrial",
    frases: ["arreglaba maquinas", "reparaba maquinas", "arreglaba las maquinas", "le hacia mantenimiento"],
  },
  {
    capa: "oficio",
    etiqueta: "Servicios generales y aseo",
    frases: ["hacia aseo", "hacia el aseo", "hago aseo", "limpiaba", "oficios varios", "servicios generales"],
  },
  {
    capa: "oficio",
    etiqueta: "Conducción y transporte",
    frases: ["manejaba carro", "manejaba un carro", "manejaba camion", "manejaba bus", "manejaba taxi", "era conductor", "era chofer", "taxista"],
  },
  {
    capa: "oficio",
    etiqueta: "Agricultura",
    frases: ["sembraba", "siembro", "cosechaba", "cultivaba", "trabajaba la tierra", "en la finca", "ordenaba vacas", "cuidaba el ganado"],
  },
  {
    capa: "oficio",
    etiqueta: "Costura y confección",
    frases: ["cosia", "coso ", "hacia ropa", "arreglaba ropa", "modisteria", "maquina de coser"],
  },
  {
    capa: "oficio",
    etiqueta: "Construcción",
    frases: ["pegaba ladrillo", "trabajaba en obra", "en la obra", "era maestro de obra", "levantaba muros", "echaba plancha"],
  },
  {
    capa: "oficio",
    etiqueta: "Peluquería y belleza",
    frases: ["cortaba el pelo", "corto el pelo", "hacia las unas", "arreglaba unas", "hacia peinados", "tenia una peluqueria"],
  },
  {
    capa: "oficio",
    etiqueta: "Docencia",
    frases: ["daba clases", "doy clases", "era profesor", "era profesora", "ensenaba en", "dictaba clases"],
  },
  {
    capa: "situaciones",
    etiqueta: "Reclamo de un cliente resuelto",
    frases: ["resolvia quejas", "atendia quejas", "atendia reclamos", "resolvia reclamos", "clientes bravos", "cliente bravo", "cliente molesto"],
  },
  {
    capa: "situaciones",
    etiqueta: "Negociación con proveedores",
    frases: ["negociaba con proveedores", "negociaba precios", "conseguia mejores precios", "regateaba con"],
  },
  {
    capa: "situaciones",
    etiqueta: "Recuperación de cartera vencida",
    frases: ["cobraba a los que debian", "hacia cobros", "cobraba cartera", "recuperaba cartera", "cobrar deudas"],
  },
  {
    capa: "situaciones",
    etiqueta: "Negocio propio sacado adelante",
    frases: ["tenia mi propio negocio", "tuve mi negocio", "monte mi negocio", "abri mi negocio", "tengo mi negocio", "mi propio negocio"],
  },
  {
    capa: "situaciones",
    etiqueta: "Pedido grande entregado a tiempo",
    frases: ["pedido grande", "entregamos a tiempo", "entregue a tiempo", "sacamos el pedido"],
  },
  {
    capa: "situaciones",
    etiqueta: "Organización de eventos",
    frases: ["organizaba eventos", "organizaba fiestas", "organizaba reuniones", "hacia eventos"],
  },
  {
    capa: "escala",
    etiqueta: "Personas a cargo",
    frases: ["tenia gente a cargo", "tenia personas a cargo", "manejaba personal", "manejaba un equipo", "era el jefe", "era la jefe", "era la jefa", "coordinaba a", "supervisaba a"],
  },
  {
    capa: "transferir",
    etiqueta: "Acompañó a personas nuevas",
    frases: ["le explicaba a los nuevos", "les explicaba a los nuevos", "ensenaba a los nuevos", "entrenaba a los nuevos", "capacitaba", "induccion"],
  },
  {
    capa: "transferir",
    etiqueta: "Enseñó un oficio tradicional",
    frases: ["le ensene el oficio", "les ensene el oficio", "ensenaba el oficio", "aprendices", "le ensene a mis hijos"],
  },
  {
    capa: "transferir",
    etiqueta: "Dictó talleres",
    frases: ["dictaba talleres", "daba talleres", "hacia talleres", "di talleres"],
  },
];

// Minúscula, sin tildes y solo letras y números.
export const normalizarFrase = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Las etiquetas del diccionario que aparecen en el texto, una vez cada una y en el orden del
// diccionario. «frase » con espacio al final exige la palabra completa («vendo », no «vendor»).
export function traducirFrases(texto: string, diccionario: EntradaDiccionario[] = DICCIONARIO): { capa: Capa; etiqueta: string }[] {
  const t = ` ${normalizarFrase(texto)} `;
  const encontradas: { capa: Capa; etiqueta: string }[] = [];
  for (const entrada of diccionario) {
    const aparece = entrada.frases.some((f) => {
      const completa = f.endsWith(" ");
      const k = normalizarFrase(f);
      return k.length >= 4 && t.includes(` ${k}${completa ? " " : ""}`);
    });
    if (aparece && !encontradas.some((e) => e.capa === entrada.capa && e.etiqueta === entrada.etiqueta)) {
      encontradas.push({ capa: entrada.capa, etiqueta: entrada.etiqueta });
    }
  }
  return encontradas;
}
