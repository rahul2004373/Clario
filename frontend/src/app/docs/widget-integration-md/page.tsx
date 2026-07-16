import ReactMarkdown from "react-markdown";
import { WIDGET_INTEGRATION_MARKDOWN } from "@/lib/widget-integration-doc";

export default function WidgetIntegrationDocPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <ReactMarkdown
        components={{
          h1: (props) => (
            <h1
              className="mb-4 text-[22px] font-bold text-[#0A0A0A]"
              {...props}
            />
          ),
          h2: (props) => (
            <h2
              className="mb-3 mt-8 text-[18px] font-semibold text-[#0A0A0A]"
              {...props}
            />
          ),
          p: (props) => (
            <p
              className="mb-4 text-[14px] leading-relaxed text-[#0A0A0A]"
              {...props}
            />
          ),
          ul: (props) => (
            <ul
              className="mb-4 list-disc pl-5 text-[14px] text-[#0A0A0A]"
              {...props}
            />
          ),
          li: (props) => <li className="mb-1" {...props} />,
          code: ({ className, children, ...props }) => {
            const isCodeBlock = className?.startsWith("language-");
            if (isCodeBlock) {
              return (
                <pre className="mb-4 overflow-x-auto rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] p-4 text-sm text-[#0A0A0A]">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-[#0A0A0A]">
                {children}
              </code>
            );
          },
          pre: (props) => <>{props.children}</>,
        }}
      >
        {WIDGET_INTEGRATION_MARKDOWN}
      </ReactMarkdown>
    </div>
  );
}
