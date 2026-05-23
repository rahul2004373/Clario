import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Send, Terminal, MessageSquare, ArrowRight, ExternalLink, Bot, Check, HelpCircle } from 'lucide-react';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DeployTabProps {
  chatbotId: string;
  workspaceId: string;
}

export default function DeployTab({ chatbotId, workspaceId }: DeployTabProps) {
  const navigate = useNavigate();

  // Fetch Telegram integration status to show live badge indicators
  const { data: telegramStatusData } = useQuery({
    queryKey: ['telegramStatus', chatbotId],
    queryFn: async () => {
      try {
        const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/integrations/telegram`);
        return res.data?.data;
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 15000 // poll every 15s to keep dashboard status updated
  });

  const isTelegramConnected = telegramStatusData?.connected ?? false;
  const isTelegramActive = telegramStatusData?.isActive ?? false;

  return (
    <div className="p-6 space-y-6 max-w-4xl overflow-y-auto h-full bg-background">

      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">Deploy Chatbot</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Make your chatbot accessible to your customers via REST API or third-party messaging integrations.
        </p>
      </div>

      {/* Grid containing two premium SaaS channel cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

        {/* REST API Card */}
        <Card className="border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all duration-300 group hover:shadow-md">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-0.5 bg-muted rounded">
                Server-to-Server
              </span>
            </div>
            <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">Developer REST API</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1.5">
              Integrate the assistant directly into your own app interface or internal workflows via HTTP requests. Supports real-time answer generation.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-end">
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-[10px] font-mono space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">POST</span>
                <span>/v1/chatbots/:id/chat</span>
              </div>
              <p className="text-[9px] text-muted-foreground/80 mt-1">
                Authorization: Bearer clairo_sk_...
              </p>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 border-t border-border/40 bg-muted/5 flex justify-between items-center">
            <span className="text-[11px] font-medium text-muted-foreground">Unlimited calls</span>
            <Button
              onClick={() => navigate(`/dashboard/${workspaceId}/docs`)}
              size="sm"
              className="text-xs gap-1.5 group-hover:bg-primary"
            >
              <span>View API Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardFooter>
        </Card>

        {/* Telegram Card */}
        <Card className="border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all duration-300 group hover:shadow-md">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500 dark:text-sky-400">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                {isTelegramConnected ? (
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    isTelegramActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  )}>
                    {isTelegramActive ? 'Active' : 'Paused'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground uppercase tracking-wider">
                    Not Configured
                  </span>
                )}
              </div>
            </div>
            <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">Telegram Channel</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed mt-1.5">
              Connect your chatbot to a Telegram account using a Bot Token. Customers can interact and retrieve vector citations directly in Telegram.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-end">
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-[10px] font-mono space-y-1 text-muted-foreground">
              {isTelegramConnected && telegramStatusData?.botUsername ? (
                <div className="space-y-1">
                  <div className="text-foreground font-semibold flex items-center gap-1">
                    <span className="text-sky-500">@</span>{telegramStatusData.botUsername}
                  </div>
                  <p className="text-[9px] text-muted-foreground/80 truncate">
                    Link: t.me/{telegramStatusData.botUsername}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <p className="text-[10px] text-muted-foreground italic">
                    Requires a token generated via @BotFather.
                  </p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 border-t border-border/40 bg-muted/5 flex justify-between items-center">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isTelegramConnected ? 'Bot Connected' : 'Setup bot in 2 mins'}
            </span>
            <Button
              onClick={() => navigate(`/dashboard/${workspaceId}/chatbots/${chatbotId}/telegram`)}
              size="sm"
              variant={isTelegramConnected ? "outline" : "default"}
              className="text-xs gap-1.5"
            >
              <span>{isTelegramConnected ? 'Configure Bot' : 'Connect Telegram'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardFooter>
        </Card>

      </div>

      {/* Integration Helper Notice */}
      <Card className="border border-border/70 bg-muted/10">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-primary" /> Multi-Channel Deployment Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-1 text-xs text-muted-foreground leading-relaxed">
          Clairo processes queries directly through a unified ingest layer. When you connect a Telegram bot, messages sent inside chat sessions automatically index files and query vector embeddings without manual ingestion steps. Ensure you configure origin boundaries to keep operations secure.
        </CardContent>
      </Card>

    </div>
  );
}
