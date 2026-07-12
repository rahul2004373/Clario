"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Plus,
  LayoutDashboard,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUserStore } from "@/store/userStore";
import { clearTokens } from "@/lib/auth/api";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const user = useUserStore((s) => s.user);

  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [wsPopoverOpen, setWsPopoverOpen] = React.useState(false);

  const workspacePrefix = currentWorkspaceId
    ? `/workspace/${currentWorkspaceId}`
    : "";

  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "user@clairo.com";
  const initial = displayName.charAt(0).toUpperCase();

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  function switchWorkspace(id: string) {
    setCurrentWorkspace(id);
    setWsPopoverOpen(false);
    setSearch("");
    router.push(`/workspace/${id}/agents`);
  }

  const wsSide = collapsed ? "right" : "bottom";
  const wsAlign = collapsed ? "start" : "start";
  const wsOffset = collapsed ? 12 : 8;

  return (
    <SidebarPrimitive collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-2">
        <Popover open={wsPopoverOpen} onOpenChange={setWsPopoverOpen}>
          <PopoverTrigger className="w-full select-none">
            <SidebarMenuButton
              render={<div />}
              size="lg"
              className="h-10 rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-[#0A0A0A] text-sm font-medium text-white">
                {currentWorkspace?.name?.charAt(0).toUpperCase() ?? "C"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">
                  {currentWorkspace?.name ?? "Workspace"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-[#A1A1AA] group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
              className="w-80 rounded-lg bg-white p-0.5 py-2 shadow-md ring-1 ring-[#0A0A0A]/10"
            align={wsAlign}
            side={wsSide}
            sideOffset={wsOffset}
          >
            <div className="relative px-3 pb-1.5 pt-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-[#A1A1AA]" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspace..."
                className="h-10 w-full rounded-lg border border-[#D4D4D8] bg-white px-3 pl-9 text-sm text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10"
              />
            </div>
            <div className="max-h-56 overflow-y-auto px-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[#71717A]">
                  No workspaces found
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filtered.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => switchWorkspace(ws.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A] text-[11px] font-semibold text-white">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{ws.name}</span>
                      {ws.id === currentWorkspaceId && (
                        <Check className="size-4 shrink-0 text-[#0A0A0A]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-0.5 border-t border-[#E4E4E7] px-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setWsPopoverOpen(false);
                  router.push("/workspace/create");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
              >
                <Plus className="size-4 shrink-0 text-[#71717A]" />
                <span>Create or join workspace</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={`${workspacePrefix}/agents`} />}
                  isActive={isActive(`${workspacePrefix}/agents`)}
                  tooltip="Agents"
                >
                  <Bot />
                  <span>Agents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-1">
          <SidebarGroupLabel
            render={
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="flex w-full items-center gap-2"
              />
            }
          >
            <span className="flex-1 text-left text-[11px] font-medium uppercase tracking-wide text-[#A1A1AA]">
              Workspace settings
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-[#A1A1AA] transition-transform duration-150 ${
                settingsOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </SidebarGroupLabel>
          {settingsOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href={`${workspacePrefix}/settings/general`} />}
                        isActive={isActive(`${workspacePrefix}/settings/general`)}
                        className="px-3"
                      >
                        General
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href={`${workspacePrefix}/settings/members`} />}
                        isActive={isActive(`${workspacePrefix}/settings/members`)}
                        className="px-3"
                      >
                        Members
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full select-none">
                <SidebarMenuButton
                  render={<div />}
                  size="lg"
                  className="rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <UserAvatar
                    name={displayName}
                    email={displayEmail}
                    avatarUrl={user?.avatarUrl}
                    size={8}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-[#71717A]">
                      {displayEmail}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 text-[#A1A1AA] group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-64 rounded-lg bg-white p-1 shadow-md ring-1 ring-[#0A0A0A]/10"
                align="end"
                side="right"
                sideOffset={12}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={displayName}
                        email={displayEmail}
                        avatarUrl={user?.avatarUrl}
                        size={10}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0A0A0A] truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-[#71717A] truncate">
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="mx-1 my-1" />
                <DropdownMenuGroup className="flex flex-col gap-0.5">
                  <DropdownMenuItem
                    onClick={() => router.push(`${workspacePrefix}/agents`)}
                    className="rounded-xl px-3 py-2.5 gap-3 text-sm cursor-pointer"
                  >
                    <LayoutDashboard className="size-4 shrink-0 text-[#71717A]" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/account/settings")}
                    className="rounded-xl px-3 py-2.5 gap-3 text-sm cursor-pointer"
                  >
                    <Settings className="size-4 shrink-0 text-[#71717A]" />
                    <span>Account settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/workspace/create")}
                    className="rounded-xl px-3 py-2.5 gap-3 text-sm cursor-pointer"
                  >
                    <Plus className="size-4 shrink-0 text-[#71717A]" />
                    <span>Create or join workspace</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="mx-1 my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    clearTokens();
                    useWorkspaceStore.getState().clear();
                    router.push("/login");
                  }}
                  className="rounded-xl px-3 py-2.5 gap-3 text-sm text-[#EF4444] focus:text-[#EF4444] cursor-pointer mt-0.5"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
