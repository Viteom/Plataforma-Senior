import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Primario y secundario miden 56 px; todo lo demás, mínimo 44 px.
// Una sola variante "primario" visible por pantalla.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-6 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primario: "bg-primary text-on-primary hover:bg-primary-hover",
        // Sobre fondos cobalto o bosque, donde el primario no se distingue.
        acento: "bg-accent text-on-accent hover:bg-accent-hover",
        secundario: "border-2 border-text bg-bg text-text hover:bg-surface",
        suave: "bg-surface text-text hover:bg-surface-strong",
        enlace: "text-text underline underline-offset-4 hover:decoration-2",
      },
      size: {
        accion: "min-h-action px-6 text-lg",
        normal: "min-h-tap px-4 text-base",
        icono: "size-tap",
      },
      ancho: {
        completo: "w-full",
        auto: "",
      },
    },
    compoundVariants: [{ variant: "enlace", className: "px-1" }],
    defaultVariants: { variant: "primario", size: "accion", ancho: "auto" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, ancho, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, ancho }), className)} {...props} />;
}

export { Button, buttonVariants };
