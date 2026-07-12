"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Check, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

const settingsSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
});

type SettingsInput = z.infer<typeof settingsSchema>;

interface GeneralSettingsFormProps {
  workspaceId: string;
}

export function GeneralSettingsForm({ workspaceId }: GeneralSettingsFormProps) {
  const router = useRouter();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const error = useWorkspaceStore((s) => s.error);
  const { canEdit, canDelete } = useWorkspaceRole();

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: workspace?.name ?? "",
    },
  });

  const onSubmit = async (data: SettingsInput) => {
    if (!canEdit || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateWorkspace(workspaceId, { name: data.name });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save workspace settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWorkspace(workspaceId);
      const remaining = useWorkspaceStore.getState().workspaces;
      if (remaining.length > 0) {
        router.push(`/workspace/${remaining[0].id}/agents`);
      } else {
        router.push("/workspace/create");
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete workspace.",
      );
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-[#D4D4D8] bg-white">
        <div className="px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
            Workspace details
          </h2>
        </div>
        <div className="border-t border-[#D4D4D8] px-5 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label
                htmlFor="ws-name"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Workspace name
              </label>
              <Input
                id="ws-name"
                disabled={!canEdit || saving}
                className={errors.name ? "border-[#EF4444]" : ""}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-[12px] text-[#EF4444]" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ws-url"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Workspace URL
              </label>
              <Input
                id="ws-url"
                value={workspace?.slug ?? ""}
                disabled
                className="bg-[#F4F4F5] text-[#71717A]"
              />
              <p className="text-[12px] text-[#A1A1AA]">
                Changing the workspace URL will redirect you to the new address.
                {/* Slug update is not supported by the backend PATCH endpoint yet */}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-[13px] text-green-600">
                    <Check size={14} />
                    Saved
                  </span>
                )}
                {saveError && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#EF4444]">
                    <X size={14} />
                    {saveError}
                  </span>
                )}
                {error && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#EF4444]">
                    <X size={14} />
                    {error}
                  </span>
                )}
              </div>
              <Button
                type="submit"
                disabled={!canEdit || !isDirty || saving}
                size="sm"
                className="min-w-[80px] disabled:bg-[#D4D4D8] disabled:text-[#71717A]"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {canDelete && (
        <div>
          <div className="relative mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#FCA5A5]/40" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#EF4444]/60">
              Danger Zone
            </span>
            <div className="h-px flex-1 bg-[#FCA5A5]/40" />
          </div>

          <div className="rounded-xl border border-[#FCA5A5]/50 bg-white">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#0A0A0A]">
                  Delete workspace
                </h3>
                <p className="mt-1 text-[13px] text-[#71717A]">
                  Permanently delete this workspace and all of its data. This
                  action cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                className="shrink-0 whitespace-nowrap"
              >
                <AlertTriangle size={14} />
                Delete
              </Button>
            </div>
          </div>

          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !deleting && setDeleteConfirmOpen(false)}
              />
              <div className="relative z-10 w-full max-w-[400px] rounded-xl border border-[#D4D4D8] bg-white p-6 shadow-lg">
                <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
                  Delete workspace
                </h3>
                <p className="mt-2 text-[13px] text-[#71717A]">
                  Are you sure you want to delete{" "}
                  <strong className="text-[#0A0A0A]">
                    {workspace?.name}
                  </strong>
                  ? This will permanently remove all data and cannot be undone.
                </p>
                {deleteError && (
                  <p className="mt-2 text-[12px] text-[#EF4444]">{deleteError}</p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Delete workspace"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
