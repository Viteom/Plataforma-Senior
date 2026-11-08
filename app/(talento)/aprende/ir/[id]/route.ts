import { NextResponse, type NextRequest } from "next/server";

import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

// «Ir al curso» pasa por aquí: anota que la persona lo abrió (para mostrárselo en Emprende y en
// Aprende) y la lleva al curso. La dirección sale de la base, nunca del enlace: así nadie puede
// usar esta ruta para mandar a alguien a otra página.
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO = "https://oferta.senasofiaplus.edu.co/";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const volver = NextResponse.redirect(new URL("/aprende", request.url));
  if (!ID.test(id)) return volver;
  if (MODO_DEMO) return NextResponse.redirect(DEMO);

  const supabase = await crearClienteServidor();
  const { data: curso } = await supabase.from("courses").select("url").eq("id", id).eq("publicado", true).maybeSingle();
  const url = curso?.url as string | undefined;
  if (!url?.startsWith("https://")) return volver;

  // Si no se puede anotar, el curso se abre igual.
  await supabase.rpc("registrar_curso_visto", { curso: id });
  const salida = NextResponse.redirect(url);
  salida.headers.set("Cache-Control", "private, no-store");
  salida.headers.set("Referrer-Policy", "no-referrer");
  return salida;
}
