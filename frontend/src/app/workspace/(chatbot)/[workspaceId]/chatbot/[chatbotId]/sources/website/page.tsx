"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { useSourceStore } from "@/store/sourceStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { SourceRightPanel } from "@/components/sources/SourceRightPanel";
import { UrlSourceForm } from "@/components/sources/UrlSourceForm";
import { SourceList } from "@/components/sources/SourceList";
import { SourceDetailsDrawer } from "@/components/sources/SourceDetailsDrawer";
import { DeleteSourceDialog } from "@/components/sources/DeleteSourceDialog";
import type { Source } from "@/lib/api/sources";

export default function WebsitePage() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;

  const { canEdit, canDelete } = useWorkspaceRole();
  const sources = useSourceStore((s) => s.sources);
  const fetchSources = useSourceStore((s) => s.fetchSources);
  const createUrlSource = useSourceStore((s) => s.createUrlSource);
  const deleteSource = useSourceStore((s) => s.deleteSource);
  const reingestSource = useSourceStore((s) => s.reingestSource);
  const fetchSource = useSourceStore((s) => s.fetchSource);

  const [addOpen, setAddOpen] = useState(true);
  const [detailsSource, setDetailsSource] = useState<Source | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);
  const [newSourceIds, setNewSourceIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    fetchSources(workspaceId, chatbotId);
  }, [workspaceId, chatbotId, fetchSources]);

  const urlSources = sources.filter((s) => s.type === "URL");

  const handleAddUrl = async (data: { name: string; sourceUrl: string }) => {
    const source = await createUrlSource(workspaceId, chatbotId, data);
    setNewSourceIds((prev) => {
      const next = new Set(prev);
      next.add(source.id);
      return next;
    });
    setTimeout(() => {
      setNewSourceIds((prev) => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }, 500);
  };

  const handleViewDetails = useCallback(async (source: Source) => {
    try {
      const full = await fetchSource(workspaceId, chatbotId, source.id);
      setDetailsSource(full);
    } catch {
      setDetailsSource(null);
    }
  }, [workspaceId, chatbotId, fetchSource]);

  const handleReingest = useCallback(async (source: Source) => {
    await reingestSource(workspaceId, chatbotId, source.id);
  }, [workspaceId, chatbotId, reingestSource]);

  const handleDeleteConfirm = useCallback(async (source: Source) => {
    await deleteSource(workspaceId, chatbotId, source.id);
    setDeleteTarget(null);
  }, [workspaceId, chatbotId, deleteSource]);

  const handleDeleteStart = useCallback((source: Source) => {
    setDeleteTarget(source);
  }, []);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div>
            <h1 className="text-[20px] font-semibold text-[#0A0A0A]">Website</h1>
            <p className="mt-1 text-[13px] text-[#71717A]">
              Add web pages to update your AI with the latest content.
            </p>
          </div>

          {canEdit && (
            <div className="mt-6 rounded-xl border border-[#E4E4E7] bg-white">
              <button
                type="button"
                onClick={() => setAddOpen((o) => !o)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <h3 className="text-[14px] font-semibold text-[#0A0A0A]">Add links</h3>
                {addOpen ? (
                  <ChevronDown size={16} className="text-[#A1A1AA]" />
                ) : (
                  <ChevronRight size={16} className="text-[#A1A1AA]" />
                )}
              </button>
              {addOpen && (
                <div className="border-t border-[#E4E4E7] px-5 py-5">
                  <UrlSourceForm onSubmit={handleAddUrl} />
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <SourceList
              sources={urlSources}
              onViewDetails={handleViewDetails}
              onReingest={handleReingest}
              onDelete={handleDeleteStart}
              canEdit={canEdit}
              canDelete={canDelete}
              emptyMessage="No links added yet."
              newSourceIds={newSourceIds}
            />
          </div>
        </div>
      </div>

      <SourceRightPanel sources={sources} />

      {detailsSource && (
        <SourceDetailsDrawer
          source={detailsSource}
          workspaceId={workspaceId}
          chatbotId={chatbotId}
          onClose={() => setDetailsSource(null)}
        />
      )}

      <DeleteSourceDialog
        source={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
