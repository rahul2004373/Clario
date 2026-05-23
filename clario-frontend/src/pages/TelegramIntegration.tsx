import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, ArrowLeft, Bot, HelpCircle, RefreshCw, Key, Shield, 
  ExternalLink, Check, Trash2, Power, AlertCircle 
} from 'lucide-react';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TelegramIntegration() {
  const { workspaceId, chatbotId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tokenInput, setTokenInput] = useState('');
  const [copied, setCopied] = useState(false);

  // 1. Fetch Telegram Integration Status
  const { data: statusRes, isLoading } = useQuery({
    queryKey: ['telegramIntegrationStatus', chatbotId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/integrations/telegram`);
      return res.data?.data;
    }
  });

  const integration = statusRes || { connected: false, isActive: false };

  // 2. Connect Bot Mutation
  const connectMutation = useMutation({
    mutationFn: async (botToken: string) => {
      const res = await api.post(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/integrations/telegram`, {
        botToken
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegramIntegrationStatus', chatbotId] });
      queryClient.invalidateQueries({ queryKey: ['telegramStatus', chatbotId] });
      setTokenInput('');
      alert('Telegram bot connected successfully!');
    },
    onError: (err: any) => {
      alert(`Connection failed: ${err.response?.data?.error || err.message}`);
    }
  });

  // 3. Disconnect Bot Mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/integrations/telegram`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegramIntegrationStatus', chatbotId] });
      queryClient.invalidateQueries({ queryKey: ['telegramStatus', chatbotId] });
      alert('Telegram integration disconnected.');
    },
    onError: (err: any) => {
      alert(`Disconnection failed: ${err.response?.data?.error || err.message}`);
    }
  });

  // 4. Toggle Integration Active State
  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await api.patch(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/integrations/telegram/toggle`, {
        isActive
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegramIntegrationStatus', chatbotId] });
      queryClient.invalidateQueries({ queryKey: ['telegramStatus', chatbotId] });
    },
    onError: (err: any) => {
      alert(`Failed to toggle: ${err.response?.data?.error || err.message}`);
    }
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      alert('Please enter a valid Bot Token first.');
      return;
    }
    connectMutation.mutate(token);
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect this Telegram bot? It will stop responding immediately.')) {
      disconnectMutation.mutate();
    }
  };

  const handleToggle = () => {
    toggleMutation.mutate(!integration.isActive);
  };

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground bg-background">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Fetching Telegram status...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* Top Header Bar */}
      <header className="border-b border-border bg-muted/10 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/dashboard/${workspaceId}/chatbots/${chatbotId}`)}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-500" />
            <h1 className="text-base font-bold">Telegram Channel Setup</h1>
          </div>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Connection Form & Info Card */}
        {!integration.connected ? (
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="p-6 border-b bg-muted/5">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Key className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Connect Telegram Bot</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Enter your secret Bot Token obtained from BotFather to link your chatbot.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleConnect} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-xs font-semibold">HTTP API Bot Token</Label>
                  <Input 
                    type="password" 
                    id="token" 
                    placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="text-xs font-mono"
                    disabled={connectMutation.isPending}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={connectMutation.isPending}
                  className="text-xs bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {connectMutation.isPending ? 'Connecting...' : 'Establish Connection'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Connection Information */}
            <Card className="border border-border/80 md:col-span-2 shadow-sm">
              <CardHeader className="p-6 border-b bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Bot className="w-4 h-4 text-sky-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Telegram Configuration</CardTitle>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                    Connected
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4 border-border/60">
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block tracking-wider">Bot Username</span>
                    <span className="font-mono text-foreground text-sm font-semibold">@{integration.botUsername}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block tracking-wider">Active Channel</span>
                    <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${integration.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {integration.isActive ? 'Receiving chats' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold block">Telegram Access Link</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={`https://t.me/${integration.botUsername}`} 
                      className="font-mono text-xs bg-muted/65 text-slate-800 dark:text-slate-100 h-9" 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyLink(`https://t.me/${integration.botUsername}`)}
                      className="text-xs shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : 'Copy Link'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => window.open(`https://t.me/${integration.botUsername}`, '_blank')}
                      className="text-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 border-t border-border/40 bg-muted/5 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleToggle}
                  disabled={toggleMutation.isPending}
                  className="text-xs font-semibold flex items-center gap-1.5"
                >
                  <Power className={`w-3.5 h-3.5 ${integration.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                  <span>{integration.isActive ? 'Pause Bot' : 'Activate Bot'}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="text-xs font-semibold hover:bg-rose-500/10 text-rose-500 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect Integration</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Status Stats Card */}
            <Card className="border border-border/80 md:col-span-1 shadow-sm flex flex-col justify-between">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4 flex-1 flex flex-col justify-center">
                <div className="text-center space-y-2">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${integration.isActive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                    <Bot className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold">{integration.isActive ? 'Bot is Live' : 'Bot is Paused'}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {integration.isActive 
                      ? 'The bot will process real-time chats, parse vectors, and render answers.' 
                      : 'The bot is active in Telegram but will not answer customer inquiries.'}
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* BotFather Help Section */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="p-6 border-b bg-muted/5">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">BotFather Setup Guide</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Follow these simple steps to obtain your Telegram HTTP Token:
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 text-xs text-muted-foreground space-y-4">
            <ol className="list-decimal pl-5 space-y-2.5">
              <li>
                Open <strong>Telegram</strong> and search for the verified account <strong>@BotFather</strong> (look for the verified blue badge).
              </li>
              <li>
                Send the message <code>/newbot</code> to initiate creation.
              </li>
              <li>
                Enter a <strong>Display Name</strong> for your chatbot assistant (e.g. <code>Clairo Support Bot</code>).
              </li>
              <li>
                Enter a unique <strong>Username</strong> for your bot. This must end in `bot` (e.g. <code>clairo_support_bot</code>).
              </li>
              <li>
                BotFather will successfully register your bot and output an <strong>HTTP API Token</strong> inside the completion message. Copy this token string, paste it inside the connection form above, and establish your connection!
              </li>
            </ol>
          </CardContent>
        </Card>

      </main>

    </div>
  );
}
