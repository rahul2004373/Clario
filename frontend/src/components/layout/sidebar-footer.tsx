"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { clearTokens } from "@/lib/auth/api";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const router = useRouter();
  const closeMobile = () => useSidebarState.getState().setMobileOpen(false);

  function handleSignOut() {
    clearTokens();
    useWorkspaceStore.getState().clear();
    closeMobile();
    router.push("/login");
  }

  return (
    <div className="shrink-0 border-t border-[#D4D4D8] px-3 py-3">
      <div className={cn("flex flex-col gap-0.5", collapsed && "items-center")}>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
          aria-label={collapsed ? "Account" : undefined}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A0A0A] text-[11px] font-medium text-white">
            U
          </div>
          <span
            className={cn(
              "overflow-hidden text-nowrap transition-all duration-150",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Account
          </span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#71717A] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
          aria-label={collapsed ? "Sign out" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          <span
            className={cn(
              "overflow-hidden text-nowrap transition-all duration-150",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Sign out
          </span>
        </button>
      </div>
    </div>
  );
}
