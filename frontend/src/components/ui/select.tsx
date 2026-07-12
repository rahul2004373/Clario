"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  closeMenu: () => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) {
    throw new Error("Select compound components must be used within <Select>")
  }
  return ctx
}

function Select({
  value,
  onValueChange,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, closeMenu: () => setOpen(false) }}>
      <MenuPrimitive.Root open={open} onOpenChange={setOpen} data-slot="select">
        {children}
      </MenuPrimitive.Root>
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#E4E4E7] bg-white px-4 text-[13px] text-[#0A0A0A] outline-none transition-all hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/5 data-popup-open:border-[#D4D4D8]",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        size={15}
        className="shrink-0 text-[#A1A1AA] transition-transform data-popup-open:rotate-180"
      />
    </MenuPrimitive.Trigger>
  )
}

function SelectValue({
  placeholder,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { placeholder?: string }) {
  const { value } = useSelectContext()
  return (
    <span
      data-slot="select-value"
      className={cn(
        "flex-1 truncate text-left",
        !value && !children && "text-[#A1A1AA]",
        className
      )}
      {...props}
    >
      {children ?? (value || placeholder)}
    </span>
  )
}

function SelectContent({
  className,
  children,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: "start" | "end" | "center"
  alignOffset?: number
  side?: "top" | "bottom"
  sideOffset?: number
}) {
  const { value } = useSelectContext()

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "z-50 w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-hidden rounded-xl bg-white p-1 text-[#0A0A0A] shadow-md ring-1 ring-[#0A0A0A]/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <MenuPrimitive.RadioGroup value={value}>
            {children}
          </MenuPrimitive.RadioGroup>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function SelectItem({
  value,
  className,
  children,
  ...props
}: Omit<MenuPrimitive.RadioItem.Props, "value"> & { value: string }) {
  const ctx = useSelectContext()
  const isSelected = ctx.value === value

  return (
    <MenuPrimitive.RadioItem
      data-slot="select-item"
      data-selected={isSelected}
      value={value}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 pr-8 text-[13px] outline-none select-none transition-colors focus:bg-[#F4F4F5] data-disabled:pointer-events-none data-disabled:opacity-50",
        isSelected && "font-medium text-[#0A0A0A]",
        !isSelected && "text-[#52525B]",
        className
      )}
      onClick={() => {
        ctx.onValueChange(value)
        ctx.closeMenu()
      }}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="pointer-events-none absolute right-2 flex items-center justify-center">
          <CheckIcon size={14} className="text-[#0A0A0A]" />
        </span>
      )}
    </MenuPrimitive.RadioItem>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
