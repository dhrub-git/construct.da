import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-[14px] border border-input bg-secondary/70 px-4 py-3 text-base text-foreground transition-all duration-200 ease-out outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 hover:border-border disabled:cursor-not-allowed disabled:bg-card/55 disabled:text-muted-foreground/60 disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/35 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
