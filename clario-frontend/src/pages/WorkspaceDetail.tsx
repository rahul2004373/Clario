import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Plus,
  ArrowLeft,
  Trash2,
  Code2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotPrompt, setNewBotPrompt] = useState("");

  const { data: chatbots, isLoading } = useQuery({
    queryKey: ["chatbots", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots`);
      return res.data.data || res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; systemPrompt: string }) =>
      api.post(`/v1/workspaces/${workspaceId}/chatbots`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots", workspaceId] });
      setIsCreateOpen(false);
      setNewBotName("");
      setNewBotPrompt("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/v1/workspaces/${workspaceId}/chatbots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbots", workspaceId] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBotName.trim()) {
      createMutation.mutate({ name: newBotName, systemPrompt: newBotPrompt });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="mt-1 h-10 w-10 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Workspace bots
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Chatbots
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Manage AI assistants inside this workspace and configure prompts,
                  integrations, and deployment settings.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={`/dashboard/${workspaceId}/docs`}>
                <Button variant="outline" className="h-11 rounded-xl px-5">
                  <Code2 className="mr-2 h-4 w-4" />
                  Developer API Docs
                </Button>
              </Link>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 rounded-xl px-5 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Chatbot
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Chatbot</DialogTitle>
                    <DialogDescription>
                      Define your new AI assistant.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Bot Name</Label>
                        <Input
                          id="name"
                          value={newBotName}
                          onChange={(e) => setNewBotName(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="prompt">System Prompt (Optional)</Label>
                        <Textarea
                          id="prompt"
                          placeholder="You are a helpful customer support agent..."
                          value={newBotPrompt}
                          onChange={(e) => setNewBotPrompt(e.target.value)}
                          className="min-h-[120px] resize-none"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-4 h-12 w-12 animate-pulse rounded-2xl bg-muted" />
                <div className="mb-3 h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {chatbots?.map((bot: any) => (
              <Card
                key={bot.id}
                className="group rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                        <Bot className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {bot.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Created on {new Date(bot.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground opacity-100 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={() => {
                        if (confirm("Are you sure?")) deleteMutation.mutate(bot.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mb-5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Prompt summary
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-foreground/80">
                      {bot.systemPrompt || "No custom prompt set."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Ready
                    </div>

                    <Link to={`/dashboard/${workspaceId}/chatbots/${bot.id}`}>
                      <Button variant="secondary" className="h-10 rounded-xl px-4">
                        Configure
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {chatbots?.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  No chatbots yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Create your first chatbot in this workspace to start configuring
                  prompts, behavior, and integrations.
                </p>
                <Button
                  className="mt-6 rounded-xl px-5"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Chatbot
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}