"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Play,
  BarChart3,
  Database,
  Zap,
  Puzzle,
  Code,
  Settings,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotSidebarProps {
  workspaceId: string;
  chatbotId: string;
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: typeof ChevronDown;
  label: string;
  active: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#0A0A0A] text-white"
          : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]",
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-[#0A0A0A] px-1.5 py-[1px] text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function CollapsibleSection({
  label,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  label: string;
  icon: typeof ChevronDown;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight
          size={14}
          className={cn(
            "shrink-0 text-[#A1A1AA] transition-transform duration-150",
            open && "rotate-90",
          )}
        />
      </button>
      {open && <div className="ml-3 mt-0.5 flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

function SubNavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-[#0A0A0A] text-white"
          : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]",
      )}
    >
      {label}
    </Link>
  );
}

export function ChatbotSidebar({
  workspaceId,
  chatbotId,
}: ChatbotSidebarProps) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}/chatbot/${chatbotId}`;

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[#D4D4D8] bg-white overflow-y-auto">
      <nav className="flex flex-col gap-0.5 p-3">
        <NavItem
          href={`${base}/playground`}
          icon={Play}
          label="Playground"
          active={isActive(`${base}/playground`)}
        />
      </nav>

      <div className="px-3 pb-1">
        <CollapsibleSection label="Activity" icon={Activity}>
          <SubNavItem
            href={`${base}/activity/logs`}
            label="Chat logs"
            active={isActive(`${base}/activity/logs`)}
          />
        </CollapsibleSection>
      </div>

      <div className="px-3 pb-1">
        <NavItem
          href={`${base}/analytics`}
          icon={BarChart3}
          label="Analytics"
          active={isActive(`${base}/analytics`)}
        />
      </div>

      <div className="px-3 pb-1">
        <CollapsibleSection label="Data sources" icon={Database}>
          <SubNavItem
            href={`${base}/sources/files`}
            label="Files"
            active={isActive(`${base}/sources/files`)}
          />
          <SubNavItem
            href={`${base}/sources/text`}
            label="Text snippets"
            active={isActive(`${base}/sources/text`)}
          />
          <SubNavItem
            href={`${base}/sources/website`}
            label="Website"
            active={isActive(`${base}/sources/website`)}
          />
        </CollapsibleSection>
      </div>

      <div className="px-3 pb-1">
        <NavItem
          href={`${base}/actions`}
          icon={Zap}
          label="Actions"
          active={isActive(`${base}/actions`)}
        />
      </div>

      <div className="px-3 pb-1">
        <NavItem
          href={`${base}/widgets`}
          icon={Puzzle}
          label="Widgets"
          active={isActive(`${base}/widgets`)}
        />
      </div>

      <div className="px-3 pb-1">
        <NavItem
          href={`${base}/deploy`}
          icon={Code}
          label="Deploy"
          active={isActive(`${base}/deploy`)}
        />
      </div>

      <div className="px-3 pb-1">
        <NavItem
          href={`${base}/settings`}
          icon={Settings}
          label="Settings"
          active={isActive(`${base}/settings`)}
        />
      </div>
    </aside>
  );
}
