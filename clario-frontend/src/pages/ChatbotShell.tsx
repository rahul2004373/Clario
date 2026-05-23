import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Database,
  LayoutTemplate,
  Send,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import PlaygroundTab from "./chatbot-tabs/PlaygroundTab";
import ChatLogsTab from "./chatbot-tabs/ChatLogsTab";
import DataSourceTab from "./chatbot-tabs/DataSourceTab";
import WidgetTab from "./chatbot-tabs/WidgetTab";
import DeployTab from "./chatbot-tabs/DeployTab";

type TabType = "playground" | "chatlogs" | "datasource" | "widgets" | "deploy";

export default function ChatbotShell() {
  const { workspaceId, chatbotId } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("playground");

  const navItems = [
    { id: "playground", label: "Playground", icon: Bot },
    { id: "chatlogs", label: "Chat Logs", icon: MessageSquare },
    { id: "datasource", label: "Data Sources", icon: Database },
    { id: "widgets", label: "Widgets", icon: LayoutTemplate },
    { id: "deploy", label: "Deploy", icon: Send },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile, visible on lg screens */}
      <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-[#fbfbfd] dark:bg-muted/10 lg:flex lg:flex-col">
        <div className="border-b border-border/60 px-5 py-5">
          <Link
            to={`/dashboard/${workspaceId}`}
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>

          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Chatbot Studio
              </h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Manage your bot setup, content, widgets, and deployment.
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </div>

          <div className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm transition-all",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-opacity",
                    activeTab === item.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-50"
                  )}
                />
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header - Only visible on small screens */}
        <header className="border-b border-border/60 bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {navItems.find((item) => item.id === activeTab)?.label}
              </h2>
            </div>

            <Link to={`/dashboard/${workspaceId}`}>
              <Button variant="outline" size="sm" className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </header>

        {/* Tab Content Containers */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className={activeTab === "playground" ? "block h-full" : "hidden h-full"}>
            <PlaygroundTab chatbotId={chatbotId!} workspaceId={workspaceId!} />
          </div>

          <div className={activeTab === "chatlogs" ? "block h-full" : "hidden h-full"}>
            <ChatLogsTab chatbotId={chatbotId!} />
          </div>

          <div className={activeTab === "datasource" ? "block h-full" : "hidden h-full"}>
            <DataSourceTab chatbotId={chatbotId!} workspaceId={workspaceId!} />
          </div>

          <div className={activeTab === "widgets" ? "block h-full" : "hidden h-full"}>
            <WidgetTab chatbotId={chatbotId!} workspaceId={workspaceId!} />
          </div>

          <div className={activeTab === "deploy" ? "block h-full" : "hidden h-full"}>
            <DeployTab chatbotId={chatbotId!} workspaceId={workspaceId!} />
          </div>
        </div>
      </div>
    </div>
  );
}