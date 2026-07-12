"use client";

import { FileText, Link, HardDrive } from "lucide-react";
import type { Source } from "@/lib/api/sources";

interface SourceRightPanelProps {
  sources: Source[];
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function SourceRightPanel({ sources }: SourceRightPanelProps) {
  const fileSources = sources.filter((s) =>
    ["PDF", "DOCX", "TXT", "CSV", "XLSX"].includes(s.type),
  );
  const linkSources = sources.filter((s) => s.type === "URL");
  const totalSize = sources.reduce((sum, s) => sum + (s.fileSize ?? 0), 0);

  return (
    <aside className="w-[320px] shrink-0 border-l border-[#E4E4E7] bg-white p-5">
      <h2 className="text-[13px] font-semibold text-[#0A0A0A] uppercase tracking-wide">
        Data sources
      </h2>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#F0F0F1] px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#F4F4F5]">
            <FileText size={16} className="text-[#71717A]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#0A0A0A]">
              {fileSources.length} Files
            </p>
            <p className="text-[11px] text-[#A1A1AA]">
              {formatSize(fileSources.reduce((s, src) => s + (src.fileSize ?? 0), 0))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#F0F0F1] px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#F4F4F5]">
            <Link size={16} className="text-[#71717A]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#0A0A0A]">
              {linkSources.length} Links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#F0F0F1] px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#F4F4F5]">
            <HardDrive size={16} className="text-[#71717A]" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#0A0A0A]">Total size</p>
            <p className="text-[11px] text-[#A1A1AA]">{formatSize(totalSize)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
