"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberRoleMenuProps {
  onChangeRole: () => void;
  onRemove: () => void;
  isOwner: boolean;
}

export function MemberRoleMenu({
  onChangeRole,
  onRemove,
  isOwner,
}: MemberRoleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
          aria-label="Member actions"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={4}
        className="min-w-40 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-[#0A0A0A]/10"
      >
        <DropdownMenuItem
          onClick={onChangeRole}
          className="rounded-lg px-3 py-2 text-sm cursor-pointer"
        >
          Change role
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-1 my-0.5" />
        <DropdownMenuItem
          onClick={onRemove}
          className="rounded-lg px-3 py-2 text-sm text-[#EF4444] focus:text-[#EF4444] cursor-pointer"
        >
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MemberRoleMenuSkeleton() {
  return (
    <div className="flex size-8 items-center justify-center">
      <div className="size-4 rounded bg-[#F4F4F5] animate-pulse" />
    </div>
  );
}
