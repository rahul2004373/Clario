"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";

interface SourceUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

const ACCEPTED = ".pdf,.doc,.docx,.txt,.csv,.xlsx";

export function SourceUploadZone({
  onUpload,
  disabled,
}: SourceUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowed = ACCEPTED.split(",");
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type: ${ext}`);
      return;
    }
    setError(null);
    setUploading(file.name);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#E4E4E7] px-6 py-10 transition-colors ${
          dragging
            ? "border-[#0A0A0A] bg-[#FAFAFA]"
            : "hover:border-[#D4D4D8] hover:bg-[#FAFAFA]"
        } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          className="hidden"
          disabled={disabled || !!uploading}
        />
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-[#71717A]" />
        ) : (
          <Upload size={24} className="text-[#71717A]" />
        )}
        <div className="text-center">
          {uploading ? (
            <p className="text-[13px] text-[#71717A]">Uploading {uploading}...</p>
          ) : (
            <>
              <p className="text-[13px] font-medium text-[#0A0A0A]">
                Click to upload or drag and drop
              </p>
              <p className="mt-0.5 text-[11px] text-[#A1A1AA]">
                PDF, DOCX, TXT, CSV, XLSX
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">
          <X size={12} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
