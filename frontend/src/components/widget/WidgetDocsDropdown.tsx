"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { WIDGET_INTEGRATION_MARKDOWN } from "@/lib/widget-integration-doc";

export function WidgetDocsDropdown() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WIDGET_INTEGRATION_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleViewMarkdown = () => {
    window.open("/docs/widget-integration-md", "_blank", "noopener");
  };

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="icon"
        className="rounded-r-none border-r-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check size={14} className="text-green-600" />
        ) : (
          <Copy size={14} />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={buttonVariants({
            variant: "outline",
            size: "icon",
            className: "rounded-l-none",
          })}
        >
          <ChevronDown size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-lg bg-white p-1 shadow-md ring-1 ring-[#0A0A0A]/10"
        >
          <DropdownMenuItem
            onClick={handleCopy}
            className="flex flex-col items-start gap-0 px-3 py-2"
          >
            <span className="flex items-center gap-2 text-[13px] font-medium text-[#0A0A0A]">
              {copied ? (
                <Check size={14} className="text-green-600" />
              ) : (
                <Copy size={14} />
              )}
              Copy page
            </span>
            <span className="text-[11px] text-[#71717A] leading-tight">
              Copy widget integration guide as Markdown for LLMs
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleViewMarkdown}
            className="flex items-start justify-between px-3 py-2"
          >
            <span className="flex flex-col gap-0">
              <span className="text-[13px] font-medium text-[#0A0A0A]">
                View as Markdown
              </span>
              <span className="text-[11px] text-[#71717A] leading-tight">
                Open full integration guide in a new tab
              </span>
            </span>
            <ExternalLink
              size={14}
              className="mt-0.5 shrink-0 text-[#71717A]"
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
