"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface WorkspaceSwitcherProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function WorkspaceSwitcher({ open, onClose, triggerRef }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-full mt-1 w-[280px] rounded-xl border border-[#D4D4D8] bg-white shadow-lg"
    >
      <div className="py-1">
        {workspaces.map((ws) => {
          const isActive = ws.id === currentWorkspaceId;
          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => {
                setCurrentWorkspace(ws.id);
                onClose();
                router.push(`/workspace/${ws.id}/agents`);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0A0A0A] text-[11px] font-semibold text-white">
                {ws.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 truncate">{ws.name}</span>
              {isActive && <Check size={16} className="shrink-0 text-[#0A0A0A]" />}
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#D4D4D8]" />

      <div className="p-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/workspace/create");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
        >
          <Plus size={18} className="shrink-0" />
          <span>Create workspace</span>
        </button>
      </div>
    </div>
  );
}
