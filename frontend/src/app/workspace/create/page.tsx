"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getStoredTokens } from "@/lib/auth/api";

const createSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
});

type CreateInput = z.infer<typeof createSchema>;

export default function CreateWorkspacePage() {
  const router = useRouter();
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "" },
  });

  const nameValue = watch("name");

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tokens = getStoredTokens();
    setIsAuthenticated(!!tokens?.accessToken);
  }, []);

  const navigateBack = useCallback(() => {
    if (isAuthenticated && currentWorkspaceId) {
      router.push(`/workspace/${currentWorkspaceId}/agents`);
    } else if (isAuthenticated) {
      router.push("/");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, currentWorkspaceId, router]);

  const handleBack = useCallback(() => {
    if (nameValue && nameValue.trim()) {
      setShowDiscardDialog(true);
    } else {
      navigateBack();
    }
  }, [nameValue, navigateBack]);

  const onSubmit = async (data: CreateInput) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const workspace = await createWorkspace({ name: data.name });
      router.push(`/workspace/${workspace.id}/agents`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workspace.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-[420px]">
        <button
          type="button"
          onClick={handleBack}
          className="mb-8 flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-[#0A0A0A] transition-colors"
        >
          <ArrowLeft size={14} />
          {isAuthenticated ? "Back to workspace" : "Back to login"}
        </button>

        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-[#0A0A0A]">
            Create a workspace
          </h1>
          <p className="text-[14px] text-[#71717A]">
            Set up a workspace for your team.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="ws-name"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Workspace name
            </label>
            <Input
              id="ws-name"
              placeholder="Acme Inc"
              disabled={submitting}
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

          {error && (
            <p className="text-[12px] text-[#EF4444]" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="w-full text-[15px] font-medium disabled:bg-[#D4D4D8] disabled:text-[#71717A]"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Create workspace"
            )}
          </Button>
        </form>
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogPopup>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to go back?
          </AlertDialogDescription>
          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDiscardDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setShowDiscardDialog(false);
                navigateBack();
              }}
            >
              Discard
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
