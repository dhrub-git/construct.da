import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[14px] border border-input bg-secondary/70 px-4 py-2 text-base text-foreground transition-all duration-200 ease-out outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 hover:border-border disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-card/55 disabled:text-muted-foreground/60 disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/35 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
