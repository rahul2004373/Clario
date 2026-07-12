"use client";

import { memo, useMemo } from "react";

interface AssistantBubbleProps {
  content: string;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4 space-y-1">$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, "</p><p>");

  // Single newlines within paragraphs
  html = html.replace(/\n/g, "<br/>");

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return html;
}

export const AssistantBubble = memo(function AssistantBubble({ content }: AssistantBubbleProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-[#1f1f22] px-4 py-2.5 text-sm leading-relaxed text-[#E4E4E7]">
        <div
          className="prose prose-invert prose-sm max-w-none [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-white [&_p]:m-0 [&_p]:text-[#E4E4E7] [&_br]:content-[''] [&_code]:rounded [&_code]:bg-[#27272A] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:text-[#D4D4D8] [&_pre]:mt-2 [&_pre]:rounded-lg [&_pre]:bg-[#27272A] [&_pre]:p-3 [&_pre]:text-[12px] [&_ul]:my-1 [&_ol]:my-1 [&_li]:text-[#E4E4E7]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
});
