"use server";

import { revalidatePath } from "next/cache";

import { MODO_DEMO } from "@/lib/demo";
import { reiniciarProcesoDemo } from "@/lib/demo-proceso-cookie";

// Vuelve el proceso de la demostración al comienzo: la invitación recién enviada a la persona.
export async function reiniciarDemo() {
  if (!MODO_DEMO) return;
  await reiniciarProcesoDemo();
  revalidatePath("/", "layout");
}
