"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { cn } from "@/lib/utils";

export function MobileSidebar() {
  const mobileOpen = useSidebarState((s) => s.mobileOpen);
  const setMobileOpen = useSidebarState((s) => s.setMobileOpen);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#D4D4D8] bg-white transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[#D4D4D8] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0A] text-sm font-bold text-white">
              C
            </div>
            <span className="text-base font-semibold tracking-tight text-[#0A0A0A]">Clairo</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarNav collapsed={false} />
        <SidebarFooter collapsed={false} />
      </aside>
    </>
  );
}
