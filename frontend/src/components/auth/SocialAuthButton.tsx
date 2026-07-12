"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface SocialAuthButtonProps {
  icon: ReactNode;
  provider: string;
  disabled?: boolean;
  onClick: () => void;
}

export function SocialAuthButton({ icon, provider, disabled, onClick }: SocialAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full h-10 gap-2 rounded-lg text-sm font-medium"
    >
      <span className="shrink-0">{icon}</span>
      <span>Continue with {provider}</span>
    </Button>
  );
}
