"use client";

import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getNavigation } from "@/config/navigation";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  if (!workspaceId) return null;

  const { primary, secondary } = getNavigation(workspaceId);

  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      <div className="flex flex-col gap-0.5">
        {primary.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#A1A1AA] transition-all duration-150",
            collapsed ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-100",
          )}
        >
          Workspace
        </span>
        {secondary.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  );
}
