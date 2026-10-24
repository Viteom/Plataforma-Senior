import {
  agendarConversacion,
  calificarProceso,
  noSeguirEmpresa,
  proponerAcuerdo,
  quieroConocer,
  terminarProceso,
} from "@/app/empresa/acciones";
import { BotonAccion } from "@/components/ui/boton-accion";
import type { ConexionEmpresa } from "@/lib/datos/tipos";
import { situacion } from "@/lib/procesos";

import { Calificacion, CamposAcuerdo, CamposAgenda, Motivos } from "./campos";
import { CuadroSituacion, LineaProceso } from "./linea";

const enlace = "inline-flex min-h-tap items-center font-bold underline underline-offset-4";

export const situacionEmpresa = (c: ConexionEmpresa) => situacion({ ...c, evaluacion_propia: c.evaluacion_empresa }, "empresa");

// Lo que la organización ve y puede hacer en cada etapa de una conexión.
export function PasosEmpresa({ c }: { c: ConexionEmpresa }) {
  const s = situacionEmpresa(c);
  const campos = { conexion: c.id };
  const viva = ["le_interesa", "abierta", "conversacion", "acuerdo", "en_curso"].includes(c.estado);

  return (
    <div className="flex flex-col gap-4">
      {s.etapa && <LineaProceso etapa={s.etapa} />}
      <CuadroSituacion s={s} lado="empresa" />
      {c.estado === "acuerdo" && c.acuerdo_nota && (
        <p className="text-base">
          <span className="font-bold">Lo que van a lograr:</span> {c.acuerdo_nota}
        </p>
      )}

      {c.estado === "le_interesa" && (
        <BotonAccion accion={quieroConocer} campos={campos} texto="Quiero conocer a esta persona" ancho="completo" />
      )}

      {c.estado === "abierta" && (
        <BotonAccion accion={agendarConversacion} campos={campos} texto="Registrar la conversación">
          <CamposAgenda id={c.id} />
        </BotonAccion>
      )}

      {c.estado === "conversacion" && (
        <>
          {c.conversacion_confirmada ? (
            <BotonAccion accion={proponerAcuerdo} campos={campos} texto="Enviar el acuerdo a la persona">
              <CamposAcuerdo id={c.id} />
            </BotonAccion>
          ) : (
            // Si conversaron sin que la persona confirmara en la app, igual se puede seguir.
            <details>
              <summary className={enlace}>Ya conversamos: proponer el acuerdo</summary>
              <BotonAccion accion={proponerAcuerdo} campos={campos} texto="Enviar el acuerdo a la persona" className="mt-3">
                <CamposAcuerdo id={c.id} />
              </BotonAccion>
            </details>
          )}
          <details>
            <summary className={enlace}>Cambiar la fecha</summary>
            <BotonAccion accion={agendarConversacion} campos={campos} texto="Guardar la nueva fecha" variant="secundario" className="mt-3">
              <CamposAgenda id={`${c.id}-otra`} />
            </BotonAccion>
          </details>
        </>
      )}

      {c.estado === "acuerdo" && (
        <details>
          <summary className={enlace}>Cambiar el acuerdo</summary>
          <BotonAccion accion={proponerAcuerdo} campos={campos} texto="Enviar el acuerdo de nuevo" variant="secundario" className="mt-3">
            <CamposAcuerdo id={c.id} previo={c} />
          </BotonAccion>
        </details>
      )}

      {c.estado === "en_curso" && (
        <details>
          <summary className={enlace}>Ya terminamos</summary>
          <BotonAccion accion={terminarProceso} campos={campos} texto="Marcar como terminado" variant="secundario" className="mt-3">
            <Calificacion pregunta="¿Cómo te fue con esta persona?" />
          </BotonAccion>
        </details>
      )}

      {c.estado === "cerrada" && c.cierre_tipo === "terminado" && !c.evaluacion_empresa && (
        <BotonAccion accion={calificarProceso} campos={campos} texto="Enviar calificación">
          <Calificacion pregunta="¿Cómo te fue con esta persona?" />
        </BotonAccion>
      )}

      {viva && (
        <details>
          <summary className={enlace}>No seguir con esta persona</summary>
          <BotonAccion accion={noSeguirEmpresa} campos={campos} texto="Cerrar este proceso" variant="secundario" className="mt-3">
            <Motivos lado="empresa" />
          </BotonAccion>
        </details>
      )}
    </div>
  );
}
