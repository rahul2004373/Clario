"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Search } from "lucide-react";
import { SourceRow, type SourceRowAction } from "@/components/sources/SourceRow";
import type { Source } from "@/lib/api/sources";

interface SourceListProps {
  sources: Source[];
  onViewDetails: (source: Source) => void;
  onReingest: (source: Source) => void;
  onDelete: (source: Source) => void;
  canEdit: boolean;
  canDelete: boolean;
  emptyMessage?: string;
  newSourceIds?: ReadonlySet<string>;
}

type SortKey = "default" | "name" | "size" | "date";

export const SourceList = memo(function SourceList({
  sources,
  onViewDetails,
  onReingest,
  onDelete,
  canEdit,
  canDelete,
  emptyMessage = "No sources found.",
  newSourceIds,
}: SourceListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("default");

  const filtered = useMemo(() => {
    let list = sources;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    switch (sort) {
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "size":
        list = [...list].sort(
          (a, b) => (b.fileSize ?? 0) - (a.fileSize ?? 0),
        );
        break;
      case "date":
        list = [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
    return list;
  }, [sources, search, sort]);

  const handleAction = useCallback(
    (source: Source, action: SourceRowAction) => {
      switch (action) {
        case "view":
          onViewDetails(source);
          break;
        case "reingest":
          onReingest(source);
          break;
        case "delete":
          onDelete(source);
          break;
      }
    },
    [onViewDetails, onReingest, onDelete],
  );

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white">
      <div className="flex items-center gap-3 border-b border-[#E4E4E7] px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-9 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 pl-9 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/5"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-lg border border-[#E4E4E7] bg-white px-2 text-[12px] text-[#71717A] outline-none transition-all hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A]"
        >
          <option value="default">Default</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="date">Date</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-[13px] text-[#71717A]">
          {search.trim() ? "No results match your search." : emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-[#F0F0F1]">
          {filtered.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              onAction={handleAction}
              canEdit={canEdit}
              canDelete={canDelete}
              isNew={newSourceIds?.has(source.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
