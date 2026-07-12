"use client";

import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <div className="relative flex w-full flex-col md:w-[45%]">
        <div className="absolute left-8 top-8 z-10 md:left-10 md:top-10">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" fill="#0A0A0A" />
              <text x="7" y="20" fontSize="15" fontWeight="700" fill="white" fontFamily="system-ui">
                C
              </text>
            </svg>
            <span className="text-lg font-semibold tracking-tight text-[#0A0A0A]">Clairo</span>
          </div>
        </div>
        <div className="flex h-full w-full items-center justify-center px-8 md:px-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
      <div className="hidden md:flex md:w-[55%]">
        <AuthBrandPanel />
      </div>
    </div>
  );
}
