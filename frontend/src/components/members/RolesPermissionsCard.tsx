"use client";

import { Crown, Shield, Eye } from "lucide-react";
import type { WorkspaceMember, MemberRole } from "@/lib/api/members";

interface RolesPermissionsCardProps {
  members: WorkspaceMember[];
}

interface RoleDef {
  role: MemberRole;
  icon: typeof Crown;
  label: string;
  description: string;
}

const ROLES: RoleDef[] = [
  {
    role: "OWNER",
    icon: Crown,
    label: "Owner",
    description: "Full access to the workspace, including deleting it.",
  },
  {
    role: "ADMIN",
    icon: Shield,
    label: "Admin",
    description:
      "Can manage workspace settings, members, and view everything, but cannot delete the workspace.",
  },
  {
    role: "VIEWER",
    icon: Eye,
    label: "Viewer",
    description:
      "Read-only access to the workspace and its agents.",
  },
];

export function RolesPermissionsCard({ members }: RolesPermissionsCardProps) {
  return (
    <div className="rounded-xl border border-[#D4D4D8] bg-white">
      <div className="px-5 py-4">
        <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
          Roles and permissions
        </h2>
      </div>
      <div className="border-t border-[#D4D4D8]">
        {ROLES.map((r, i) => {
          const Icon = r.icon;
          const count = members.filter((m) => m.role === r.role).length;

          return (
            <div
              key={r.role}
              className={`flex items-start gap-4 px-5 py-4 ${
                i < ROLES.length - 1 ? "border-b border-[#D4D4D8]" : ""
              }`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F4F5]">
                <Icon size={16} className="text-[#71717A]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#0A0A0A]">
                    {r.label}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-medium text-[#71717A]">
                    {count}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-[#71717A] leading-relaxed">
                  {r.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
