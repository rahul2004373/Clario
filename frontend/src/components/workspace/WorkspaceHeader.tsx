"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Clock,
  Gift,
  Code,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { clearTokens } from "@/lib/auth/api";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

export function WorkspaceHeader() {
  const router = useRouter();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const switcherRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);

  const userName = "User";
  const userEmail = "user@clairo.com";

  function handleSignOut() {
    clearTokens();
    useWorkspaceStore.getState().clear();
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#D4D4D8] bg-white px-4">
      <div className="flex items-center gap-1">
        <button
          ref={switcherRef}
          type="button"
          onClick={() => setSwitcherOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="6" fill="#0A0A0A" />
            <text x="7" y="20" fontSize="15" fontWeight="700" fill="white" fontFamily="system-ui">
              C
            </text>
          </svg>
          <span className="text-[#A1A1AA] text-sm mx-0.5">/</span>
          <span className="max-w-[160px] truncate">
            {currentWorkspace?.name ?? "Workspace"}
          </span>
          <ChevronDown size={14} className="text-[#A1A1AA]" />
        </button>
        <WorkspaceSwitcher
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
          triggerRef={switcherRef}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
          aria-label="History"
        >
          <Clock size={16} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
          aria-label="Gift"
        >
          <Gift size={16} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
          aria-label="API"
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={16} />
        </button>

        <div className="ml-1">
          <button
            ref={avatarRef}
            type="button"
            onClick={() => setAvatarOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0A0A] text-[12px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            {userName.charAt(0).toUpperCase()}
          </button>

          {avatarOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setAvatarOpen(false)}
              />
              <div
                ref={avatarDropdownRef}
                className="absolute right-4 top-12 z-40 w-[240px] rounded-xl border border-[#D4D4D8] bg-white shadow-lg"
              >
                <div className="px-3 py-3">
                  <p className="text-[14px] font-medium text-[#0A0A0A]">{userName}</p>
                  <p className="text-[12px] text-[#71717A]">{userEmail}</p>
                </div>

                <div className="border-t border-[#D4D4D8]" />

                <div className="py-1">
                  <Link
                    href={`/workspace/${currentWorkspace?.id}/agents`}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                  >
                    <LayoutDashboard size={16} className="text-[#71717A]" />
                    Dashboard
                  </Link>
                  <Link
                    href="/account/settings"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Settings size={16} className="text-[#71717A]" />
                    Account settings
                  </Link>
                  <Link
                    href="/workspace/create"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Plus size={16} className="text-[#71717A]" />
                    Create or join workspace
                  </Link>
                </div>

                <div className="border-t border-[#D4D4D8]" />

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
