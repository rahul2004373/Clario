import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#E4E4E7] bg-white px-3 py-1 text-sm transition-all duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#A1A1AA] hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/5 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F4F4F5] disabled:opacity-50 aria-invalid:border-[#EF4444] aria-invalid:ring-2 aria-invalid:ring-[#EF4444]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
