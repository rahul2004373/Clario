import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileText,
  Link as LinkIcon,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  AlignLeft,
  Globe,
  Trash2,
  Calendar,
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  
  // Category switcher state
  const [activeCategory, setActiveCategory] = useState<"files" | "spreadsheets" | "text" | "url">("files");

  // Ingestion loading & inputs states
  const [uploading, setUploading] = useState(false);
  const [textName, setTextName] = useState("");
  const [rawText, setRawText] = useState("");
  const [submittingText, setSubmittingText] = useState(false);
  
  const [urlName, setUrlName] = useState("");
  const [urlAddress, setUrlAddress] = useState("");
  const [submittingUrl, setSubmittingUrl] = useState(false);

  // Content Preview details modal states
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

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

  // Helper function for uploading standard multipart files (Documents & Spreadsheets)
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

  const handleSpreadsheetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = "";
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
      const res = await api.get(`/v1/workspaces/${workspaceId}/sources/${source.id}/preview`);
      setPreviewContent(res.data.text || "");
    } catch (err) {
      console.error("Failed to fetch preview text", err);
      setPreviewContent("An error occurred trying to load the parsed preview text of this source.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this source? This will purge all indexed semantic chunks from vector memory!")) return;
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
    if (status === "READY") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (status === "FAILED") {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="h-4 w-4" />;
    if (type === "docx") return <File className="h-4 w-4 text-blue-500" />;
    if (type === "xlsx") return <Table className="h-4 w-4 text-green-600" />;
    if (type === "text") return <AlignLeft className="h-4 w-4 text-amber-500" />;
    if (type === "url") return <Globe className="h-4 w-4 text-indigo-500" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusTone = (status: string) => {
    if (status === "READY") {
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    }
    if (status === "FAILED") {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-6 py-5">
        <div className="max-w-6xl">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Data Sources Studio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload files, write text manual patches, scrape websites, and inspect the semantic indexes stored in RAG.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6 overflow-y-auto">
        
        {/* Visual category tabs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0">
          {[
            { id: "files", label: "Documents", desc: "PDF, Word Guidelines", icon: FileText },
            { id: "spreadsheets", label: "Spreadsheets", desc: "Excel, CSV Matrices", icon: Table },
            { id: "text", label: "Manual Text Patch", desc: "Copy-paste plain details", icon: AlignLeft },
            { id: "url", label: "Website Scraper", desc: "Ingest public URLs", icon: Globe },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={cn(
                  "relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:bg-muted/40",
                  isSelected
                    ? "border-primary bg-primary/[0.02] text-primary"
                    : "border-border bg-card text-card-foreground"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border",
                  isSelected ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground"
                )}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="mt-1">
                  <p className="text-sm font-semibold tracking-tight leading-none">{cat.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-normal leading-normal">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Form Cards depending on activeCategory */}
        <Card className="relative overflow-hidden border-border bg-gradient-to-b from-muted/20 to-background shadow-sm shrink-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.05),transparent_40%)] opacity-70" />
          <CardContent className="relative p-6 sm:p-8">
            
            {activeCategory === "files" && (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                </div>
                <h3 className="text-base font-semibold text-foreground">Upload guidelines document</h3>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Provide handbook manuals, support sheets, or custom instructions. We will chunk the text content and store its vector representations automatically.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading..." : "Select Document"}
                  </Button>
                  <span className="text-xs text-muted-foreground font-medium">PDF, Word, TXT · Max 25MB</span>
                </div>
              </div>
            )}

            {activeCategory === "spreadsheets" && (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Table className="h-6 w-6" />}
                </div>
                <h3 className="text-base font-semibold text-foreground">Upload Excel spreadsheet</h3>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Ingest spreadsheet databases, inventory lists, or grid sheets. Files are converted into CSV arrays so text alignments inside matrices are correctly vectorized.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <input
                    type="file"
                    ref={spreadsheetInputRef}
                    onChange={handleSpreadsheetChange}
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                  />
                  <Button onClick={() => spreadsheetInputRef.current?.click()} disabled={uploading} variant="secondary">
                    {uploading ? "Uploading..." : "Select Spreadsheet"}
                  </Button>
                  <span className="text-xs text-muted-foreground font-medium">Excel Sheets, CSV · Max 25MB</span>
                </div>
              </div>
            )}

            {activeCategory === "text" && (
              <form onSubmit={handleSubmitText} className="space-y-4 max-w-3xl mx-auto">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Source Patch Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAQ Patch: Refund policy updates"
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Raw Manual Details</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Paste plain notes, text blocks, or immediate knowledge patches here. We will vectorize them immediately..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={submittingText || !textName.trim() || !rawText.trim()}>
                    {submittingText ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </span>
                    ) : (
                      "Ingest Manual Text"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {activeCategory === "url" && (
              <form onSubmit={handleSubmitUrl} className="space-y-4 max-w-3xl mx-auto">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Source URL Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terms and Conditions Page"
                    value={urlName}
                    onChange={(e) => setUrlName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Public Webpage Address (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/terms"
                    value={urlAddress}
                    onChange={(e) => setUrlAddress(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={submittingUrl || !urlName.trim() || !urlAddress.trim()}>
                    {submittingUrl ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Scraping URL...
                      </span>
                    ) : (
                      "Ingest Website Link"
                    )}
                  </Button>
                </div>
              </form>
            )}

          </CardContent>
        </Card>

        {/* Display Sources Section */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Attached Ingestions
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {botSources.length} source{botSources.length === 1 ? "" : "s"} vectorized for chatbot queries. Click a row to preview parsed texts.
              </p>
            </div>
          </div>

          <Card className="min-h-0 flex-1 overflow-hidden border-border bg-background shadow-sm">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading sources...
                  </div>
                </div>
              ) : botSources.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No sources attached yet
                  </p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground leading-normal">
                    Choose one of the categories above and upload your first dataset to begin feeding your RAG knowledge index.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {botSources.map((source: any) => (
                    <div
                      key={source.id}
                      onClick={() => handleOpenPreview(source)}
                      className="group flex flex-col gap-4 px-4 py-4 cursor-pointer transition-colors duration-200 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-primary transition-transform duration-200 group-hover:scale-[1.02]">
                          {getFileIcon(source.type)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {source.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {source.fileSize
                                ? `${(source.fileSize / 1024 / 1024).toFixed(3)} MB`
                                : "No raw file"}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>Chunks: {source.chunkCount || 0}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="uppercase text-[10px] font-bold tracking-wider">{source.type || "file"}</span>
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

                      <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors uppercase",
                            getStatusTone(source.status)
                          )}
                        >
                          {getStatusIcon(source.status)}
                          <span>{source.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Visual Content Preview Modal / Drawer */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        <DialogContent className="max-w-3xl w-[90vw] h-[80vh] flex flex-col gap-0 p-0 overflow-hidden rounded-xl border-border bg-background shadow-2xl">
          <DialogHeader className="px-6 py-5 border-b border-border bg-muted/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
                {selectedSource && getFileIcon(selectedSource.type)}
              </div>
              <div className="text-left min-w-0">
                <DialogTitle className="text-base font-semibold truncate max-w-[450px]">
                  {selectedSource?.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wider font-semibold">
                  {selectedSource?.type} Source Ingestion Dashboard
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Left Column: Metadata Dashboard */}
            <div className="p-5 space-y-5 bg-muted/5 shrink-0 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Metadata Status</h4>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground font-medium">Ingestion Pipeline</span>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase mt-1",
                    selectedSource && getStatusTone(selectedSource.status)
                  )}>
                    {selectedSource && getStatusIcon(selectedSource.status)}
                    <span>{selectedSource?.status}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-muted-foreground font-medium">Original File Size</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {selectedSource?.fileSize
                      ? `${(selectedSource.fileSize / 1024 / 1024).toFixed(3)} MB`
                      : "N/A (Scraped or Typed)"}
                  </span>
                </div>

                <div>
                  <span className="block text-xs text-muted-foreground font-medium">Semantic Index Chunks</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {selectedSource?.chunkCount ?? 0} Chunks Created
                  </span>
                </div>

                <div>
                  <span className="block text-xs text-muted-foreground font-medium">Content MIME-type</span>
                  <code className="text-xs font-mono text-muted-foreground/90 block truncate mt-1 bg-muted px-1.5 py-0.5 rounded border border-border/50">
                    {selectedSource?.mimeType || "text/plain"}
                  </code>
                </div>

                <div>
                  <span className="block text-xs text-muted-foreground font-medium">Created / Synced At</span>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedSource?.createdAt ? new Date(selectedSource.createdAt).toLocaleString() : "Unknown"}
                  </span>
                </div>
              </div>

              {selectedSource?.errorMsg && (
                <div className="p-3.5 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive break-words">
                  <span className="font-bold block mb-1">Error Message:</span>
                  {selectedSource.errorMsg}
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="destructive"
                  onClick={() => selectedSource && handleDeleteSource(selectedSource.id)}
                  disabled={!!deletingSourceId}
                  className="w-full gap-2 text-xs h-9 font-semibold"
                >
                  {deletingSourceId === selectedSource?.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete & Purge Source
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column: Scrollable text content preview */}
            <div className="md:col-span-2 flex flex-col min-h-0 bg-background overflow-hidden p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-3 shrink-0">
                Parsed Content Preview
              </h4>
              
              <div className="flex-1 min-h-0 border border-border/80 rounded-lg bg-[#fafafa] dark:bg-muted/5 p-4 overflow-hidden relative">
                {loadingPreview ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-muted-foreground gap-2.5">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading parsed text layers...</span>
                  </div>
                ) : !previewContent ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-sm text-muted-foreground/80">
                    <FileText className="h-8 w-8 mb-2 text-muted-foreground/40 animate-pulse" />
                    <p className="font-semibold text-foreground/80">No parsed content preview available</p>
                    <p className="text-xs max-w-sm mt-1 leading-normal">
                      If ingestion is pending or failed, the text extracts cannot be assembled. Wait for ingestion to finish.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full w-full">
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground select-text p-1">
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