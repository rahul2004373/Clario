"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import type { Source } from "@/lib/api/sources";

interface DeleteSourceDialogProps {
  source: Source | null;
  onConfirm: (source: Source) => Promise<void>;
  onClose: () => void;
}

export function DeleteSourceDialog({
  source,
  onConfirm,
  onClose,
}: DeleteSourceDialogProps) {
  const [deleting, setDeleting] = useState(false);

  if (!source) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(source);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!source} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogPopup>
        <AlertDialogTitle>Delete &ldquo;{source.name}&rdquo;?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove this source and its embeddings. This
          cannot be undone.
        </AlertDialogDescription>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
