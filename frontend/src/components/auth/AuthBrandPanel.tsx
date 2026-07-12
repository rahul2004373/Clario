"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Quote {
  text: string;
  author: string;
  handle?: string;
}

const quotes: Quote[] = [
  {
    text: "Clairo transformed how our team handles customer support. The AI agents are eerily good.",
    author: "Sarah Chen",
    handle: "@sarahchen",
  },
  {
    text: "We cut response time by 80% in the first month. Multi-tenant setup was effortless.",
    author: "Marcus Rivera",
    handle: "@marcusrivera",
  },
  {
    text: "Finally, an AI chatbot that understands our business context across all our brands.",
    author: "Priya Patel",
    handle: "@priyapatel",
  },
];

export function AuthBrandPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const quote = quotes[index];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0A0F1A]">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.04]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E3A5F]/20 blur-[120px]" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-12 text-white">
        <div className="flex max-w-[420px] flex-col items-start gap-8">
          <div className="relative">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect width="36" height="36" rx="8" fill="#1E3A5F" />
              <rect x="2" y="2" width="32" height="32" rx="6" fill="#0A0F1A" />
              <text x="10" y="24" fontSize="18" fontWeight="700" fill="white" fontFamily="system-ui">
                C
              </text>
            </svg>
          </div>

          <div className="relative h-[100px] w-full">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-[24px] font-normal leading-[1.4] tracking-tight text-white/85"
              >
                &ldquo;{quote.text}&rdquo;
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[12px] font-medium text-white/60">
              {quote.author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[14px] font-medium text-white/90">{quote.author}</p>
              {quote.handle && (
                <p className="text-[13px] text-white/40">{quote.handle}</p>
              )}
            </div>
          </div>

          <div className="flex gap-1.5">
            {quotes.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-white/70" : "w-1 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-12 right-12">
          <div className="border-t border-white/[0.06] pt-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/25">
                Trusted by engineering teams
              </span>
              <div className="flex items-center gap-5 opacity-25">
                <span className="text-[13px] font-semibold tracking-tight text-white">Acme</span>
                <span className="text-[13px] font-semibold tracking-tight text-white">Orbit</span>
                <span className="text-[13px] font-semibold tracking-tight text-white">Pulse</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
