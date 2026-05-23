import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, FolderKanban, Trash2, ArrowUpRight, LogOut } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await api.get("/v1/workspaces");
      return res.data.data || res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post("/v1/workspaces", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setIsCreateOpen(false);
      setNewWorkspaceName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      createMutation.mutate(newWorkspaceName);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              Workspace console
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Workspaces
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Create and manage isolated chatbot workspaces for your team, documents, widgets, and integrations.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={logout}
              className="h-11 rounded-xl px-5"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl px-5 shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Workspace</DialogTitle>
                  <DialogDescription>
                    Create a new container for your chatbots and data.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Workspace Name</Label>
                      <Input
                        id="name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        required
                        className="h-11"
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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <div className="h-56 animate-pulse bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces?.map((workspace: any, index: number) => (
              <Card
                key={workspace.id}
                className="group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="relative h-56 overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/90 via-primary/70 to-violet-300">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />

                  <div className="absolute left-6 right-6 top-6 rounded-[26px] bg-black/95 p-4 shadow-2xl">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-white/90" />
                      <span className="text-xs font-medium text-white/90">
                        {workspace.name}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="h-9 w-32 rounded-full bg-white/12" />
                      <div className="ml-auto h-9 w-36 rounded-full bg-orange-400" />
                    </div>

                    <div className="mt-10 h-28 rounded-[20px] bg-white/5" />
                  </div>

                  <div className="absolute bottom-5 left-5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    Workspace
                  </div>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <h3 className="truncate text-xl font-semibold tracking-tight text-foreground">
                          {workspace.name}
                        </h3>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Created on {new Date(workspace.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground opacity-100 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={() => {
                        if (confirm("Are you sure?")) deleteMutation.mutate(workspace.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    Manage your chatbots, widgets, sources, and workspace-level configurations in one isolated environment.
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Active workspace
                    </div>

                    <Link to={`/dashboard/${workspace.id}`}>
                      <Button
                        variant="secondary"
                        className="h-10 rounded-xl px-4"
                      >
                        Open
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {workspaces?.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  No workspaces yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Create your first workspace to start organizing chatbot data, docs, and integrations.
                </p>
                <Button
                  className="mt-6 rounded-xl px-5"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}