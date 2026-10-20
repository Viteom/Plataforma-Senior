import { Construction } from "lucide-react";

// Marca lo que aún no funciona, para que nadie lo confunda con un error.
export function Pendiente({ hito, children }: { hito: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-md border-2 border-dashed border-border p-4">
      <Construction aria-hidden className="mt-0.5 size-6 shrink-0" />
      <p className="text-base">
        <span className="font-bold">Llega en el hito {hito}. </span>
        {children}
      </p>
    </div>
  );
}
