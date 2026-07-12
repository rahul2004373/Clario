"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">{children}</div>
      </main>
    </SidebarProvider>
  );
}
