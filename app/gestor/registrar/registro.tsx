"use client";

import { Camera, CloudOff, CloudUpload, Mic, PenLine, Trash2, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { borrarBorrador, guardarBorrador, listarBorradores, type Borrador } from "@/components/gestor/borradores";
import { Firma } from "@/components/gestor/firma";
import { Grabadora } from "@/components/gestor/grabadora";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { MARCA } from "@/lib/marca";

import { enviarRegistro } from "./acciones";

const PASOS = ["Datos de la persona", "Su historia", "Foto", "Autorización de datos"];

const nuevo = (): Borrador => ({
  id: crypto.randomUUID(),
  creadoEn: new Date().toISOString(),
  nombre: "",
  ubicacion: "",
  oficio: "",
  celular: "",
  visibilidad: "reservado",
  historiaTexto: "",
  historiaAudio: null,
  foto: null,
  autorizacionMedio: "firma",
  autorizacion: null,
  estado: "pendiente",
});

function aFormData(b: Borrador) {
  const d = new FormData();
  for (const k of ["id", "nombre", "ubicacion", "oficio", "celular", "visibilidad", "autorizacionMedio"] as const) d.set(k, b[k]);
  d.set("historia", b.historiaTexto);
  if (b.historiaAudio) d.set("historiaAudio", new File([b.historiaAudio], "historia", { type: b.historiaAudio.type }));
  if (b.foto) d.set("foto", new File([b.foto], "foto", { type: b.foto.type }));
  if (b.autorizacion) d.set("autorizacion", new File([b.autorizacion], "autorizacion", { type: b.autorizacion.type }));
  return d;
}

// Registro asistido pensado para el campo: todo se guarda primero en el celular y se envía cuando
// hay señal (brief, "Registro asistido").
export function RegistroAsistido() {
  const [enLinea, setEnLinea] = useState(true);
  const [pendientes, setPendientes] = useState<Borrador[]>([]);
  const [b, setB] = useState<Borrador | null>(null);
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const enviando = useRef(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  const recargar = useCallback(async () => setPendientes(await listarBorradores()), []);

  // Envía lo pendiente, uno por uno. Si falla, queda guardado para el próximo intento.
  const enviarPendientes = useCallback(async () => {
    if (enviando.current || !navigator.onLine) return;
    enviando.current = true;
    try {
      for (const p of await listarBorradores()) {
        await guardarBorrador({ ...p, estado: "enviando" });
        await recargar();
        try {
          const r = await enviarRegistro(aFormData(p));
          if (r.ok) await borrarBorrador(p.id);
          else await guardarBorrador({ ...p, estado: "error", error: r.error });
        } catch {
          await guardarBorrador({ ...p, estado: "pendiente" }); // se cayó la señal: se reintenta luego
        }
      }
    } finally {
      enviando.current = false;
      await recargar();
    }
  }, [recargar]);

  useEffect(() => {
    setEnLinea(navigator.onLine);
    recargar();
    const conectado = () => {
      setEnLinea(true);
      enviarPendientes();
    };
    const desconectado = () => setEnLinea(false);
    window.addEventListener("online", conectado);
    window.addEventListener("offline", desconectado);
    enviarPendientes();
    return () => {
      window.removeEventListener("online", conectado);
      window.removeEventListener("offline", desconectado);
    };
  }, [recargar, enviarPendientes]);

  useEffect(() => {
    if (b) titulo.current?.focus();
  }, [paso, b]);

  const cambiar = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((x) => (x ? { ...x, [k]: v } : x));

  function errorDelPaso(x: Borrador): string {
    if (paso === 0 && (x.nombre.trim().length < 2 || x.ubicacion.trim().length < 2)) return "Escribe el nombre y la vereda o ciudad.";
    if (paso === 0 && x.celular.trim() && !/^3\d{9}$/.test(x.celular.replace(/\D/g, "").replace(/^57/, ""))) {
      return "El celular debe tener 10 números y empezar por 3.";
    }
    if (paso === 1 && !x.historiaTexto.trim() && !x.historiaAudio) return "Escribe la historia o grábala.";
    if (paso === 3 && !x.autorizacion) return x.autorizacionMedio === "firma" ? "Falta la firma." : "Falta el audio de aceptación.";
    return "";
  }

  async function siguiente() {
    if (!b) return;
    const e = errorDelPaso(b);
    setError(e);
    if (e) return;
    // Cada paso queda guardado en el celular: si se apaga, no se pierde.
    await guardarBorrador(b);
    if (paso < PASOS.length - 1) {
      setPaso(paso + (paso === 1 && b.visibilidad === "reservado" ? 2 : 1));
      return;
    }
    setB(null);
    setPaso(0);
    setAviso(navigator.onLine ? "Registro guardado. Enviando…" : "Registro guardado en este celular. Se envía solo cuando vuelva la señal.");
    await recargar();
    enviarPendientes();
  }

  function atras() {
    setError("");
    setPaso(paso === 3 && b?.visibilidad === "reservado" ? 1 : Math.max(0, paso - 1));
  }

  if (!b) {
    return (
      <Pantalla
        titulo="Registro asistido"
        intro="Creas el perfil en nombre de la persona. Funciona sin señal: lo que registres se guarda en este celular y se envía solo cuando vuelva la conexión."
      >
        <p className="flex items-center gap-3 rounded-md bg-surface p-4 font-bold" role="status">
          {enLinea ? <Wifi aria-hidden className="size-6" /> : <WifiOff aria-hidden className="size-6" />}
          {enLinea ? "Con conexión" : "Sin conexión: se guarda en este celular"}
        </p>
        {aviso && <p role="status">{aviso}</p>}

        <Button ancho="completo" onClick={() => { setAviso(""); setError(""); setB(nuevo()); }}>
          Registrar a una persona
        </Button>

        <section aria-labelledby="pendientes" className="flex flex-col gap-3">
          <h2 id="pendientes" className="text-xl">
            Sin enviar ({pendientes.length})
          </h2>
          {pendientes.length ? (
            <ul className="flex flex-col gap-3">
              {pendientes.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 rounded-md border-2 border-border-subtle p-4">
                  <p className="text-lg font-bold">{p.nombre || "Sin nombre"}</p>
                  <p className="flex items-center gap-2">
                    {p.estado === "enviando" ? <CloudUpload aria-hidden className="size-5" /> : <CloudOff aria-hidden className="size-5" />}
                    {p.estado === "enviando" ? "Enviando…" : p.estado === "error" ? `No se pudo enviar: ${p.error}` : "Esperando señal"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.estado === "error" && (
                      <Button variant="secundario" size="normal" onClick={() => { setB(p); setPaso(0); }}>
                        <PenLine aria-hidden />
                        Corregir
                      </Button>
                    )}
                    <Button
                      variant="suave"
                      size="normal"
                      onClick={async () => {
                        if (confirm(`¿Borrar el registro de ${p.nombre || "esta persona"} de este celular?`)) {
                          await borrarBorrador(p.id);
                          await recargar();
                        }
                      }}
                    >
                      <Trash2 aria-hidden />
                      Borrar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted">Todo está enviado.</p>
          )}
          {pendientes.length > 0 && enLinea && (
            <Button variant="secundario" size="normal" className="self-start" onClick={enviarPendientes}>
              <CloudUpload aria-hidden />
              Enviar ahora
            </Button>
          )}
        </section>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Registrar a una persona"
      antesDelTitulo={
        <p className="text-base font-bold">
          Paso {paso + 1} de {PASOS.length}
        </p>
      }
    >
      <h2 ref={titulo} tabIndex={-1} className="text-xl focus-visible:outline-none">
        {PASOS[paso]}
      </h2>

      {paso === 0 && (
        <div className="flex flex-col gap-6">
          <Campo id="g-nombre" etiqueta="Nombre">
            {(p) => <Input {...p} value={b.nombre} onChange={(e) => cambiar("nombre", e.target.value)} />}
          </Campo>
          <Campo id="g-ubicacion" etiqueta="Vereda o ciudad">
            {(p) => <Input {...p} value={b.ubicacion} onChange={(e) => cambiar("ubicacion", e.target.value)} />}
          </Campo>
          <Campo id="g-oficio" etiqueta="¿A qué se dedica?">
            {(p) => <Input {...p} value={b.oficio} onChange={(e) => cambiar("oficio", e.target.value)} />}
          </Campo>
          <Campo id="g-celular" etiqueta="Celular de la persona (si tiene)" ayuda="Con este número podrá entrar después y ver su perfil.">
            {(p) => <Input {...p} type="tel" inputMode="numeric" value={b.celular} onChange={(e) => cambiar("celular", e.target.value)} />}
          </Campo>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-lg font-bold">¿La persona quiere que las empresas vean su nombre y su foto?</legend>
            <Opcion name="g-vis" value="reservado" checked={b.visibilidad === "reservado"} onChange={() => cambiar("visibilidad", "reservado")} titulo="No, reservado" descripcion="Solo ven su experiencia hasta que acepte conocerlas." />
            <Opcion name="g-vis" value="visible" checked={b.visibilidad === "visible"} onChange={() => cambiar("visibilidad", "visible")} titulo="Sí, visible" descripcion="Ven su nombre, su foto y su historia." />
          </fieldset>
        </div>
      )}

      {paso === 1 && (
        <div className="flex flex-col gap-6">
          <p className="text-text-muted">Pídale que cuente un problema difícil que resolvió: qué pasó, qué hizo y cómo terminó.</p>
          <Grabadora audio={b.historiaAudio} onAudio={(a) => cambiar("historiaAudio", a)} texto="Grabar la historia" />
          <Campo id="g-historia" etiqueta="O escríbala (opcional si la grabó)">
            {(p) => <Textarea {...p} rows={6} value={b.historiaTexto} onChange={(e) => cambiar("historiaTexto", e.target.value)} />}
          </Campo>
        </div>
      )}

      {paso === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-text-muted">Solo si la persona quiere aparecer con foto.</p>
          <label className="flex min-h-action cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-text px-4 text-lg font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus">
            <Camera aria-hidden className="size-6" />
            {b.foto ? "Tomar otra foto" : "Tomar foto"}
            <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => cambiar("foto", e.target.files?.[0] ?? null)} />
          </label>
          {b.foto && <p role="status" className="font-bold">Foto lista.</p>}
        </div>
      )}

      {paso === 3 && (
        <div className="flex flex-col gap-6">
          <div className="rounded-md bg-surface p-4">
            <p className="font-bold">Léele esto en voz alta:</p>
            <p>
              «Autorizo a {MARCA.nombre} a usar mis datos para crear mi perfil y conectarme con empresas. Mi edad nunca se le muestra a una
              empresa. Puedo pedir que borren mis datos cuando quiera.»
            </p>
          </div>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-lg font-bold">¿Cómo acepta?</legend>
            <Opcion name="g-medio" value="firma" checked={b.autorizacionMedio === "firma"} onChange={() => setB({ ...b, autorizacionMedio: "firma", autorizacion: null })} titulo="Firma en la pantalla" icono={<PenLine aria-hidden className="mt-0.5 size-6 shrink-0" />} />
            <Opcion name="g-medio" value="audio" checked={b.autorizacionMedio === "audio"} onChange={() => setB({ ...b, autorizacionMedio: "audio", autorizacion: null })} titulo="Diciendo «acepto» en un audio" icono={<Mic aria-hidden className="mt-0.5 size-6 shrink-0" />} />
          </fieldset>
          {b.autorizacionMedio === "firma" ? (
            <Firma onFirma={(png) => cambiar("autorizacion", png)} />
          ) : (
            <Grabadora audio={b.autorizacion} onAudio={(a) => cambiar("autorizacion", a)} texto="Grabar la aceptación" />
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Button ancho="completo" onClick={siguiente}>
          {paso < PASOS.length - 1 ? "Continuar" : "Guardar registro"}
        </Button>
        {paso > 0 ? (
          <Button variant="enlace" size="normal" onClick={atras}>
            Volver al paso anterior
          </Button>
        ) : (
          <Button variant="enlace" size="normal" onClick={() => setB(null)}>
            Cancelar
          </Button>
        )}
      </div>
    </Pantalla>
  );
}
