"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Globe,
  BarChart3,
  ExternalLink,
  Bot,
  ArrowUp,
  ArrowRight,
  Home,
  LayoutGrid,
  FileText,
  RefreshCw,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { UserAvatar } from "@/components/ui/user-avatar";
import { SmoothScrollProvider, useLenis } from "@/components/SmoothScrollProvider";

/* ───────────────────────────────────────────────
   Chat Demo Widget — auto-looping scripted demo
   ─────────────────────────────────────────────── */

type DemoMessage = { role: "bot" | "user"; text: string };

const SCRIPTS: Record<string, string> = {
  "react component": "I'd scaffold it with `createPortal` for the overlay, `useRef` for focus trapping, and a `Transition` from Headless UI for enter/exit animations. Want me to draft it?",
  "debounce": "Easy — wrap your handler with a 300 ms delay: `useEffect` + `setTimeout` + cleanup. Keeps the API call from firing on every keystroke.",
  "styled components": "Install `styled-components`, create a `StyledButton`, flip to the `.attrs` method for dynamic props. Polymorphic asides optional but elegant.",
  "api endpoint": "Hit `GET /api/projects` with an `Authorization` header. I'd cache the response in a `useSWR` or React Query key so re-renders are instant.",
  "dark mode": "Use a `ThemeProvider` that reads a `data-theme` attribute on `<html>`. Toggle via `next-themes` or a hand-rolled Zustand slice — your call.",
  "optimize": "Split bundles with `React.lazy`, memoize heavy components with `React.memo`, and profile with the React DevTools flame chart. Start with the low-hanging fruit.",
};

const GENERIC_FALLBACK =
  "Great question! I can help with components, hooks, styling, API design, and more. Could you narrow it down a bit?";

function matchResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, reply] of Object.entries(SCRIPTS)) {
    if (lower.includes(key)) return reply;
  }
  return GENERIC_FALLBACK;
}

