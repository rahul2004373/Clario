"use client";

import { useState, useEffect, memo } from "react";
import {
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Eye,
  FileText,
  Globe,
  File,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Source } from "@/lib/api/sources";

export type SourceRowAction = "view" | "reingest" | "delete";

interface SourceRowProps {
  source: Source;
  onAction: (source: Source, action: SourceRowAction) => void;
  canEdit: boolean;
  canDelete: boolean;
  isNew?: boolean;
}

const typeIcons: Record<string, typeof FileText> = {
  PDF: FileText,
  DOCX: FileText,
  TXT: File,
  CSV: File,
  XLSX: File,
  URL: Globe,
  PLAIN_TEXT: FileText,
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-700",
  DOCX: "bg-blue-50 text-blue-700",
  TXT: "bg-gray-50 text-gray-700",
  CSV: "bg-green-50 text-green-700",
  XLSX: "bg-green-50 text-green-700",
  URL: "bg-purple-50 text-purple-700",
  PLAIN_TEXT: "bg-yellow-50 text-yellow-700",
};

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const units = ["B", "KB", "MB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const SourceRow = memo(function SourceRow({
  source,
  onAction,
  canEdit,
  canDelete,
  isNew,
}: SourceRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(!isNew);
  const Icon = typeIcons[source.type] ?? File;

  useEffect(() => {
    if (isNew) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isNew]);

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-out hover:bg-[#FAFAFA] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          typeColors[source.type] ?? "bg-[#F4F4F5] text-[#71717A]"
        }`}
      >
        <Icon size={16} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[#0A0A0A]">
            {source.name}
          </p>
          <p className="text-[11px] text-[#A1A1AA]">
            {source.type === "URL" && source.sourceUrl ? (
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="truncate block max-w-[300px] hover:text-[#0A0A0A] underline underline-offset-2"
              >
                {source.sourceUrl}
              </a>
            ) : (
              <>
                {formatSize(source.fileSize)}
                {source.fileSize ? " · " : ""}
                Added {formatDate(source.createdAt)}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {(canEdit || canDelete) && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="flex size-7 items-center justify-center rounded-md text-[#A1A1AA] opacity-0 transition-all hover:bg-[#F4F4F5] hover:text-[#0A0A0A] group-hover:opacity-100"
            >
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-40 rounded-lg bg-white p-1 shadow-md ring-1 ring-[#0A0A0A]/10"
            >
              <DropdownMenuItem
                onClick={() => onAction(source, "view")}
                className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
              >
                <Eye size={14} />
                View details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => onAction(source, "reingest")}
                  className="rounded-lg px-3 py-2 text-[13px] cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Re-ingest
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onAction(source, "delete")}
                  className="rounded-lg px-3 py-2 text-[13px] text-[#EF4444] focus:text-[#EF4444] cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          type="button"
          onClick={() => onAction(source, "view")}
          className="flex size-7 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
});
