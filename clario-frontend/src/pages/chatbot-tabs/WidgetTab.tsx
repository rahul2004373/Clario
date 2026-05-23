import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

interface WidgetTabProps {
  chatbotId: string;
  workspaceId: string;
}

export default function WidgetTab({ chatbotId, workspaceId }: WidgetTabProps) {
  const queryClient = useQueryClient();

  const [isActive, setIsActive] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [themeConfig, setThemeConfig] = useState({
    primaryColor: "#3b82f6",
    title: "Customer Support",
    launcherLabel: "Chat with us",
    position: "bottom-right",
    borderRadius: "12px",
  });

  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["widgetSettings", chatbotId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/widget`);
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setIsActive(settings.isActive ?? true);
      setWelcomeMessage(settings.welcomeMessage || "Hello! How can I help you today?");
      setThemeConfig(
        settings.themeConfig || {
          primaryColor: "#3b82f6",
          title: "Customer Support",
          launcherLabel: "Chat with us",
          position: "bottom-right",
          borderRadius: "12px",
        }
      );
      setDomains(settings.allowedDomains || []);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      api.put(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/widget`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgetSettings", chatbotId] });
      alert("Widget settings saved successfully!");
    },
    onError: (err: any) => {
      alert(`Error saving settings: ${err.response?.data?.error || err.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      isActive,
      welcomeMessage,
      themeConfig,
      allowedDomains: domains,
    });
  };

  const handleReset = () => {
    if (settings) {
      setIsActive(settings.isActive ?? true);
      setWelcomeMessage(settings.welcomeMessage || "Hello! How can I help you today?");
      setThemeConfig(
        settings.themeConfig || {
          primaryColor: "#3b82f6",
          title: "Customer Support",
          launcherLabel: "Chat with us",
          position: "bottom-right",
          borderRadius: "12px",
        }
      );
      setDomains(settings.allowedDomains || []);
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newDomain.trim().toLowerCase();
    if (clean && !domains.includes(clean)) {
      setDomains([...domains, clean]);
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (idx: number) => {
    setDomains(domains.filter((_, i) => i !== idx));
  };

  const widgetToken =
    settings?.widgetToken || "••••••••-••••-••••-••••-••••••••••••";
  const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api/v1`
      : `${window.location.protocol}//${window.location.host.replace(
          ":5173",
          ":3000"
        )}/api/v1`)
    : `${window.location.protocol}//${window.location.host}/api/v1`;
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || `${window.location.protocol}//${window.location.host}`;
  const widgetClientUrl = `${frontendUrl}/widget/${widgetToken}`;
  const embedScriptUrl = `${frontendUrl}/widget-loader.js`;

  const widgetRoutesList = [
    { method: "POST", path: `/widget/${widgetToken}/session`, purpose: "Initialize visitor session" },
    { method: "POST", path: `/widget/${widgetToken}/messages`, purpose: "Send conversation message" },
    { method: "POST", path: `/widget/${widgetToken}/identify`, purpose: "Attach customer details (email, etc)" },
    { method: "POST", path: `/widget/${widgetToken}/conversations/{id}/close`, purpose: "Close visitor session" },
  ];

  const scriptTagCode = `<script
  src="${embedScriptUrl}"
  data-widget-token="${widgetToken}"
  data-theme-color="${themeConfig.primaryColor}"
  data-title="${themeConfig.title}"
  data-launcher-text="${themeConfig.launcherLabel}"
  data-position="${themeConfig.position || "bottom-right"}"
  data-welcome-message="${welcomeMessage}"
  data-border-radius="${themeConfig.borderRadius || "12px"}"
  defer>
</script>`;

  const handleOpenSandbox = () => {
    window.open(`/widget-test.html?token=${widgetToken}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading widget configuration...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Website chat widget
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure appearance, embed settings, and domain restrictions for your chatbot widget.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="rounded-xl">
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="rounded-xl">
                {updateMutation.isPending ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Status</CardDescription>
                  <CardTitle className="text-base">Widget availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                        isActive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {isActive ? "Active" : "Disabled"}
                    </span>

                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-background after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white" />
                    </label>
                  </div>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Disable the widget to stop new client-side interactions immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardDescription>Public token</CardDescription>
                  <CardTitle className="text-base">Widget token</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={widgetToken}
                      className="font-mono text-xs"
                    />
                    <CopyBtn text={widgetToken} />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    This token is used by your embedded client to initialize widget sessions.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardDescription>Security</CardDescription>
                <CardTitle className="text-base">Allowed domains</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddDomain} className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="example.com or localhost:3000"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="text-sm"
                  />
                  <Button type="submit" variant="secondary" className="rounded-xl">
                    Add domain
                  </Button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {domains.map((domain, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(idx)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {domains.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No domain restrictions set. The widget can be used from any origin.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardDescription>Configuration</CardDescription>
                  <CardTitle className="text-base">Widget settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-text">Welcome message</Label>
                    <Textarea
                      id="welcome-text"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="min-h-[96px] text-sm"
                      placeholder="Hello! Welcome to our website."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme-title">Window title</Label>
                    <Input
                      id="theme-title"
                      value={themeConfig.title}
                      onChange={(e) =>
                        setThemeConfig({ ...themeConfig, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="theme-launcher">Launcher label</Label>
                      <Input
                        id="theme-launcher"
                        value={themeConfig.launcherLabel}
                        onChange={(e) =>
                          setThemeConfig({
                            ...themeConfig,
                            launcherLabel: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme-color">Primary color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="theme-color"
                          value={themeConfig.primaryColor}
                          onChange={(e) =>
                            setThemeConfig({
                              ...themeConfig,
                              primaryColor: e.target.value,
                            })
                          }
                          className="h-10 w-12 rounded-xl border border-border bg-transparent"
                        />
                        <Input
                          value={themeConfig.primaryColor}
                          onChange={(e) =>
                            setThemeConfig({
                              ...themeConfig,
                              primaryColor: e.target.value,
                            })
                          }
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="theme-position">Launcher position</Label>
                      <select
                        id="theme-position"
                        value={themeConfig.position || "bottom-right"}
                        onChange={(e) =>
                          setThemeConfig({
                            ...themeConfig,
                            position: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme-radius">Border radius</Label>
                      <Input
                        id="theme-radius"
                        value={themeConfig.borderRadius || "12px"}
                        onChange={(e) =>
                          setThemeConfig({
                            ...themeConfig,
                            borderRadius: e.target.value,
                          })
                        }
                        placeholder="12px"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardDescription>Integration</CardDescription>
                  <CardTitle className="text-base">Embed script</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Add this script near the end of your website body to load the widget with the selected settings.
                  </p>

                  <div className="group relative overflow-hidden rounded-2xl border border-border bg-slate-950 p-4 text-xs text-white">
                    <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <CopyBtn text={scriptTagCode} />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap pr-10 leading-6">
                      {scriptTagCode}
                    </pre>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Hosted widget client
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                          {widgetClientUrl}
                        </p>
                      </div>
                      <CopyBtn text={widgetClientUrl} />
                    </div>
                  </div>

                  <Button
                    onClick={handleOpenSandbox}
                    variant="outline"
                    className="w-full rounded-xl"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open local sandbox preview
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardDescription>API surface</CardDescription>
                <CardTitle className="text-base">Widget endpoints</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">Endpoint</th>
                      <th className="px-4 py-3 font-medium">Purpose</th>
                      <th className="px-4 py-3 text-right font-medium">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {widgetRoutesList.map((route, i) => (
                      <tr key={i} className="border-b border-border last:border-none">
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {route.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                          {route.path}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                          {route.purpose}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <CopyBtn text={`${apiBaseUrl}${route.path}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardDescription>How it works</CardDescription>
                <CardTitle className="text-base">Integration flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  1. The embed script initializes a visitor session and loads the widget client using your public widget token.
                </p>
                <p>
                  2. Messages are sent to the widget conversation endpoints, where retrieval and response generation happen on the server.
                </p>
                <p>
                  3. Optional identify calls can attach customer metadata to sessions for support workflows and downstream tooling.
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="border-t border-border bg-muted/10 p-6 xl:border-l xl:border-t-0">
            <div className="sticky top-0 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Live preview
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preview how your widget will appear with the current settings.
                </p>
              </div>

              <div className="mx-auto w-full max-w-[300px] rounded-[24px] border border-border bg-background shadow-lg">
                <div
                  className="flex items-center justify-between rounded-t-[24px] px-4 py-3 text-white"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {themeConfig.title || "Support chat"}
                    </p>
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="space-y-3 bg-muted/20 px-3 py-4 text-sm">
                  <div className="max-w-[85%] rounded-2xl border border-border bg-background px-3 py-2.5 text-foreground shadow-sm">
                    {welcomeMessage}
                  </div>

                  <div className="ml-auto max-w-[85%] rounded-2xl bg-primary/10 px-3 py-2.5 text-foreground">
                    How does the widget work?
                  </div>

                  <div className="max-w-[85%] rounded-2xl border border-border bg-background px-3 py-2.5 text-foreground shadow-sm">
                    It loads your chatbot in an embedded client and sends visitor messages through the widget API.
                  </div>
                </div>

                <div className="border-t border-border bg-background p-3">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-2">
                    <input
                      readOnly
                      placeholder="Ask a question..."
                      className="flex-1 bg-transparent text-xs text-muted-foreground outline-none"
                    />
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: themeConfig.primaryColor }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-md transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{themeConfig.launcherLabel || "Chat with us"}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}