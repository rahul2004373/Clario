"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  const router = useRouter();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex shrink-0 items-center border-b border-[#D4D4D8] px-3 py-3">
      {collapsed ? (
        <div className="flex w-full items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A0A0A] text-sm font-bold text-white">
            C
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setSwitcherOpen((o) => !o)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0A0A0A] text-[11px] font-semibold text-white">
                {currentWorkspace?.name?.charAt(0).toUpperCase() ?? "C"}
              </div>
              <span className="flex-1 truncate text-left">
                {currentWorkspace?.name ?? "Workspace"}
              </span>
              <ChevronDown size={14} className="shrink-0 text-[#A1A1AA]" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 w-[280px] rounded-xl border border-[#D4D4D8] bg-white shadow-lg">
                  <div className="py-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setCurrentWorkspace(ws.id);
                          setSwitcherOpen(false);
                          router.push(`/workspace/${ws.id}/agents`);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0A0A0A] text-[11px] font-semibold text-white">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{ws.name}</span>
                        {ws.id === currentWorkspaceId && (
                          <Check size={16} className="shrink-0 text-[#0A0A0A]" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[#D4D4D8]" />
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSwitcherOpen(false);
                        router.push("/workspace/create");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                    >
                      <Plus size={18} className="shrink-0" />
                      <span>Create workspace</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
