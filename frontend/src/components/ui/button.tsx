import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#0A0A0A] text-white hover:bg-[#27272A] shadow-sm active:scale-[0.98]",
        outline:
          "border-[#D4D4D8] bg-white text-[#0A0A0A] hover:bg-[#F4F4F5] hover:border-[#A1A1AA] active:bg-[#E4E4E7]",
        secondary:
          "bg-[#F4F4F5] text-[#0A0A0A] hover:bg-[#E4E4E7] active:bg-[#D4D4D8]",
        ghost:
          "text-[#0A0A0A] hover:bg-[#F4F4F5]",
        destructive:
          "bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2]",
        link: "text-[#0A0A0A] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-4",
        xs: "h-6 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
        lg: "h-11 gap-2 px-5",
        icon: "size-9",
        "icon-sm": "size-7",
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
