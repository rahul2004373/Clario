"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronDown, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  workspaceId: string;
}

export function WorkspaceSidebar({ workspaceId }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(true);

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-[#D4D4D8] bg-white">
      <nav className="flex flex-col gap-0.5 p-3">
        <Link
          href={`/workspace/${workspaceId}/agents`}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(`/workspace/${workspaceId}/agents`)
              ? "bg-[#0A0A0A] text-white"
              : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]",
          )}
        >
          <Bot size={18} />
          Agents
        </Link>
      </nav>

      <div className="px-3">
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
        >
          <Settings size={18} />
          <span className="flex-1 text-left">Workspace settings</span>
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              settingsOpen ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>

        {settingsOpen && (
          <div className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-[#D4D4D8] pl-2">
            <Link
              href={`/workspace/${workspaceId}/settings/general`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(`/workspace/${workspaceId}/settings/general`)
                  ? "bg-[#F4F4F5] font-medium text-[#0A0A0A]"
                  : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]",
              )}
            >
              General
            </Link>
            <Link
              href={`/workspace/${workspaceId}/settings/members`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(`/workspace/${workspaceId}/settings/members`)
                  ? "bg-[#F4F4F5] font-medium text-[#0A0A0A]"
                  : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]",
              )}
            >
              <Users size={16} className="shrink-0" />
              Members
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
