import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot, Code2, Copy, Check, ShieldAlert, Key, Plus, Trash2,
  Terminal, Play, ArrowLeft, Loader2, Sparkles, Server, CheckCircle2
} from 'lucide-react';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Sub-components
function CopyButton({ text }: { text: string }) {
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
      className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

interface EndpointBlockProps {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  description: string;
  authRequired?: boolean;
  requestBody?: any;
  responseBodySuccess: any;
  responseBodyError?: any;
  notes?: string;
}

function EndpointBlock({
  method,
  path,
  description,
  authRequired = true,
  requestBody,
  responseBodySuccess,
  responseBodyError,
  notes
}: EndpointBlockProps) {
  return (
    <Card className="border border-border/80 overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-border bg-muted/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-xs font-bold uppercase px-2.5 py-1 rounded-md tracking-wider shrink-0",
            method === 'GET' && "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
            method === 'POST' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
            method === 'DELETE' && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
            method === 'PUT' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          )}>
            {method}
          </span>
          <code className="text-sm font-mono font-semibold select-all break-all">{path}</code>
        </div>
        {authRequired && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
            API Key Required
          </span>
        )}
      </div>

      <CardContent className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">{description}</p>

        {requestBody && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">Request Body (JSON)</span>
            <pre className="p-4 rounded-lg bg-muted/65 font-mono text-xs overflow-x-auto border border-border/40 max-h-60 text-slate-800 dark:text-slate-200">
              {JSON.stringify(requestBody, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK Example
            </span>
            <pre className="p-4 rounded-lg bg-muted/65 font-mono text-xs overflow-x-auto border border-border/40 max-h-60 text-slate-800 dark:text-slate-200">
              {JSON.stringify(responseBodySuccess, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Error Example
            </span>
            <pre className="p-4 rounded-lg bg-muted/65 font-mono text-xs overflow-x-auto border border-border/40 max-h-60 text-slate-800 dark:text-slate-200">
              {JSON.stringify(responseBodyError || {
                error: {
                  code: "UNAUTHORIZED",
                  message: "Missing or invalid Authorization header. Expected Bearer <api_key>"
                }
              }, null, 2)}
            </pre>
          </div>
        </div>

        {notes && (
          <div className="p-3 bg-amber-500/5 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-500/20 text-xs italic">
            <strong>Pro Tip:</strong> {notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ApiDocs() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'js' | 'axios' | 'python'>('curl');

  // API Keys state
  const [isKeyCreateOpen, setIsKeyCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);

  // Playground test states
  const [selectedBotId, setSelectedBotId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello, Clairo!');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<any>(null);

  // Query Workspace Details
  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}`);
      return res.data.data || res.data;
    }
  });

  // Query Chatbots for dropdown
  const { data: chatbots } = useQuery({
    queryKey: ['chatbots', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots`);
      return res.data.data || res.data;
    }
  });

  // Query API keys
  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['apiKeys', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/api-keys`);
      return res.data;
    }
  });

  // Generate API key mutation
  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      api.post(`/v1/workspaces/${workspaceId}/api-keys`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', workspaceId] });
      setJustGeneratedKey(res.data.rawKey);
      setNewKeyName('');
    }
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: string) =>
      api.delete(`/v1/workspaces/${workspaceId}/api-keys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', workspaceId] });
    }
  });

  // Automatically select first bot if available
  useEffect(() => {
    if (chatbots && chatbots.length > 0 && !selectedBotId) {
      setSelectedBotId(chatbots[0].id);
    }
  }, [chatbots, selectedBotId]);

  const activeApiKey = apiKeys && apiKeys.length > 0 ? apiKeys[0].key : 'YOUR_API_KEY';
  const activeBotIdPlaceholder = selectedBotId || 'YOUR_CHATBOT_ID';
  const apiBaseUrl = `${window.location.protocol}//${window.location.host.replace(':5173', ':3000')}/public/v1`;

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyName.trim()) {
      createKeyMutation.mutate({ name: newKeyName });
    }
  };

  const executeMockPlayground = async () => {
    if (!selectedBotId) return;
    setPlaygroundLoading(true);
    setPlaygroundOutput(null);

    // Give it a realistic typing delay
    setTimeout(() => {
      setPlaygroundOutput({
        response: `Based on your ingestion settings, I can answer your query: "${testMessage}". As the Clairo chatbot assistant, I access workspace sources to provide citation-backed solutions.`,
        citations: [
          {
            id: "source_doc_01",
            title: "Quickstart Guide.pdf",
            type: "pdf"
          }
        ]
      });
      setPlaygroundLoading(false);
    }, 1200);
  };

  // Sections navigation configurations
  const docSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'auth', label: 'Authentication' },
    { id: 'keys', label: 'API Keys Panel' },
    { id: 'endpoints', label: 'Endpoints Reference' },
    { id: 'code-examples', label: 'Code Examples' },
    { id: 'errors', label: 'Common Errors' },
    { id: 'playground', label: 'Interactive Console' }
  ];

  // Dynamic code snippets
  const getCodeSnippet = () => {
    const headerString = `-H "Authorization: Bearer ${activeApiKey}" -H "Content-Type: application/json"`;
    const payload = JSON.stringify({ message: testMessage }, null, 2);

    switch (selectedLang) {
      case 'curl':
        return `curl -X POST "${apiBaseUrl}/chatbots/${activeBotIdPlaceholder}/chat" \\\n  ${headerString} \\\n  -d '${payload.replace(/'/g, "'\\''")}'`;
      case 'js':
        return `const response = await fetch("${apiBaseUrl}/chatbots/${activeBotIdPlaceholder}/chat", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer ${activeApiKey}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    message: "${testMessage}"\n  })\n});\nconst data = await response.json();\nconsole.log(data);`;
      case 'axios':
        return `const axios = require("axios");\n\naxios.post(\n  "${apiBaseUrl}/chatbots/${activeBotIdPlaceholder}/chat",\n  { message: "${testMessage}" },\n  {\n    headers: {\n      Authorization: "Bearer ${activeApiKey}"\n    }\n  }\n).then(res => {\n  console.log(res.data);\n}).catch(err => {\n  console.error(err);\n});`;
      case 'python':
        return `import requests\n\nurl = "${apiBaseUrl}/chatbots/${activeBotIdPlaceholder}/chat"\nheaders = {\n    "Authorization": "Bearer ${activeApiKey}",\n    "Content-Type": "application/json"\n}\ndata = {\n    "message": "${testMessage}"\n}\n\nresponse = requests.post(url, headers=headers, json=data)\nprint(response.json())`;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Sidebar Nav */}
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate(`/dashboard/${workspaceId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-sm truncate">Developer Hub</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Navigation
          </div>
          {docSections.map(sec => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSection(sec.id);
                document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                "w-full flex items-center px-3 py-2 text-xs rounded-md font-medium transition-all text-left",
                activeSection === sec.id
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background flex flex-col">

        {/* Header */}
        <header className="sticky top-0 bg-background/85 backdrop-blur-md border-b border-border p-6 flex justify-between items-center z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded">REST API</span>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Clairo Developer API</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-muted-foreground" /> Base URL:
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs select-all text-primary font-medium">{apiBaseUrl}</code>
              <CopyButton text={apiBaseUrl} />
            </p>
          </div>
        </header>

        {/* Sections Scroll Grid */}
        <div className="p-8 max-w-4xl mx-auto space-y-16 pb-24 flex-1">

          {/* Section 1: Overview */}
          <section id="overview" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Overview
            </h2>
            <div className="prose dark:prose-invert text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                The <strong>Clairo Developer API</strong> provides programmatic, server-to-server access to your workspaces, chatbots, vector ingestion indexing, and real-time chat endpoints.
              </p>
              <p>
                Whether you want to build custom agent integrations, sync large volumes of local files for indexing, or stream responses directly into your custom mobile or web apps, the developer REST API grants absolute programmatic authority under your secret token.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="bg-muted/10 border-border/80">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-semibold">When to use REST API</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <p>• Integrating chat responses directly inside Slack, Discord, or custom backend services.</p>
                    <p>• Building server cronjobs to auto-sync internal directories into Clairo vector memory.</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/10 border-border/80">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-semibold">When to use Embedded Widget</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <p>• Placing a ready-made floating chat circle onto customer-facing Shopify or static websites.</p>
                    <p>• No complex coding required; customizable directly via the dashboard styling section.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Section 2: Authentication */}
          <section id="auth" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" /> Authentication
            </h2>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                All REST API calls to the Clairo public endpoints must include your secret API key in the `Authorization` header as a Bearer Token.
              </p>
              <pre className="p-4 rounded-lg bg-slate-950 text-white font-mono text-xs overflow-x-auto border border-border flex items-center justify-between">
                <span>Authorization: Bearer {activeApiKey}</span>
                <CopyButton text={`Authorization: Bearer ${activeApiKey}`} />
              </pre>
              <Card className="border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-200 mt-4">
                <CardHeader className="flex flex-row items-center gap-2.5 py-3">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400">Critical Security Warning</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1 pb-4 leading-relaxed">
                  <p>• <strong>Never expose your Clairo API keys in raw client-side code</strong> (browser, public git repos, or mobile frontend apps).</p>
                  <p>• Always process interactions using a secure backend middleware, referencing keys stored inside server-side environment variables.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 3: Keys Panel */}
          <section id="keys" className="space-y-4 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-2">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Key className="w-6 h-6 text-primary" /> API Keys Manager
              </h2>
              <Dialog open={isKeyCreateOpen} onOpenChange={(open) => {
                setIsKeyCreateOpen(open);
                if (!open) setJustGeneratedKey(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> Generate Key</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Workspace API Key</DialogTitle>
                    <DialogDescription>
                      This secret key grants programmatic server access to workspace: <strong className="text-foreground">{workspace?.name || 'this workspace'}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateKey} className="space-y-4 mt-2">
                    {justGeneratedKey ? (
                      <div className="space-y-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <Label className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Secret Key Generated Successfully
                        </Label>
                        <p className="text-[11px] text-muted-foreground italic">
                          Copy this secret token now. For security purposes, it will never be fully shown again.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={justGeneratedKey} className="font-mono bg-muted/65 text-xs text-slate-800 dark:text-slate-100" />
                          <CopyButton text={justGeneratedKey} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="key-name">API Key Name / Description</Label>
                        <Input
                          id="key-name"
                          placeholder="e.g. Production Webhook Server"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <DialogFooter className="gap-2">
                      <Button type="button" variant="ghost" onClick={() => setIsKeyCreateOpen(false)}>
                        {justGeneratedKey ? 'Close' : 'Cancel'}
                      </Button>
                      {!justGeneratedKey && (
                        <Button type="submit" disabled={createKeyMutation.isPending}>
                          {createKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}
                        </Button>
                      )}
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                API keys are associated directly with your active workspace. Any keys generated here are used to authorize commands.
              </p>

              {keysLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="border border-border/80 rounded-lg overflow-hidden bg-background">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/70 text-muted-foreground">
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Key Token Prefix</th>
                        <th className="p-3 font-semibold">Created At</th>
                        <th className="p-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys?.map((k: any) => (
                        <tr key={k.id} className="border-b border-border/60 hover:bg-muted/10 last:border-none">
                          <td className="p-3 font-medium text-foreground">{k.name}</td>
                          <td className="p-3 font-mono text-[11px] text-muted-foreground">
                            {k.key ? `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}` : '••••••••••••••••'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(k.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
                              onClick={() => {
                                if (confirm('Are you sure you want to revoke this secret API key? Any applications currently calling this key will break.')) {
                                  deleteKeyMutation.mutate(k.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!apiKeys || apiKeys.length === 0) && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                            No secret API keys have been generated yet for this workspace. Click "Generate Key" to create your first one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Endpoints Reference */}
          <section id="endpoints" className="space-y-6 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
              <Terminal className="w-6 h-6 text-primary" /> Endpoints Reference
            </h2>
            <div className="space-y-6">

              <EndpointBlock
                method="POST"
                path={`/chatbots/:chatbotId/chat`}
                description="Queries your chatbot directly. This endpoint runs the complete ingestion search pipeline (RAG) using your vectorized documents, analyzes conversation history (up to 6 past messages), updates session information, and triggers standard model generation."
                requestBody={{
                  message: "Can you detail the workflow metrics?",
                  stream: false
                }}
                responseBodySuccess={{
                  response: "Workflow metrics are processed through Supabase DB and local Prometheus registers, enabling real-time Grafana dashboard streams.",
                  citations: [
                    {
                      id: "source_doc_99",
                      title: "Architecture Metrics.txt",
                      type: "txt"
                    }
                  ]
                }}
                notes="You can trigger full, real-time chunk streams using the SSE (/chat/stream) route instead."
              />

              <EndpointBlock
                method="GET"
                path={`/chatbots`}
                description="Retrieves a complete array of all AI chatbot assistants available under the authorized workspace context."
                responseBodySuccess={[
                  {
                    id: "cf1b6a18-e390-41ab-85d1-610a2eb833ff",
                    name: "Customer Agent",
                    systemPrompt: "You are a helpful agent...",
                    workspaceId: "89e255ff-02f5-443c-a9d3-96b32d895882",
                    createdAt: "2026-05-18T10:00:00.000Z",
                    updatedAt: "2026-05-18T10:00:00.000Z"
                  }
                ]}
              />

              <EndpointBlock
                method="POST"
                path={`/chatbots/:chatbotId/sources/text`}
                description="Programmatically adds a direct text snippet data source to your chatbot. This triggers localized async document ingestion and Retraining/Re-indexing pipelines."
                requestBody={{
                  name: "FAQ Handout",
                  content: "We accept PayPal, Stripe, and global cards. Refunds are available within 30 days."
                }}
                responseBodySuccess={{
                  id: "src_88e0e1f2-990a",
                  name: "FAQ Handout",
                  type: "text",
                  status: "PENDING",
                  chatbotId: "cf1b6a18-e390-41ab-85d1-610a2eb833ff",
                  createdAt: "2026-05-22T07:00:00.000Z"
                }}
                notes="After posting sources, query the /sources/:sourceId endpoint to monitor validation, chunking, and final vector indexing status."
              />

            </div>
          </section>

          {/* Section 5: Code Examples */}
          <section id="code-examples" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" /> Code Examples
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quick copyable templates in multiple language packages to jumpstart integrations directly inside your backend stack.
              </p>

              <div className="border border-border/80 rounded-lg overflow-hidden bg-background">
                {/* Tabs Selector */}
                <div className="flex border-b border-border bg-muted/20">
                  {([
                    { id: 'curl', label: 'cURL' },
                    { id: 'js', label: 'JS Fetch' },
                    { id: 'axios', label: 'Axios / Node' },
                    { id: 'python', label: 'Python' }
                  ] as const).map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLang(lang.id)}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold border-r border-border transition-all",
                        selectedLang === lang.id
                          ? "bg-background text-foreground border-b-2 border-b-primary"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                {/* Block Content */}
                <div className="p-4 bg-slate-950 text-white font-mono text-xs overflow-x-auto relative group">
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={getCodeSnippet()} />
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed select-all">
                    {getCodeSnippet()}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Common Errors */}
          <section id="errors" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" /> Common Errors
            </h2>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>Clairo public endpoints return standard REST response codes combined with explanatory JSON error logs.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border bg-background">
                  <CardHeader className="py-3 bg-muted/15 border-b border-border/60">
                    <CardTitle className="text-xs font-mono font-bold text-sky-500">400 BAD_REQUEST</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs p-4 leading-relaxed">
                    The query/body missing fields. Commonly returned if your `message` body is empty or improperly typed.
                  </CardContent>
                </Card>

                <Card className="border-border bg-background">
                  <CardHeader className="py-3 bg-muted/15 border-b border-border/60">
                    <CardTitle className="text-xs font-mono font-bold text-rose-500">401 UNAUTHORIZED</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs p-4 leading-relaxed">
                    Missing or invalid Authorization Bearer API Key. Ensure that your workspaces key has not been revoked.
                  </CardContent>
                </Card>

                <Card className="border-border bg-background">
                  <CardHeader className="py-3 bg-muted/15 border-b border-border/60">
                    <CardTitle className="text-xs font-mono font-bold text-amber-500">404 NOT_FOUND</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs p-4 leading-relaxed">
                    Either the public API router cannot find the path, or the specific chatbotId/sourceId you requested does not exist.
                  </CardContent>
                </Card>

                <Card className="border-border bg-background">
                  <CardHeader className="py-3 bg-muted/15 border-b border-border/60">
                    <CardTitle className="text-xs font-mono font-bold text-purple-500">429 RATE_LIMIT_EXCEEDED</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs p-4 leading-relaxed">
                    API calls exceeded the standard security thresholds. Rate limits are bucketed workspace-wide per minute.
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Section 7: Playground / Mock API Console */}
          <section id="playground" className="space-y-4 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
              <Play className="w-6 h-6 text-primary" /> Interactive API Console
            </h2>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                Run interactive, client-side queries directly in your browser. Choose your assistant, input a query, and analyze mock RAG indexing results.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* Configuration Panel */}
                <Card className="border border-border/80">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Terminal className="w-4 h-4 text-primary" /> Request Config</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="playground-bot-select" className="text-xs font-semibold">Select Target Chatbot</Label>
                      <select
                        id="playground-bot-select"
                        value={selectedBotId}
                        onChange={(e) => setSelectedBotId(e.target.value)}
                        className="w-full p-2 text-xs border border-border rounded-lg bg-background"
                      >
                        {chatbots?.map((bot: any) => (
                          <option key={bot.id} value={bot.id}>{bot.name}</option>
                        ))}
                        {(!chatbots || chatbots.length === 0) && (
                          <option value="">No chatbots detected</option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="playground-message" className="text-xs font-semibold">Request payload (message)</Label>
                      <Input
                        id="playground-message"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="e.g. What is the API health?"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/60 bg-muted/10">
                    <Button
                      className="w-full"
                      disabled={playgroundLoading || !selectedBotId}
                      onClick={executeMockPlayground}
                    >
                      {playgroundLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Request Pending...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" /> Send Mock API Request
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Response Panel */}
                <Card className="border border-border/80 flex flex-col bg-muted/10">
                  <CardHeader className="py-4 border-b border-border/60 bg-background">
                    <CardTitle className="text-xs font-mono font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200">
                      HTTP/1.1 {playgroundOutput ? '200 OK' : 'Waiting...'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 font-mono text-xs overflow-x-auto min-h-60">
                    {playgroundOutput ? (
                      <pre className="text-slate-800 dark:text-slate-200">
                        {JSON.stringify(playgroundOutput, null, 2)}
                      </pre>
                    ) : playgroundLoading ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 mt-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-[11px] animate-pulse">Running Ingestion Vector Queries...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground italic text-center mt-16">
                        Configure headers above and click "Send Request" to trigger programmatic queries.
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}
