"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useWidgetConfigStore } from "@/store/widgetConfigStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { ChatWidgetSettingsLayout } from "@/components/widget/ChatWidgetSettingsLayout";
import { ContentTab } from "@/components/widget/tabs/ContentTab";
import { StyleTab } from "@/components/widget/tabs/StyleTab";
import { EmbedTab } from "@/components/widget/tabs/EmbedTab";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "content", label: "Content" },
  { id: "style", label: "Style" },
  { id: "embed", label: "Embed" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function WidgetsPage() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;
  const { canEdit } = useWorkspaceRole();

  const [activeTab, setActiveTab] = useState<TabId>("content");

  const localConfig = useWidgetConfigStore((s) => s.localConfig);
  const isActive = useWidgetConfigStore((s) => s.isActive);
  const isLoading = useWidgetConfigStore((s) => s.isLoading);
  const isSaving = useWidgetConfigStore((s) => s.isSaving);
  const error = useWidgetConfigStore((s) => s.error);
  const fetchConfig = useWidgetConfigStore((s) => s.fetchConfig);
  const updateLocalConfig = useWidgetConfigStore((s) => s.updateLocalConfig);
  const saveConfig = useWidgetConfigStore((s) => s.saveConfig);
  const discardChanges = useWidgetConfigStore((s) => s.discardChanges);
  const setActive = useWidgetConfigStore((s) => s.setActive);
  const getDirtyFields = useWidgetConfigStore((s) => s.getDirtyFields);

  const mounted = useRef(false);

  useEffect(() => {
    fetchConfig(workspaceId, chatbotId);
  }, [workspaceId, chatbotId, fetchConfig]);

  // Track mounted state for animation
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const dirty = getDirtyFields();

  const handleToggleActive = async () => {
    if (!canEdit) return;
    await setActive(workspaceId, chatbotId, !isActive);
  };

  if (isLoading && !localConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  if (!localConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[13px] text-[#71717A]">Failed to load widget configuration.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-[#E4E4E7] bg-white px-6 py-4">
        <div>
          <h1 className="text-[18px] font-semibold text-[#0A0A0A]">
            Chat widget
          </h1>
          <p className="text-[12px] text-[#71717A]">
            Customize how your chat widget looks and behaves.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <p className="max-w-[200px] truncate text-[12px] text-[#EF4444]">
              {error}
            </p>
          )}
          {canEdit && (
            <label className="flex cursor-pointer items-center gap-2">
              <span className="select-none text-[13px] font-medium text-[#0A0A0A]">
                {isActive ? "Active" : "Inactive"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={handleToggleActive}
                disabled={isSaving}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  isActive ? "bg-[#0A0A0A]" : "bg-[#D4D4D8]"
                } disabled:opacity-50`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    isActive ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="flex-1 overflow-hidden">
        <ChatWidgetSettingsLayout
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as TabId)}
          tabs={[...TABS]}
          config={localConfig}
          leftPanel={
            <>
              {activeTab === "content" && (
                <ContentTab
                  config={localConfig}
                  onChange={updateLocalConfig}
                  disabled={!canEdit}
                />
              )}
              {activeTab === "style" && (
                <StyleTab
                  config={localConfig}
                  onChange={updateLocalConfig}
                  disabled={!canEdit}
                />
              )}
              {activeTab === "embed" && <EmbedTab />}
            </>
          }
          saveBar={
            canEdit && (
              <AnimatePresence>
                {dirty && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="flex items-center justify-between rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 shadow-sm">
                      <p className="text-[13px] text-[#71717A]">
                        You have unsaved changes
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={discardChanges}
                          disabled={isSaving}
                        >
                          Discard
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]/90"
                          onClick={() => saveConfig(workspaceId, chatbotId)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )
          }
        />
      </div>
    </div>
  );
}
