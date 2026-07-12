"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/navigation";

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
}

export function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef<HTMLAnchorElement>(null);

  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="relative">
      <Link
        ref={itemRef}
        href={item.href}
        onMouseEnter={() => {
          if (collapsed) {
            tooltipTimer.current = setTimeout(() => setShowTooltip(true), 300);
          }
        }}
        onMouseLeave={() => {
          if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
          setShowTooltip(false);
        }}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          collapsed ? "justify-center px-0" : "",
          isActive
            ? "bg-[#F4F4F5] text-[#0A0A0A]"
            : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]",
        )}
        aria-label={collapsed ? item.label : undefined}
      >
        <item.icon
          size={20}
          className={cn(
            "shrink-0 transition-colors duration-150",
            isActive ? "text-[#0A0A0A]" : "text-[#A1A1AA] group-hover:text-[#0A0A0A]",
          )}
        />
        <span
          className={cn(
            "overflow-hidden text-nowrap transition-all duration-150",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          {item.label}
        </span>
      </Link>

      {collapsed && showTooltip && (
        <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2">
          <div className="rounded-md border border-[#D4D4D8] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#0A0A0A] shadow-sm whitespace-nowrap">
            {item.label}
          </div>
        </div>
      )}
    </div>
  );
}
