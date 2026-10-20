import * as React from "react";

import { cn } from "@/lib/utils";

function Tarjeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-3 rounded-md border-2 border-border-subtle bg-bg p-5", className)}
      {...props}
    />
  );
}

export { Tarjeta };
