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
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [uploading, setUploading] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);
    formData.append("chatbotId", chatbotId);

    try {
      await api.post("/v1/ingest", formData, {
        headers: {},
      });

      queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbotId] });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Ensure the file is PDF, DOCX, or TXT and under 25MB.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (type === "url") return <LinkIcon className="h-4 w-4" />;
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
            Data sources
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload documents and monitor ingestion status for this chatbot.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6">
        <Card className="group relative overflow-hidden border-border bg-gradient-to-b from-muted/30 to-background shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.08),transparent_35%)] opacity-70" />
          <CardContent className="relative flex flex-col items-center justify-center px-6 py-12 text-center sm:px-10">
            <div
              className={cn(
                "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-sm transition-transform duration-200",
                uploading ? "scale-105" : "group-hover:scale-[1.03]"
              )}
            >
              {uploading ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground">
              Upload data source
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Add a PDF, DOCX, or TXT file to expand your chatbot knowledge base.
              Files are uploaded, indexed, and processed automatically.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.docx"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="min-w-[150px]"
              >
                {uploading ? "Uploading..." : "Select file"}
              </Button>

              <span className="text-xs text-muted-foreground">
                PDF, DOCX, TXT · Max 25MB
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Attached sources
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {botSources.length} source{botSources.length === 1 ? "" : "s"} attached
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
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Upload your first document to begin ingestion and make it available to this chatbot.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {botSources.map((source: any) => (
                    <div
                      key={source.id}
                      className="group flex flex-col gap-4 px-4 py-4 transition-colors duration-200 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
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
                                ? `${(source.fileSize / 1024 / 1024).toFixed(2)} MB`
                                : "Unknown size"}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>Chunks: {source.chunkCount || 0}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="uppercase">{source.type || "file"}</span>
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

                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
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
    </div>
  );
}