import {
  Bot,
  MessagesSquare,
  BookOpenText,
  Play,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export function getNavigation(workspaceId: string): {
  primary: NavItem[];
  secondary: NavItem[];
} {
  return {
    primary: [
      {
        label: "Agents",
        icon: Bot,
        href: `/workspace/${workspaceId}/agents`,
      },
      {
        label: "Playground",
        icon: Play,
        href: `/workspace/${workspaceId}/playground`,
      },
      {
        label: "Conversations",
        icon: MessagesSquare,
        href: `/workspace/${workspaceId}/conversations`,
      },
      {
        label: "Sources",
        icon: BookOpenText,
        href: `/workspace/${workspaceId}/sources`,
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: `/workspace/${workspaceId}/analytics`,
      },
    ],
    secondary: [
      {
        label: "Settings",
        icon: Settings,
        href: `/workspace/${workspaceId}/settings/general`,
      },
    ],
  };
}
