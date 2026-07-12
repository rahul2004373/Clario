"use client";

import { useRef, useEffect, type ReactNode } from "react";

interface MessageScrollProps {
  children: ReactNode;
  isStreaming: boolean;
}

export function MessageScroll({ children, isStreaming }: MessageScrollProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
      userScrolledUp.current = !isNearBottom;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [children]);

  useEffect(() => {
    if (isStreaming && !userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [isStreaming]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
      {children}
      <div ref={bottomRef} />
    </div>
  );
}