const DEMO_QA = [
  {
    question: "What can you help me with?",
    answer: "I can assist with a wide range of tasks — answering questions about your products, helping users navigate your site, providing documentation, and escalating complex issues to your support team when needed. Think of me as your always-on frontline assistant.",
  },
  {
    question: "Can you connect me with a human?",
    answer: "Absolutely! If I can't resolve your issue, I'll collect the relevant context and route you to the right person on the support team. Just say \"transfer to agent\" and I'll set everything up for a smooth handoff.",
  },
  {
    question: "Do you support multiple languages?",
    answer: "Yes! I can communicate in multiple languages and detect the language you're writing in automatically. Currently I support English, Spanish, French, German, and more — so your users can get help in the language they're most comfortable with.",
  },
];

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-1.5 rounded-full bg-zinc-500"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function ChatDemoWidget() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    { role: "bot", text: "Hi! I'm Clario — your AI assistant. Feel free to ask me anything — I'll show you how it works! 👋" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [streamingRole, setStreamingRole] = useState<"bot" | "user" | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoIdxRef = useRef(0);
  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const [loopTick, setLoopTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Scroll ONLY the internal message container — never the page */
  useEffect(() => {
    const el = messageContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streamingText, isTyping]);

  const resetChat = useCallback(() => {
    clearTimeout(timerRef.current);
    cancelledRef.current = true;
    pausedRef.current = false;
    autoIdxRef.current = 0;
    setMessages([
      { role: "bot", text: "Hi! I'm Clario — your AI assistant. Feel free to ask me anything — I'll show you how it works! 👋" },
    ]);
    setInput("");
    setIsTyping(false);
    setStreamingText(null);
    setStreamingRole(null);
    setTimeout(() => {
      cancelledRef.current = false;
      setLoopTick((t) => t + 1);
    }, 500);
  }, []);

  /* Auto-loop effect — restartable via loopTick state */
  useEffect(() => {
    if (pausedRef.current) return;
    cancelledRef.current = false;
    const pair = DEMO_QA[autoIdxRef.current % DEMO_QA.length];

    function delay(ms: number): Promise<void> {
      return new Promise((resolve) => {
        timerRef.current = setTimeout(resolve, ms);
      });
    }

    let cancelled = false;

    async function runLoop() {
      /* 1 — wait 1.5s between exchanges */
      await delay(1500);
      if (cancelled) return;

      /* 2 — typewriter the user question (30ms/char) */
      setStreamingRole("user");
      for (let i = 1; i <= pair.question.length; i++) {
        setStreamingText(pair.question.slice(0, i));
        await delay(30);
        if (cancelled) return;
      }
      setMessages((prev) => [...prev, { role: "user", text: pair.question }]);
      setStreamingText(null);
      setStreamingRole(null);

      /* 3 — typing indicator ~1s */
      setIsTyping(true);
      await delay(1000);
      if (cancelled) return;

      /* 4 — typewriter the bot answer (18ms/char) */
      setIsTyping(false);
      setStreamingRole("bot");
      for (let i = 1; i <= pair.answer.length; i++) {
        setStreamingText(pair.answer.slice(0, i));
        await delay(18);
        if (cancelled) return;
      }
      setMessages((prev) => [...prev, { role: "bot", text: pair.answer }]);
      setStreamingText(null);
      setStreamingRole(null);

      /* 5 — pause ~3.5s for reading */
      await delay(3500);
      if (cancelled) return;

      /* 6 — advance to next Q&A pair, clear to greeting */
      setMessages((prev) => prev.slice(0, 1));
      autoIdxRef.current = (autoIdxRef.current + 1) % DEMO_QA.length;

      /* 7 — loop back */
      if (!pausedRef.current && !cancelled) {
        runLoop();
      }
    }

    runLoop();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [loopTick]); /* restart when loopTick changes (e.g. after user interaction) */

  /* Real user sends a message — pauses auto-loop */
  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    /* Pause the auto-loop */
    pausedRef.current = true;
    cancelledRef.current = true;
    clearTimeout(timerRef.current);
    setStreamingText(null);
    setStreamingRole(null);

    const userMsg: DemoMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const replyDelay = 1200 + Math.random() * 800;
    timerRef.current = setTimeout(() => {
      const reply = matchResponse(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      setIsTyping(false);

      /* Resume auto-loop after a pause */
      timerRef.current = setTimeout(() => {
        pausedRef.current = false;
        setLoopTick((t) => t + 1);
      }, 4000);
    }, replyDelay);
  }, [input, isTyping]);

  /* Pause auto-loop immediately when user focuses or types in the input */
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pauseLoop = useCallback(() => {
    pausedRef.current = true;
    cancelledRef.current = true;
    clearTimeout(timerRef.current);
    clearTimeout(focusTimerRef.current);
    setIsTyping(false);
    setStreamingText(null);
    setStreamingRole(null);
  }, []);

  const handleInputFocus = useCallback(() => {
    pauseLoop();
  }, [pauseLoop]);

  const handleInputBlur = useCallback(() => {
    clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      if (!pausedRef.current) return;
      if (document.activeElement === inputRef.current) return;
      pausedRef.current = false;
      cancelledRef.current = false;
      setLoopTick((t) => t + 1);
    }, 3000);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      pauseLoop();
      if (e.key === "Enter") send();
    },
    [send, pauseLoop],
  );

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-[#0A0A0A] w-full max-w-[400px] h-[560px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3 shrink-0">
        <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500">
          <Bot className="size-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Clario Chat</p>
          <p className="text-[11px] text-zinc-500 leading-tight">Online</p>
        </div>
        <button
          type="button"
          onClick={resetChat}
          className="text-zinc-500 hover:text-zinc-400 transition-colors shrink-0"
          aria-label="Reset conversation"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Messages — fixed internal scroll container */}
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4 scrollbar-thin max-h-full">
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={`msg-${i}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                  m.role === "user" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message (typewriter in progress) */}
        {streamingText && streamingRole && (
          <div className={`flex ${streamingRole === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                streamingRole === "user" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {streamingText}
              <span className="inline-block w-[2px] h-[14px] bg-zinc-400 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {isTyping && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-800 px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-5 pb-3 pt-1 shrink-0">
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="w-full rounded-full bg-zinc-900 border border-zinc-800 pl-5 pr-12 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-700"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isTyping}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-orange-500 text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-600 text-center">Powered by Clario</p>
      </div>
    </div>
  );
}


/* ───────────────────────────────────────────────
   Section wrapper (fade-in on scroll, plays once)
   ─────────────────────────────────────────────── */

function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────────────────────
   Browser chrome frame
   ─────────────────────────────────────────────── */

function BrowserFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#D4D4D8] bg-white shadow-sm ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 border-b border-[#E4E4E7] bg-[#FAFAFA] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#EF4444]" />
        <span className="size-2.5 rounded-full bg-[#EAB308]" />
        <span className="size-2.5 rounded-full bg-[#22C55E]" />
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Navbar — light glass-morphism floating pill
   ─────────────────────────────────────────────── */

function Navbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [authReady, setAuthReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lenis = useLenis();

  const isLoggedIn = !!user;

  useEffect(() => {
    fetchCurrentUser();
    setAuthReady(true);
  }, [fetchCurrentUser]);

  const dashboardHref = currentWorkspaceId
    ? `/workspace/${currentWorkspaceId}/agents`
    : "/workspace/create";

  const navLinks = [
    { label: "Home", href: "#", icon: Home },
    { label: "How it works", href: "#how-it-works", icon: LayoutGrid },
    { label: "Docs", href: "#docs", icon: FileText },
  ];

  function handleNavClick(href: string, e: React.MouseEvent) {
    e.preventDefault();
    if (href === "#") {
      lenis?.scrollTo(0, { offset: 0 });
    } else {
      lenis?.scrollTo(href, { offset: -100 });
    }
  }

  return (
    <>
      <nav className="fixed top-4 z-50 w-[calc(100%-2rem)] max-w-7xl left-1/2 -translate-x-1/2 rounded-xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="flex size-7 items-center justify-center rounded-md text-white text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #F97316, #7C3AED)",
              }}
            >
              C
            </div>
            <span className="text-[15px] font-semibold text-zinc-800">Clario</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(link.href, e)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-900 hover:bg-zinc-100/60"
              >
                <link.icon className="size-4" />
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {!authReady ? (
              <div className="h-8 w-16" />
            ) : isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.97]"
              >
                <LayoutDashboard className="size-3.5" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center justify-center rounded-lg px-3.5 text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.97]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center p-1 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-zinc-700" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl"
          >
            <div className="flex h-14 items-center justify-between px-6 border-b border-zinc-100">
              <Link href="/" className="flex items-center gap-2">
                <div
                  className="flex size-7 items-center justify-center rounded-md text-white text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #F97316, #7C3AED)",
                  }}
                >
                  C
                </div>
                <span className="text-[15px] font-semibold text-zinc-800">Clario</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center p-1"
                aria-label="Close menu"
              >
                <X size={20} className="text-zinc-700" />
              </button>
            </div>
            <div className="flex flex-col gap-1 px-6 pt-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleNavClick(link.href, e);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  <link.icon className="size-4.5 text-zinc-500" />
                  {link.label}
                </a>
              ))}
              <div className="mt-6 flex flex-col gap-2">
                {!authReady ? null : isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      router.push(dashboardHref);
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 text-[14px] font-medium text-white transition-all active:scale-[0.97]"
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 px-6 text-[14px] font-medium text-zinc-700 transition-all active:scale-[0.97]"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-[14px] font-medium text-white transition-all active:scale-[0.97]"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────────────────────────────────────────
   Stacking cards data
   ─────────────────────────────────────────────── */

const STACKING_CARDS = [
  {
    title: "Multi-source knowledge ingestion",
    description:
      "Upload PDFs, paste text snippets, or point to a website URL. Clario ingests everything automatically — no manual formatting needed. Your entire knowledge base is ready in seconds.",
    buttonLabel: "View documentation",
    buttonHref: "#",
  },
  {
    title: "Real-time AI responses powered by RAG",
    description:
      "Every answer is grounded in your data. Retrieval-Augmented Generation ensures responses are accurate, contextual, and cite the sources they came from — no hallucinations.",
    buttonLabel: "Learn about RAG",
    buttonHref: "#",
  },
  {
    title: "Deploy anywhere with one script tag",
    description:
      "Embed your agent on any website with a single script tag, integrate via our REST API, or share a direct link. Your chatbot goes live in minutes — no DevOps needed.",
    buttonLabel: "See deployment guides",
    buttonHref: "#",
  },
];

/* ───────────────────────────────────────────────
   Stacking Cards Section (sticky overlap + scroll scrub)
   ─────────────────────────────────────────────── */

function StackingCardsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const cardData = STACKING_CARDS;
  const n = cardData.length;

  const cardScale = cardData.map((_, i) => {
    const t0 = Math.max(0, i / n - 0.08);
    const t1 = i / n;
    const t2 = (i + 1) / n;
    const t3 = Math.min((i + 1) / n + 0.08, 1);
    const inputs: number[] = [t0, t1, t2];
    const outputs: number[] = [1, 1, 0.94];
    if (t3 > t2) { inputs.push(t3); outputs.push(0.94); }
    return useTransform(scrollYProgress, inputs, outputs);
  });

  const cardOpacity = cardData.map((_, i) => {
    const t0 = Math.max(0, i / n - 0.08);
    const t1 = i / n;
    const t2 = (i + 1) / n;
    const t3 = Math.min((i + 1) / n + 0.08, 1);
    const inputs: number[] = [t0, t1, t2];
    const outputs: number[] = [1, 1, 0.7];
    if (t3 > t2) { inputs.push(t3); outputs.push(0.7); }
    return useTransform(scrollYProgress, inputs, outputs);
  });

  /*
   * ── Stacking-card images ──
   * Drop your images here:
   *   /public/images/stacking-cards/card-1.webp  — Multi-source knowledge ingestion
   *   /public/images/stacking-cards/card-2.webp  — Real-time AI responses (RAG)
   *   /public/images/stacking-cards/card-3.webp  — One-script deployment
   *
   * Recommended size: 1200×800 px (3:2 ratio), all three identical aspect ratio.
   * Images render at ~45-50 % of the 1300 px card width, object-fit: cover.
   * Until the files exist the dashed placeholder remains visible.
   */

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `${n * 100}vh` }}
    >
      {cardData.map((card, i) => (
        <div
          key={i}
          className="sticky flex items-center justify-center"
          style={{
            top: "100px",
            height: "calc(100vh - 200px)",
            zIndex: i,
          }}
        >
          <motion.div
            style={{
              scale: cardScale[i],
              opacity: cardOpacity[i],
            }}
            className="w-full max-w-[1300px] rounded-[32px] border border-[#D4D4D8] bg-white shadow-lg"
          >
            <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
              <div className="flex flex-col justify-center gap-4">
                <h3 className="text-[24px] font-semibold tracking-tight text-[#0A0A0A] md:text-[28px]">
                  {card.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[#71717A]">
                  {card.description}
                </p>
                <div>
                  <Link
                    href={card.buttonHref}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0A0A0A] px-5 text-[13px] font-medium text-white transition-all hover:bg-[#27272A] active:scale-[0.97]"
                  >
                    {card.buttonLabel}
                  </Link>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <img
                  src={`/images/card-${i + 1}.png`}
                  alt={card.title}
                  className="w-full aspect-[4/3] object-cover rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </section>
  );
}

/* ───────────────────────────────────────────────
   MAIN PAGE
   ─────────────────────────────────────────────── */

function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(videoRef, { margin: "-100px" });

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (inView) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView]);

  return (
    <div className="relative flex aspect-video items-center justify-center bg-[#0A0A0A] overflow-hidden rounded-b-xl">
      <video
        ref={videoRef}
        src="/videos/demo.mp4"
        controls
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}

export default function LandingPage() {
  const user = useUserStore((s) => s.user);
  const isLoggedIn = !!user;
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const router = useRouter();

  const dashboardHref = currentWorkspaceId
    ? `/workspace/${currentWorkspaceId}/agents`
    : "/workspace/create";

  const ctaHref = isLoggedIn ? dashboardHref : "/signup";
  const ctaLabel = isLoggedIn ? "Dashboard" : "Get started";

  return (
    <SmoothScrollProvider>
      <div className="min-h-full bg-white text-[#0A0A0A]">
        <Navbar />

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
          <div
            className="pointer-events-none absolute -top-60 -left-40 size-[600px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #F97316, transparent 60%)",
            }}
          />
          <div
            className="pointer-events-none absolute -top-60 -right-40 size-[600px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #7C3AED, transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
              {/* Left column — copy */}
              <FadeInSection>
                <div>
                  <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3 py-1 text-[12px] font-medium text-[#71717A]">
                    <span className="size-1.5 rounded-full bg-[#0A0A0A]" />
                    AI agents trained on your data
                  </p>
                  <h1 className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-tight text-[#0A0A0A] md:text-[58px]">
                    Your data, your AI agent — deployed in minutes
                  </h1>
                  <p className="mt-5 max-w-[480px] text-[15px] leading-relaxed text-[#71717A]">
                    Upload documents, connect knowledge sources, and ship a
                    production-ready chatbot across your website, app, and API — no ML
                    team required.
                  </p>
                  <div className="mt-8 flex items-center gap-3">
                    <Link
                      href={ctaHref}
                      className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-lg bg-[#0A0A0A] px-6 text-[14px] font-medium text-white transition-all active:scale-[0.97]"
                    >
                      <span
                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(135deg, #F97316, #7C3AED)",
                        }}
                      />
                      <span className="relative">{ctaLabel}</span>
                    </Link>
                    <Link
                      href="#demo"
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-[#D4D4D8] px-6 text-[14px] font-medium text-[#0A0A0A] transition-all hover:bg-[#F4F4F5] active:scale-[0.97]"
                    >
                      See it in action
                    </Link>
                  </div>
                </div>
              </FadeInSection>

              {/* Right column — chat demo */}
              <FadeInSection delay={0.2}>
                <ChatDemoWidget />
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ─── VIDEO DEMO ─── */}
        <section id="demo" className="pb-16 md:pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <FadeInSection delay={0.1}>
              <BrowserFrame>
                <DemoVideo />
              </BrowserFrame>
            </FadeInSection>
          </div>
        </section>

        {/* ─── STACKING CARDS ─── */}
        <StackingCardsSection />

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <FadeInSection>
              <p className="text-center text-[12px] font-medium uppercase tracking-[0.12em] text-[#A1A1AA]">
                How it works
              </p>
              <h2 className="mt-2 text-center text-[32px] font-semibold tracking-tight text-[#0A0A0A] md:text-[40px]">
                From data to deployed agent in three steps
              </h2>
            </FadeInSection>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { number: "01", title: "Upload your data", desc: "Drop in PDFs, paste text, or add a URL. Clario ingests everything automatically — no manual formatting." },
                { number: "02", title: "Configure your agent", desc: "Set the tone, behavior, and knowledge sources in our dashboard — zero code or ML experience required." },
                { number: "03", title: "Deploy with one click", desc: "Embed via a single script tag, integrate with our REST API, or share a direct link with your users." },
              ].map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#E4E4E7] bg-white">
                    <span
                      className="text-[18px] font-bold"
                      style={{
                        background: "linear-gradient(135deg, #F97316, #7C3AED)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {step.number}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="absolute top-7 left-[calc(50%+3rem)] hidden h-px w-[calc(100%-6rem)] bg-[#E4E4E7] md:block" />
                  )}
                  <h3 className="mt-5 text-[16px] font-semibold text-[#0A0A0A]">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#71717A]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── GRADIENT CTA ─── */}
        <div className="relative">
          {/* SVG curve divider — organic transition from white to dark */}
          <svg
            viewBox="0 0 1440 120"
            className="absolute top-0 left-0 w-full h-[60px] md:h-[100px] -translate-y-full pointer-events-none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,0 C480,120 960,120 1440,0 L1440,120 L0,120 Z"
              fill="#0A0A0A"
            />
          </svg>

          <section className="relative overflow-hidden bg-[#0A0A0A] py-20 md:py-28">
            <div
              className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full opacity-20"
              style={{
                background: "radial-gradient(circle, #F97316, #7C3AED 60%, transparent 80%)",
              }}
            />
            <div className="relative mx-auto max-w-3xl px-6 text-center">
              <FadeInSection>
                <h2 className="text-[32px] font-semibold tracking-tight text-white md:text-[40px]">
                  Ship your{" "}
                  <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-violet-500 bg-clip-text text-transparent">
                    AI assistant
                  </span>{" "}
                  in minutes
                </h2>
                <p className="mx-auto mt-3 max-w-[480px] text-[14px] text-[#A1A1AA]">
                  No credit card required. Get your first agent live in under 5
                  minutes.
                </p>
                <div className="mt-8">
                  <Link
                    href={ctaHref}
                    className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-lg px-6 text-[14px] font-medium text-white transition-all active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #F97316, #7C3AED)",
                    }}
                  >
                    {ctaLabel}
                    <ArrowRight className="ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </FadeInSection>
            </div>
          </section>
        </div>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-[#E4E4E7] bg-white py-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-7 items-center justify-center rounded-md text-white text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #F97316, #7C3AED)",
                  }}
                >
                  C
                </div>
                <span className="text-[14px] font-semibold text-[#0A0A0A]">
                  Clario
                </span>
                <span className="text-[12px] text-[#A1A1AA] hidden sm:inline">
                  — AI agents trained on your data.
                </span>
              </div>

              <div className="flex items-center gap-3 text-[12px] text-[#A1A1AA]">
                <Link href="#" className="hover:text-[#71717A] transition-colors">Privacy</Link>
                <span className="text-[#E4E4E7]">·</span>
                <Link href="#" className="hover:text-[#71717A] transition-colors">Terms</Link>
                <span className="text-[#E4E4E7]">·</span>
                <Link href="#" className="hover:text-[#71717A] transition-colors">Docs</Link>
                <span className="text-[#E4E4E7]">·</span>
                <Link href="#" className="hover:text-[#71717A] transition-colors">Contact</Link>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[#E4E4E7] pt-6 md:flex-row">
              <p className="text-[11px] text-[#A1A1AA]">
                &copy; {new Date().getFullYear()} Clario. All rights reserved.
              </p>
              <div className="flex items-center gap-3">
                {[Globe, ExternalLink, BarChart3].map((Icon, i) => (
                  <Link
                    key={i}
                    href="#"
                    className="flex size-7 items-center justify-center rounded-md text-[#A1A1AA] transition-colors hover:bg-[#F4F4F5] hover:text-[#0A0A0A]"
                  >
                    <Icon size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
