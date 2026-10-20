import { CircleAlert } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-sm border-2 border-border bg-bg px-4 text-base text-text placeholder:text-text-muted focus-visible:border-text aria-[invalid=true]:border-danger";

type CampoProps = {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  className?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    className: string;
  }) => React.ReactNode;
};

// Etiqueta siempre visible encima; ayuda y error enlazados con aria-describedby.
function Campo({ id, etiqueta, ayuda, error, className, children }: CampoProps) {
  const ayudaId = ayuda ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [ayudaId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-lg font-bold">
        {etiqueta}
      </label>
      {ayuda && (
        <p id={ayudaId} className="text-base text-text-muted">
          {ayuda}
        </p>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        className: controlBase,
      })}
      {error && (
        <p id={errorId} className="flex items-start gap-2 text-base font-bold text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("min-h-action", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("min-h-40 py-3", className)} {...props} />;
}

export { Campo, Input, Textarea };
