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

interface ConversationDeleteDialogProps {
  open: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConversationDeleteDialog({
  open,
  onConfirm,
  onClose,
}: ConversationDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogPopup>
        <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove this conversation and its messages.
          This cannot be undone.
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
