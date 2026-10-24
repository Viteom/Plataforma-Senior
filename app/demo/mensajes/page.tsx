import { CircleDashed, ListChecks, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Celular, type Burbuja } from "@/components/demo/celular";
import { Pantalla } from "@/components/layout/pantalla";
import { momentos } from "@/lib/avisos/mensajes";
import { MODO_DEMO } from "@/lib/demo";
import { vistaTalentoDemo } from "@/lib/demo-proceso";
import { leerProcesoDemo } from "@/lib/demo-proceso-cookie";
import { situacion, textoAcuerdo } from "@/lib/procesos";

import { reiniciarDemo } from "../acciones";

export const metadata: Metadata = { title: "Mensajes al celular" };

// Dominio por definir: el enlace corto de los mensajes es un marcador.
const ENLACE = "kanna.co/o";

const enlace = "inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4";

// Diseño de los avisos a la persona. Arriba, los que le llegaron en el proceso de tu demostración;
// abajo, todos los momentos con su versión de SMS y de WhatsApp.
export default async function MensajesAlCelular() {
  if (!MODO_DEMO) notFound();
  const proceso = await leerProcesoDemo();
  const vista = vistaTalentoDemo(proceso);
  const lista = momentos({
    enlace: ENLACE,
    conversacion_en: proceso.conversacion_en,
    conversacion_modo: proceso.conversacion_modo,
    acuerdo: proceso.acuerdo_valor ? textoAcuerdo(vista) : undefined,
  });
  const porId = new Map(lista.map((m) => [m.id, m]));
  const recibidos = proceso.avisos.flatMap((a, i) => {
    const m = porId.get(a.momento);
    return m ? [{ m, en: a.en, clave: `${a.momento}-${i}` }] : [];
  });
  const sms: Burbuja[] = recibidos.map(({ m, en, clave }) => ({ id: clave, titulo: m.titulo, texto: m.sms, en }));
  const whatsapp: Burbuja[] = recibidos.map(({ m, en, clave }) => ({ id: clave, titulo: m.titulo, texto: m.whatsapp.texto, botones: m.whatsapp.botones, en }));
  const ahora = situacion({ ...vista, evaluacion_propia: vista.evaluacion_talento }, "talento");

  return (
    <Pantalla
      titulo="Mensajes al celular"
      intro="Diseño de los avisos que recibe la persona en cada paso, por mensaje de texto o por WhatsApp. Todavía no se envían: hoy quedan en la cola del equipo, que llama a quien lo necesite."
    >
      <section aria-labelledby="en-tu-demo" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="en-tu-demo" className="text-xl">
            Lo que le ha llegado en tu demostración
          </h2>
          <p>
            El proceso con Alimentos del Oriente va en: <span className="font-bold">{ahora.titulo}</span>. Avánzalo y vuelve
            aquí para ver el mensaje nuevo.
          </p>
          <div className="flex flex-wrap gap-x-5">
            <Link href="/oportunidades" className={enlace}>
              Ver como talento
            </Link>
            <Link href="/empresa/procesos" className={enlace}>
              Ver como organización
            </Link>
            <form action={reiniciarDemo}>
              <button type="submit" className={enlace}>
                <RotateCcw aria-hidden className="size-5" />
                Empezar de nuevo
              </button>
            </form>
          </div>
        </div>
        <div className="grid gap-10 md:grid-cols-2">
          <Celular tipo="sms" burbujas={sms} vacio="Todavía no le ha llegado nada." />
          <Celular tipo="whatsapp" burbujas={whatsapp} vacio="Todavía no le ha llegado nada." />
        </div>
      </section>

      <section aria-labelledby="todos" className="flex flex-col gap-4">
        <h2 id="todos" className="text-xl">
          Todos los avisos del proceso
        </h2>
        <ul className="flex flex-col gap-4">
          {lista.map((m) => (
            <li key={m.id} className="flex flex-col gap-4 rounded-lg border-2 border-border-subtle p-5">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg">{m.titulo}</h3>
                <p className="text-base text-text-muted">Cuándo: {m.cuando}</p>
                <p className="inline-flex items-center gap-2 text-base font-bold">
                  {m.estado === "hoy" ? (
                    <>
                      <ListChecks aria-hidden className="size-5 text-deep" />
                      Ya se guarda en la cola de avisos
                    </>
                  ) : (
                    <>
                      <CircleDashed aria-hidden className="size-5" />
                      Propuesta: falta implementarlo
                    </>
                  )}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
                  <p className="font-bold">Mensaje de texto</p>
                  <p className="font-normal">{m.sms}</p>
                  <p className="text-base text-text-muted">{m.sms.length} de 160 caracteres · sin tildes</p>
                </div>
                <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
                  <p className="font-bold">WhatsApp</p>
                  <p className="whitespace-pre-line">{m.whatsapp.texto}</p>
                  <p className="text-base text-text-muted">Botones: {m.whatsapp.botones.join(" · ")}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="decidir" className="flex flex-col gap-3 rounded-lg bg-surface p-5">
        <h2 id="decidir" className="text-xl">
          Para decidir antes de implementar
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>
            <span className="font-bold">Canal por persona.</span> Que cada quien elija en su perfil SMS o WhatsApp. Quien
            no tiene WhatsApp, o no aceptó recibir mensajes por ahí, recibe SMS.
          </li>
          <li>
            <span className="font-bold">Costos.</span> El SMS se paga por mensaje y en GSM-7 (sin tildes) cabe el doble.
            WhatsApp se paga por conversación y cada plantilla necesita aprobación de Meta y un número verificado.
          </li>
          <li>
            <span className="font-bold">Cuándo.</span> Ya está la regla: de 8 a. m. a 7 p. m. y máximo un mensaje al día
            por persona; si hay varios, se agrupan.
          </li>
          <li>
            <span className="font-bold">Sin cuenta propia.</span> A quien registró un gestor no le llega nada: el equipo
            la llama.
          </li>
          <li>
            <span className="font-bold">Enlace corto.</span> «{ENLACE}» es un marcador hasta tener el dominio.
          </li>
        </ul>
      </section>
    </Pantalla>
  );
}
