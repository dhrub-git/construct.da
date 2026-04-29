import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[14px] border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/35 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-b from-[#35ecdd] to-primary text-primary-foreground shadow-[0_10px_24px_rgba(46,230,214,0.25)] hover:-translate-y-px hover:from-[#40f4e5] hover:to-[#22cfc1] hover:shadow-[0_14px_30px_rgba(46,230,214,0.32)]",
        outline:
          "border-border bg-secondary/75 text-white/88 hover:-translate-y-px hover:border-white/20 hover:bg-secondary aria-expanded:bg-secondary aria-expanded:text-foreground",
        secondary:
          "border border-border bg-white/5 text-white/84 hover:-translate-y-px hover:border-white/20 hover:bg-white/10 aria-expanded:border-white/20",
        ghost:
          "text-white/78 hover:-translate-y-px hover:bg-white/8 hover:text-white aria-expanded:bg-white/8 aria-expanded:text-white",
        destructive:
          "bg-destructive text-white shadow-[0_8px_20px_rgba(239,68,68,0.25)] hover:-translate-y-px hover:bg-red-500 hover:shadow-[0_12px_26px_rgba(239,68,68,0.32)] focus-visible:border-red-300/50 focus-visible:ring-red-400/35",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-8 gap-1 rounded-[12px] px-3 text-xs in-data-[slot=button-group]:rounded-[12px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1.5 rounded-[13px] px-4 text-sm in-data-[slot=button-group]:rounded-[13px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-13 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-12",
        "icon-xs":
          "size-8 rounded-[12px] in-data-[slot=button-group]:rounded-[12px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-10 rounded-[13px] in-data-[slot=button-group]:rounded-[13px]",
        "icon-lg": "size-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
