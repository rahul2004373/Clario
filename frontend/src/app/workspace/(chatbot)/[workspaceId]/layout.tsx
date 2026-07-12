"use client";

import { useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Bot, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUserStore } from "@/store/userStore";
import { clearTokens, getStoredTokens } from "@/lib/auth/api";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function ChatbotWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;

  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const error = useWorkspaceStore((s) => s.error);
  const isUnauthorized = useWorkspaceStore((s) => s.isUnauthorized);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens.accessToken) {
      fetchCurrentUser();
    }
    fetchWorkspaces();
  }, [fetchWorkspaces, fetchCurrentUser]);

  useEffect(() => {
    if (isUnauthorized) {
      clearTokens();
      router.push("/login");
    }
  }, [isUnauthorized, router]);

  useEffect(() => {
    if (
      !isLoading &&
      currentWorkspaceId &&
      currentWorkspaceId !== workspaceId
    ) {
      const wsExists = workspaces.some((w) => w.id === workspaceId);
      if (!wsExists) {
        router.push(`/workspace/${currentWorkspaceId}/agents`);
      }
    }
  }, [isLoading, currentWorkspaceId, workspaceId, workspaces, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  if (workspaces.length === 0 && !isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white px-6">
        <div className="flex size-12 items-center justify-center rounded-xl bg-[#F4F4F5]">
          <Bot size={24} className="text-[#71717A]" />
        </div>
        <h2 className="text-lg font-semibold text-[#0A0A0A]">
          No workspace yet
        </h2>
        <p className="max-w-sm text-center text-sm text-[#71717A]">
          Create a workspace to start building AI agents with your team.
        </p>
        <a
          href="/workspace/create"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0A0A0A] px-5 text-sm font-medium text-white transition-all hover:bg-[#27272A] active:scale-[0.98]"
        >
          <Plus size={16} className="mr-1.5" />
          Create workspace
        </a>
        {error && <p className="mt-2 text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }

  if (error && workspaces.length > 0) {
    return (
      <div className="flex h-screen flex-col">
        <SidebarProvider>
          <main className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <div className="flex flex-1 items-center justify-center bg-[#FAFAFA]">
              <div className="flex flex-col items-center gap-4 p-8">
                <p className="text-[14px] text-[#71717A]">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchWorkspaces()}
                  className="text-[13px] font-medium text-[#0A0A0A] hover:text-[#52525B] transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <SidebarProvider>
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="flex-1 overflow-hidden bg-[#FAFAFA]">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
