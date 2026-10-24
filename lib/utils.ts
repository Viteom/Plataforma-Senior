import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Los tamaños de letra propios (globals.css) se declaran para que tailwind-merge no los confunda
// con colores de texto y borre, por ejemplo, «text-on-primary» al lado de «text-gigante».
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "display-lg", "titular", "afiche", "gigante"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
