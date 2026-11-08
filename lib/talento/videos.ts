// Videos cortos para el talento. Todavía no están grabados: mientras tanto cada uno se escucha con
// la voz del celular (el guion). Cuando el equipo grabe uno, se agrega su `src` y se reproduce el
// video con subtítulos. Las portadas son fotos de banco de Pexels, de uso libre.

export type VideoTalento = {
  id: string;
  titulo: string;
  minutos: number;
  foto: string;
  guion: string;
  src?: string;
};

export const VIDEOS_TALENTO: VideoTalento[] = [
  {
    id: "como-funciona",
    titulo: "Cómo funciona Kánna",
    minutos: 1,
    foto: "/web/home/modista.webp",
    guion:
      "Hola. Kánna te conecta con organizaciones que necesitan resolver un reto concreto. " +
      "Primero nos cuentas lo que sabes hacer, hablando o escribiendo. Con eso armamos tu huella de experiencia. " +
      "Cuando una organización quiere hablarte de un trabajo, te avisamos por mensaje de texto y en la app. " +
      "Tú decides si te interesa. Si dices que sí, conversan, y si se ponen de acuerdo, empiezas a tu ritmo. " +
      "Tu edad nunca se muestra, y nadie te va a pedir dinero. Si necesitas ayuda, toca el botón de ayuda.",
  },
  {
    id: "contar-historia",
    titulo: "Cómo contar tu historia",
    minutos: 1,
    foto: "/web/home/carpintero.webp",
    guion:
      "Para contar tu historia no necesitas hoja de vida. Piensa en un problema difícil que resolviste en tu trabajo. " +
      "Cuenta qué pasaba, qué hiciste tú y cómo terminó. Habla como si se lo contaras a un amigo. " +
      "No importa equivocarte: después puedes corregir el texto. Con eso ordenamos tus capacidades, y tú confirmas cada una.",
  },
  {
    id: "te-quieren-conocer",
    titulo: "Qué pasa cuando una organización quiere hablarte de un trabajo",
    minutos: 1,
    foto: "/web/home/contadora.webp",
    guion:
      "Cuando una organización quiere hablarte de un trabajo, te llega un mensaje de texto. En Oportunidades ves qué necesita y dónde. " +
      "Si te interesa, toca Me interesa y te proponen una conversación. Si no, toca No me interesa: no pasa nada, tu perfil sigue ahí. " +
      "Antes de empezar, Kánna revisa que el acuerdo sea justo.",
  },
  {
    id: "estafas",
    titulo: "Cómo reconocer una estafa",
    minutos: 1,
    foto: "/web/home/asesor.webp",
    guion:
      "Nadie de Kánna ni de una organización te va a pedir dinero. Tampoco códigos, contraseñas ni datos del banco. " +
      "Si alguien te pide pagar por un examen, por un curso o por aportes a salud y pensión, es una estafa. " +
      "No pagues y repórtalo desde la oportunidad, o toca el botón de ayuda.",
  },
  {
    id: "quien-te-ve",
    titulo: "Quién ve tu perfil",
    minutos: 1,
    foto: "/web/home/docente.webp",
    guion:
      "Tú decides quién te ve. Si tu perfil es reservado, las organizaciones ven tu experiencia, pero no tu nombre ni tu foto. " +
      "Si es visible, ven también tu nombre, tu foto y tu historia. Puedes cambiarlo cuando quieras desde Mi perfil.",
  },
];

export const video = (id: string) => VIDEOS_TALENTO.find((v) => v.id === id)!;

// Ejemplo que se escucha mientras la persona cuenta su historia.
export const EJEMPLO_HISTORIA =
  "Este es un ejemplo. Trabajé muchos años en una planta de alimentos. Un día llegó una visita de control y la bodega no cumplía. " +
  "Ordené el inventario, enseñé al equipo a rotar los productos y armé una lista de revisión diaria. " +
  "En dos meses pasamos la visita sin problemas, y la lista se sigue usando.";

// Preguntas guía: cada una se puede escuchar.
export const PREGUNTAS_GUIA = ["¿Qué problema difícil resolviste?", "¿Qué hiciste tú?", "¿Cómo terminó?"];
