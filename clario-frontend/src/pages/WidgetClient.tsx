import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Send, ArrowRight, Bot, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ id: string; title: string; type: string }>;
}

export default function WidgetClient() {
  const { widgetToken } = useParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Synced config overrides from parent script loader
  const [config, setConfig] = useState({
    themeColor: '#3b82f6',
    title: 'Support Chat',
    welcomeMessage: 'Hello! How can I help you today?',
    apiBase: 'http://localhost:3000/api/v1',
    borderRadius: '12px'
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // visitor and conversation references
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // 1. Setup window message listener for syncing attributes from host
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      switch(data.type) {
        case 'CLAIRO_SYNC_CONFIG':
          if (data.config) {
            setConfig(prev => ({
              ...prev,
              ...data.config
            }));
          }
          break;
        case 'CLAIRO_WIDGET_OPEN':
          // Auto-scroll to bottom when opened
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify loader that the iframe is mounted and ready for synchronization
    window.parent.postMessage({ type: 'CLAIRO_IFRAME_READY' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 2. Hydrate welcome message and initialize visitor session
  useEffect(() => {
    // Load existing visitor details from local storage if available
    const savedVisitor = localStorage.getItem(`clairo_visitor_${widgetToken}`);
    const savedConv = localStorage.getItem(`clairo_conv_${widgetToken}`);

    // Set initial greeting
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: config.welcomeMessage
      }
    ]);

    // Bootstrap widget session
    const initSession = async () => {
      try {
        const res = await axios.post(`${config.apiBase}/widget/${widgetToken}/session`, {
          visitorId: savedVisitor || undefined
        });

        const data = res.data;
        if (data.visitorId) {
          setVisitorId(data.visitorId);
          localStorage.setItem(`clairo_visitor_${widgetToken}`, data.visitorId);
        }
        if (data.conversationId) {
          setConversationId(data.conversationId);
          localStorage.setItem(`clairo_conv_${widgetToken}`, data.conversationId);
        }
      } catch (err) {
        console.error('[Clairo Widget] Session bootstrap failed:', err);
      }
    };

    initSession();
  }, [widgetToken, config.welcomeMessage, config.apiBase]);

  // Auto scroll logic
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 3. Send message handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || loading) return;

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: text
    }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await axios.post(`${config.apiBase}/widget/${widgetToken}/messages`, {
        visitorId,
        conversationId,
        message: text
      });

      const data = res.data;
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(`clairo_conv_${widgetToken}`, data.conversationId);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate an answer.',
        citations: data.citations
      }]);
    } catch (err: any) {
      console.error('[Clairo Widget] Error posting chat:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err.response?.data?.error || 'Something went wrong. Please check connection.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.parent.postMessage({ type: 'CLAIRO_IFRAME_CLOSE' }, '*');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background border border-border/80 overflow-hidden select-none">
      
      {/* Header */}
      <div 
        className="p-3 text-white flex items-center justify-between shadow-sm shrink-0" 
        style={{ backgroundColor: config.themeColor }}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div className="text-xs font-bold truncate max-w-[190px]">{config.title}</div>
        </div>
        <button 
          onClick={handleClose}
          className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4 bg-muted/15 font-sans text-xs">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role !== 'user' && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted text-[10px] shrink-0 border border-border">
                🤖
              </div>
            )}
            <div className="max-w-[80%] space-y-2">
              <div className={cn(
                "p-2.5 rounded-lg border",
                msg.role === 'user'
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm"
                  : "bg-background text-slate-800 dark:text-slate-200 border-border"
              )}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {/* Citations block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.citations.map((cit, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-[10px] border border-border text-muted-foreground"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[90px]">{cit.title}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted text-[10px] shrink-0 border border-border">
              🤖
            </div>
            <div className="bg-background border border-border p-2.5 rounded-lg text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-border bg-background flex items-center gap-2 shrink-0">
        <input 
          placeholder="Ask a question..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 p-2 text-xs border border-border rounded-lg bg-background outline-none focus:border-primary transition-colors disabled:opacity-50"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={loading || !inputText.trim()}
          className="w-8 h-8 shrink-0" 
          style={{ backgroundColor: config.themeColor }}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </Button>
      </form>

    </div>
  );
}
