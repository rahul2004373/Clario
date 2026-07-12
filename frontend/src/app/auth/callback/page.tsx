"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { syncUser, getStoredTokens, storeTokens } from "@/lib/auth/api";
import { getWorkspaces } from "@/lib/api/workspace";
import { UnauthorizedError } from "@/lib/api/client";
import { useUserStore } from "@/store/userStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);

  useEffect(() => {
    async function handleCallback() {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          storeTokens({ access_token: accessToken, refresh_token: refreshToken });
          window.location.hash = "";
        }
      }

      const tokens = getStoredTokens();
      if (!tokens.accessToken) {
        setError("No session found. Please sign in again.");
        return;
      }

      try {
        await syncUser();
        await fetchCurrentUser();
        const { workspaces } = await getWorkspaces();
        if (workspaces.length === 0) {
          router.push("/workspace/create");
        } else {
          const lastUsedId = localStorage.getItem("currentWorkspaceId");
          const target = lastUsedId && workspaces.some((w) => w.id === lastUsedId) ? lastUsedId : workspaces[0].id;
          localStorage.setItem("currentWorkspaceId", target);
          router.push(`/workspace/${target}/agents`);
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          router.push("/login");
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong completing sign in.");
        }
      }
    }

    handleCallback();
  }, [router, fetchCurrentUser]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white px-6">
        <p className="text-sm text-[#EF4444]">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-[13px] font-medium text-[#0A0A0A] hover:text-[#52525B] transition-colors"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 size={24} className="animate-spin text-[#71717A]" />
    </div>
  );
}
