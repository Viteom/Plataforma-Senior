"use client";

import { startTransition, useActionState } from "react";

// useActionState sin el reinicio automático de React 19: cuando un formulario usa `action`, React
// lo vacía al terminar, y tras un error la persona tendría que escribir todo de nuevo.
//
// Uso: <form action={enviar} onSubmit={alEnviar}>. Con la página cargada, alEnviar toma el envío
// (sin reinicio). Antes de que cargue, el navegador envía por POST a la misma acción del servidor,
// así que nada queda en la URL.
export function useAccion<E extends object>(accion: (previo: E, datos: FormData) => Promise<E>, inicial: E) {
  const [estado, enviar, pendiente] = useActionState<E, FormData>(
    accion as (previo: Awaited<E>, datos: FormData) => Promise<E>,
    inicial as Awaited<E>,
  );

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    if (e.defaultPrevented) return; // otro manejador ya decidió (por ejemplo, validación)
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => enviar(datos));
  }

  return { estado, enviar, pendiente, alEnviar };
}
