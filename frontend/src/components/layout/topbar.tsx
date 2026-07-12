"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  Search,
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUserStore } from "@/store/userStore";
import { useChatbotStore } from "@/store/chatbotStore";
import { clearTokens } from "@/lib/auth/api";
import { CreateChatbotDialog } from "@/components/chatbot/CreateChatbotDialog";

export function Topbar() {
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const user = useUserStore((s) => s.user);
  const currentChatbot = useChatbotStore((s) => s.currentChatbot);
  const chatbotId = useChatbotStore((s) => s.currentChatbotId);
  const chatbots = useChatbotStore((s) => s.chatbots);

  const [wsPopoverOpen, setWsPopoverOpen] = useState(false);
  const [wsSearch, setWsSearch] = useState("");
  const [cbPopoverOpen, setCbPopoverOpen] = useState(false);
  const [cbSearch, setCbSearch] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const PanelIcon = state === "collapsed" ? PanelLeft : PanelLeftClose;
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";
  const initial = displayName.charAt(0).toUpperCase();

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(wsSearch.toLowerCase()),
  );
  const filteredChatbots = chatbots.filter((c) =>
    c.name.toLowerCase().includes(cbSearch.toLowerCase()),
  );

  const workspaceId = currentWorkspaceId ?? "";

  function switchWorkspace(id: string) {
    setCurrentWorkspace(id);
    setWsPopoverOpen(false);
    setWsSearch("");
    router.push(`/workspace/${id}/agents`);
  }

  function switchChatbot(id: string) {
    setCbPopoverOpen(false);
    setCbSearch("");
    router.push(`/workspace/${workspaceId}/chatbot/${id}/playground`);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#D4D4D8] bg-white px-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
          aria-label="Toggle sidebar"
        >
          <PanelIcon size={18} />
        </button>

        <span className="mx-1 text-[#D4D4D8]">/</span>

        <Popover open={wsPopoverOpen} onOpenChange={setWsPopoverOpen}>
          <PopoverTrigger className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors outline-none focus-visible:ring-0">
            <span className="max-w-[160px] truncate">
              {currentWorkspace?.name ?? "Workspace"}
            </span>
            <ChevronDown size={14} className="text-[#A1A1AA]" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="w-72 rounded-lg bg-white p-1 shadow-md ring-1 ring-[#0A0A0A]/10"
          >
            <div className="relative px-2 pb-1.5 pt-1.5">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#A1A1AA]" />
              <input
                autoFocus
                value={wsSearch}
                onChange={(e) => setWsSearch(e.target.value)}
                placeholder="Search workspace..."
                className="h-9 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 pl-9 text-sm text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10"
              />
            </div>
            <div className="max-h-56 overflow-y-auto px-1">
              {filteredWorkspaces.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[#71717A]">
                  No workspaces found
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => switchWorkspace(ws.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0A0A0A] text-[11px] font-semibold text-white">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{ws.name}</span>
                      {ws.id === currentWorkspaceId && (
                        <Check size={16} className="shrink-0 text-[#0A0A0A]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-[#E4E4E7] mt-0.5 px-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setWsPopoverOpen(false);
                  router.push("/workspace/create");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
              >
                <Plus size={18} className="shrink-0 text-[#71717A]" />
                <span>Create or join workspace</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {currentChatbot && chatbotId && (
          <>
            <span className="text-[#A1A1AA] text-sm mx-0.5">/</span>

            <Popover open={cbPopoverOpen} onOpenChange={setCbPopoverOpen}>
              <PopoverTrigger className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors outline-none focus-visible:ring-0">
                <span className="max-w-[200px] truncate">
                  {currentChatbot.name}
                </span>
                <span className="inline-flex items-center rounded-md bg-[#F4F4F5] px-1.5 py-0.5 text-[11px] font-medium text-[#71717A]">
                  Agent
                </span>
                <ChevronDown size={14} className="text-[#A1A1AA]" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                sideOffset={4}
                className="w-72 rounded-lg bg-white p-1 shadow-md ring-1 ring-[#0A0A0A]/10"
              >
                <div className="relative px-2 pb-1.5 pt-1.5">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#A1A1AA]" />
                  <input
                    autoFocus
                    value={cbSearch}
                    onChange={(e) => setCbSearch(e.target.value)}
                    placeholder="Search Agent..."
                    className="h-9 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 pl-9 text-sm text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto px-1">
                  {chatbots.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-[#71717A]">
                      No agents in this workspace
                    </p>
                  ) : filteredChatbots.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-[#71717A]">
                      No agents found
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {filteredChatbots.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => switchChatbot(c.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                        >
                          <div className="flex size-6 shrink-0 items-center justify-center rounded bg-[#0A0A0A] text-[10px] font-semibold text-white">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 truncate">{c.name}</span>
                          {c.id === chatbotId && (
                            <Check size={14} className="shrink-0 text-[#0A0A0A]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-[#E4E4E7] mt-0.5 px-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCbPopoverOpen(false);
                      setCreateDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Plus size={16} className="shrink-0 text-[#71717A]" />
                    <span>Create agent</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>


          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => setAvatarOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0A0A] text-[12px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            {initial}
          </button>

          {avatarOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setAvatarOpen(false)}
              />
              <div className="absolute right-0 top-10 z-40 w-[240px] rounded-xl border border-[#D4D4D8] bg-white shadow-lg">
                <div className="px-3 py-3">
                  <p className="text-[14px] font-medium text-[#0A0A0A]">
                    {displayName}
                  </p>
                  <p className="text-[12px] text-[#71717A]">{displayEmail}</p>
                </div>

                <div className="border-t border-[#D4D4D8]" />

                <div className="py-1">
                  <Link
                    href={`/workspace/${currentWorkspaceId}/agents`}
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
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarOpen(false);
                      router.push("/workspace/create");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Plus size={16} className="text-[#71717A]" />
                    Create or join workspace
                  </button>
                </div>

                <div className="border-t border-[#D4D4D8]" />

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarOpen(false);
                      clearTokens();
                      useWorkspaceStore.getState().clear();
                      router.push("/login");
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

      <CreateChatbotDialog
        workspaceId={workspaceId}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </header>
  );
}
