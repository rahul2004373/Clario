import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileText,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  AlignLeft,
  Globe,
  Trash2,
  Calendar,
  Search,
  Filter,
  X,
  FileSpreadsheet,
  Link as LinkIcon,
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SourceCategory = "files" | "spreadsheets" | "text" | "url";
type StatusFilter = "all" | "READY" | "PROCESSING" | "FAILED";

export default function DataSourceTab({
  chatbotId,
  workspaceId,
}: {
  chatbotId: string;
  workspaceId: string;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState<SourceCategory>("files");
  const [isDragActive, setIsDragActive] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [textName, setTextName] = useState("");
  const [rawText, setRawText] = useState("");
  const [submittingText, setSubmittingText] = useState(false);

  const [urlName, setUrlName] = useState("");
  const [urlAddress, setUrlAddress] = useState("");
  const [submittingUrl, setSubmittingUrl] = useState(false);

  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "docx" | "xlsx" | "text" | "url">("all");

  const { data: botInfo } = useQuery({
    queryKey: ["chatbot", chatbotId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}`);
      return res.data.data || res.data;
    },
  });

  const { data: sources, isLoading } = useQuery({
    queryKey: ["sources", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/sources`);
      return res.data.data || res.data;
    },
    refetchInterval: 5000,
  });

  const botSources =
    sources?.filter((s: any) => botInfo?.sourceIds?.includes(s.id)) || [];

  const filteredSources = useMemo(() => {
    return botSources.filter((source: any) => {
      const matchesSearch =
        !search.trim() ||
        source.name?.toLowerCase().includes(search.toLowerCase()) ||
        source.type?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : source.status === statusFilter;

      const matchesType =
        typeFilter === "all" ? true : source.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [botSources, search, statusFilter, typeFilter]);

  const sourceCounts = useMemo(() => {
    return {
      total: botSources.length,
      ready: botSources.filter((s: any) => s.status === "READY").length,
      processing: botSources.filter((s: any) => s.status !== "READY" && s.status !== "FAILED").length,
      failed: botSources.filter((s: any) => s.status === "FAILED").length,
    };
  }, [botSources]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);
    formData.append("chatbotId", chatbotId);

    try {
      await api.post("/v1/ingest", formData);
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbotId] });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Ensure the file type is supported and is under 25MB.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSpreadsheetChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textName.trim() || !rawText.trim()) return;

    setSubmittingText(true);
    try {
      await api.post(`/v1/workspaces/${workspaceId}/sources`, {
        type: "text",
        name: textName,
        rawText,
        chatbotId,
      });

      setTextName("");
      setRawText("");
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbotId] });
    } catch (err) {
      console.error("Failed to ingest text", err);
      alert("Failed to submit custom text. Please try again.");
    } finally {
      setSubmittingText(false);
    }
  };

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlName.trim() || !urlAddress.trim()) return;

    try {
      new URL(urlAddress);
    } catch {
      alert("Please enter a valid absolute URL starting with http:// or https://");
      return;
    }

    setSubmittingUrl(true);
    try {
      await api.post(`/v1/workspaces/${workspaceId}/sources`, {
        type: "url",
        name: urlName,
        url: urlAddress,
        chatbotId,
      });

      setUrlName("");
      setUrlAddress("");
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbotId] });
    } catch (err) {
      console.error("Failed to scrape URL", err);
      alert("Failed to enqueue URL for scraper. Ensure the site is publicly readable.");
    } finally {
      setSubmittingUrl(false);
    }
  };

  const handleOpenPreview = async (source: any) => {
    setSelectedSource(source);
    setPreviewContent("");
    setLoadingPreview(true);
    try {
      const res = await api.get(
        `/v1/workspaces/${workspaceId}/sources/${source.id}/preview`
      );
      setPreviewContent(res.data.text || "");
    } catch (err) {
      console.error("Failed to fetch preview text", err);
      setPreviewContent(
        "An error occurred trying to load the parsed preview text of this source."
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this source? This will purge all indexed semantic chunks from vector memory!"
      )
    )
      return;
    setDeletingSourceId(sourceId);
    try {
      await api.delete(`/v1/workspaces/${workspaceId}/sources/${sourceId}`);
      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbotId] });
      setSelectedSource(null);
    } catch (err) {
      console.error("Failed to delete source", err);
      alert("Failed to delete source.");
    } finally {
      setDeletingSourceId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "READY") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "FAILED") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="h-4 w-4" />;
    if (type === "docx") return <File className="h-4 w-4 text-blue-500" />;
    if (type === "xlsx") return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    if (type === "text") return <AlignLeft className="h-4 w-4 text-amber-500" />;
    if (type === "url") return <Globe className="h-4 w-4 text-indigo-500" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusTone = (status: string) => {
    if (status === "READY") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    }
    if (status === "FAILED") {
      return "border-destructive/20 bg-destructive/10 text-destructive";
    }
    return "border-primary/20 bg-primary/10 text-primary";
  };

  const categoryItems = [
    { id: "files", label: "Documents", icon: FileText, hint: "PDF, DOCX, TXT" },
    { id: "spreadsheets", label: "Spreadsheets", icon: Table, hint: "XLSX, XLS, CSV" },
    { id: "text", label: "Manual text", icon: AlignLeft, hint: "Paste knowledge" },
    { id: "url", label: "Website URL", icon: LinkIcon, hint: "Scrape public pages" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Data sources
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload documents, add text, scrape pages, and manage indexed sources from one workspace.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {categoryItems.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SourceCategory)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/[0.04] shadow-sm"
                      : "border-border bg-card hover:bg-muted/40"
                  )}
                >
                  <div
                    className={cn(
                      "mb-3 flex h-10 w-10 items-center justify-center rounded-xl border",
                      isSelected
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{cat.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <Card className="overflow-hidden border-border shadow-sm">
                <CardContent className="p-6">
                  {activeCategory === "files" && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all",
                        isDragActive
                          ? "border-primary bg-primary/[0.04]"
                          : "border-border bg-muted/[0.25]"
                      )}
                    >
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm">
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <UploadCloud className="h-6 w-6" />
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-foreground">
                        Upload documents
                      </h3>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        Drag and drop a file here or choose one manually. Best for product guides, policy documents, and reference notes.
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.docx,.txt"
                        />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-xl">
                          {uploading ? "Uploading..." : "Choose document"}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          PDF, DOCX, TXT · Max 25MB
                        </span>
                      </div>
                    </div>
                  )}

                  {activeCategory === "spreadsheets" && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all",
                        isDragActive
                          ? "border-primary bg-primary/[0.04]"
                          : "border-border bg-muted/[0.25]"
                      )}
                    >
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm">
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Table className="h-6 w-6" />
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-foreground">
                        Upload spreadsheets
                      </h3>
                      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        Import tables, inventories, and structured datasets. Spreadsheet content is processed for retrieval-friendly indexing.
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <input
                          type="file"
                          ref={spreadsheetInputRef}
                          onChange={handleSpreadsheetChange}
                          className="hidden"
                          accept=".xlsx,.xls,.csv"
                        />
                        <Button
                          onClick={() => spreadsheetInputRef.current?.click()}
                          disabled={uploading}
                          variant="secondary"
                          className="rounded-xl"
                        >
                          {uploading ? "Uploading..." : "Choose spreadsheet"}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          XLSX, XLS, CSV · Max 25MB
                        </span>
                      </div>
                    </div>
                  )}

                  {activeCategory === "text" && (
                    <form onSubmit={handleSubmitText} className="mx-auto max-w-3xl space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Source title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="FAQ patch: refund policy update"
                          value={textName}
                          onChange={(e) => setTextName(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Content
                        </label>
                        <textarea
                          required
                          rows={8}
                          placeholder="Paste the text you want to ingest..."
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          className="flex min-h-[180px] w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={submittingText || !textName.trim() || !rawText.trim()}
                          className="rounded-xl"
                        >
                          {submittingText ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting...
                            </span>
                          ) : (
                            "Ingest text"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  {activeCategory === "url" && (
                    <form onSubmit={handleSubmitUrl} className="mx-auto max-w-3xl space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Page label
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Terms and conditions page"
                          value={urlName}
                          onChange={(e) => setUrlName(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Public URL
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/terms"
                          value={urlAddress}
                          onChange={(e) => setUrlAddress(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={submittingUrl || !urlName.trim() || !urlAddress.trim()}
                          className="rounded-xl"
                        >
                          {submittingUrl ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Scraping...
                            </span>
                          ) : (
                            "Ingest URL"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Attached sources
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {filteredSources.length} of {botSources.length} source{botSources.length === 1 ? "" : "s"} shown
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative min-w-[220px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search sources..."
                          className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="h-10 rounded-xl border border-input bg-background pl-9 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="all">All status</option>
                            <option value="READY">Ready</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="FAILED">Failed</option>
                          </select>
                        </div>

                        <select
                          value={typeFilter}
                          onChange={(e) =>
                            setTypeFilter(
                              e.target.value as "all" | "pdf" | "docx" | "xlsx" | "text" | "url"
                            )
                          }
                          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="all">All types</option>
                          <option value="pdf">PDF</option>
                          <option value="docx">DOCX</option>
                          <option value="xlsx">XLSX</option>
                          <option value="text">Text</option>
                          <option value="url">URL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-h-[420px] overflow-hidden border-border shadow-sm">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading sources...
                      </div>
                    </div>
                  ) : filteredSources.length === 0 ? (
                    <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No matching sources
                      </p>
                      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                        Try adjusting the filters, or add a new source using one of the methods above.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredSources.map((source: any) => (
                        <button
                          key={source.id}
                          onClick={() => handleOpenPreview(source)}
                          className="group flex w-full flex-col gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-primary">
                              {getFileIcon(source.type)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {source.name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                <span>
                                  {source.fileSize
                                    ? `${(source.fileSize / 1024 / 1024).toFixed(2)} MB`
                                    : "No file size"}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span>{source.chunkCount || 0} chunks</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="uppercase tracking-wider">
                                  {source.type || "file"}
                                </span>
                              </div>

                              {source.errorMsg && (
                                <p
                                  className="mt-2 truncate text-xs text-destructive"
                                  title={source.errorMsg}
                                >
                                  {source.errorMsg}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <div
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                                getStatusTone(source.status)
                              )}
                            >
                              {getStatusIcon(source.status)}
                              <span>{source.status}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground">Overview</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {sourceCounts.total}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Ready</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {sourceCounts.ready}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Processing</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {sourceCounts.processing}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {sourceCounts.failed}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground">
                    Upload guidance
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>Use documents for manuals and policies.</p>
                    <p>Use spreadsheets for tabular knowledge and inventories.</p>
                    <p>Use manual text for quick fixes and temporary patches.</p>
                    <p>Use public URLs for scraping documentation pages.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        <DialogContent className="flex h-[80vh] w-[92vw] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-border p-0">
          <DialogHeader className="shrink-0 border-b border-border bg-muted/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
                {selectedSource && getFileIcon(selectedSource.type)}
              </div>
              <div className="min-w-0 text-left">
                <DialogTitle className="truncate text-base font-semibold">
                  {selectedSource?.name}
                </DialogTitle>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {selectedSource?.type} source
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="space-y-5 overflow-y-auto bg-muted/5 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                Metadata
              </h4>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-xs font-medium text-muted-foreground">
                    Status
                  </span>
                  <div
                    className={cn(
                      "mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase",
                      selectedSource && getStatusTone(selectedSource.status)
                    )}
                  >
                    {selectedSource && getStatusIcon(selectedSource.status)}
                    <span>{selectedSource?.status}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-muted-foreground">
                    File size
                  </span>
                  <span className="mt-0.5 block font-semibold text-foreground">
                    {selectedSource?.fileSize
                      ? `${(selectedSource.fileSize / 1024 / 1024).toFixed(2)} MB`
                      : "N/A"}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium text-muted-foreground">
                    Chunks
                  </span>
                  <span className="mt-0.5 block font-semibold text-foreground">
                    {selectedSource?.chunkCount ?? 0}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium text-muted-foreground">
                    MIME type
                  </span>
                  <code className="mt-1 block truncate rounded-md border border-border/50 bg-muted px-1.5 py-1 text-xs text-muted-foreground">
                    {selectedSource?.mimeType || "text/plain"}
                  </code>
                </div>

                <div>
                  <span className="block text-xs font-medium text-muted-foreground">
                    Created at
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedSource?.createdAt
                      ? new Date(selectedSource.createdAt).toLocaleString()
                      : "Unknown"}
                  </span>
                </div>
              </div>

              {selectedSource?.errorMsg && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive">
                  <span className="mb-1 block font-bold">Error message</span>
                  {selectedSource.errorMsg}
                </div>
              )}

              <Button
                variant="destructive"
                onClick={() => selectedSource && handleDeleteSource(selectedSource.id)}
                disabled={!!deletingSourceId}
                className="h-10 w-full gap-2 rounded-xl text-xs font-semibold"
              >
                {deletingSourceId === selectedSource?.id ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete source
                  </>
                )}
              </Button>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden p-5 md:col-span-2">
              <h4 className="mb-3 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                Parsed preview
              </h4>

              <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-[#fafafa] p-4 dark:bg-muted/5">
                {loadingPreview ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading preview...</span>
                  </div>
                ) : !previewContent ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground/80">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground/80">
                      No parsed preview available
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-normal">
                      If ingestion is pending or failed, preview text may not be available yet.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full w-full">
                    <pre className="p-1 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                      {previewContent}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}