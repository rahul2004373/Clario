import React from 'react';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export function FormattedMessage({ content, className }: FormattedMessageProps) {
  // Helper to format inline tags: bold and inline code
  const formatInlineText = (text: string): React.ReactNode[] => {
    // Regex to capture bold (**text** or __text__) and inline code (`code`)
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-current">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('__') && part.endsWith('__')) {
        return (
          <strong key={index} className="font-bold text-current">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800/50 font-mono text-[11px] text-pink-600 dark:text-pink-400 border border-border/40"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = (key: number) => {
    if (currentListItems.length > 0) {
      if (isNumberedList) {
        renderedElements.push(
          <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1 text-inherit">
            {currentListItems}
          </ol>
        );
      } else {
        renderedElements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-inherit">
            {currentListItems}
          </ul>
        );
      }
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 1. Heading 1
    if (trimmed.startsWith('# ')) {
      flushList(index);
      renderedElements.push(
        <h1
          key={index}
          className="text-base font-extrabold text-current mt-4 mb-2 border-b border-border/20 pb-1"
        >
          {formatInlineText(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // 2. Heading 2
    if (trimmed.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h2 key={index} className="text-sm font-bold text-current mt-4 mb-2">
          {formatInlineText(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    // 3. Heading 3
    if (trimmed.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={index} className="text-xs font-bold text-current mt-3 mb-1.5">
          {formatInlineText(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    // 4. Unordered List Items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentListItems.length > 0 && isNumberedList) {
        flushList(index);
      }
      isNumberedList = false;
      currentListItems.push(
        <li key={`li-${index}`} className="text-xs leading-relaxed text-inherit">
          {formatInlineText(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // 5. Ordered List Items
    const matchNumbered = trimmed.match(/^(\d+)\.\s(.*)/);
    if (matchNumbered) {
      if (currentListItems.length > 0 && !isNumberedList) {
        flushList(index);
      }
      isNumberedList = true;
      currentListItems.push(
        <li key={`li-${index}`} className="text-xs leading-relaxed text-inherit">
          {formatInlineText(matchNumbered[2])}
        </li>
      );
      return;
    }

    // 6. Empty Line
    if (trimmed === '') {
      flushList(index);
      renderedElements.push(<div key={`br-${index}`} className="h-2" />);
      return;
    }

    // 7. Normal Text Line
    flushList(index);
    renderedElements.push(
      <p key={index} className="text-xs leading-relaxed text-inherit mb-1.5">
        {formatInlineText(line)}
      </p>
    );
  });

  // Flush any remaining list items at the end
  flushList(lines.length);

  return <div className={className}>{renderedElements}</div>;
}
