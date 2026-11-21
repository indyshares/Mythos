import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code } from 'lucide-react';

interface ChatMessageContentProps {
  content: string;
  isUser?: boolean;
  onOpenFile?: (fileIdOrName: string) => void;
}

export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({
  content,
  isUser = false,
  onOpenFile,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  if (!content) return null;

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse inline formatting: bold, italic, strikethrough, inline code, wikilinks, links
  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    // Regex matches inline code, WikiLinks [[...]], Markdown links [...](...), bold/italic, strikethrough, highlight
    const regex = /(`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\)|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+==)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Inline code
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const codeInner = part.slice(1, -1);
        return (
          <code
            key={index}
            className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
              isUser
                ? 'bg-sky-600/60 text-white border border-sky-400/40'
                : 'bg-neutral-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {codeInner}
          </code>
        );
      }

      // WikiLink [[Note]]
      if (part.startsWith('[[') && part.endsWith(']]') && part.length >= 4) {
        const rawInner = part.slice(2, -2);
        const [target, alias] = rawInner.split('|');
        const displayLabel = alias || target;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onOpenFile?.(target.trim())}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] font-semibold transition-colors ${
              isUser
                ? 'bg-white/20 hover:bg-white/30 text-white underline decoration-white/40'
                : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
            }`}
            title={`Open note: ${target}`}
          >
            <span>{displayLabel}</span>
          </button>
        );
      }

      // Markdown Link [Label](URL)
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const labelMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (labelMatch) {
          const label = labelMatch[1];
          const url = labelMatch[2];
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-0.5 font-semibold transition-colors ${
                isUser ? 'text-white underline' : 'text-sky-500 hover:text-sky-600 underline'
              }`}
            >
              <span>{label}</span>
              <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
            </a>
          );
        }
      }

      // Bold Italic ***text***
      if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
        return (
          <strong key={index}>
            <em>{part.slice(3, -3)}</em>
          </strong>
        );
      }

      // Bold **text**
      if (
        (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
      ) {
        return (
          <strong key={index} className="font-extrabold">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic *text*
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
      ) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Strikethrough ~~text~~
      if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
        return (
          <del key={index} className="line-through opacity-80">
            {part.slice(2, -2)}
          </del>
        );
      }

      // Highlight ==text==
      if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
        return (
          <mark key={index} className="bg-amber-300 dark:bg-amber-500/40 text-neutral-900 dark:text-neutral-100 px-1 rounded">
            {part.slice(2, -2)}
          </mark>
        );
      }

      return part;
    });
  };

  // Split content into blocks (code blocks vs text blocks)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: { type: 'code' | 'text'; language?: string; text: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      text: match[2].trimEnd(),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', text: content.slice(lastIndex) });
  }

  let codeBlockCounter = 0;

  return (
    <div className={`space-y-1.5 text-xs leading-relaxed select-text ${isUser ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          const currentCodeIdx = codeBlockCounter++;
          return (
            <div
              key={bIdx}
              className="my-2 rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-950 text-neutral-100 text-xs shadow-md"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
                <span className="flex items-center gap-1.5 uppercase font-bold text-sky-400">
                  <Code className="w-3 h-3" /> {block.language || 'code'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(block.text, currentCodeIdx)}
                  className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  {copiedCodeIndex === currentCodeIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-200 whitespace-pre">
                <code>{block.text}</code>
              </pre>
            </div>
          );
        }

        // Render Text Block line by line / paragraph by paragraph
        const lines = block.text.split('\n');
        const elements: React.ReactNode[] = [];
        let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

        const flushList = (keyPrefix: string) => {
          if (!listBuffer) return;
          const isOl = listBuffer.type === 'ol';
          const ListTag = isOl ? 'ol' : 'ul';
          elements.push(
            <ListTag
              key={`${keyPrefix}-list`}
              className={`my-1.5 space-y-1 pl-5 ${isOl ? 'list-decimal' : 'list-disc'}`}
            >
              {listBuffer.items.map((itemText, iIdx) => (
                <li key={iIdx} className="leading-relaxed">
                  {renderInlineMarkdown(itemText)}
                </li>
              ))}
            </ListTag>
          );
          listBuffer = null;
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();

          // Heading 1 (# H1)
          if (/^#\s+/.test(trimmed)) {
            flushList(`line-${lIdx}`);
            elements.push(
              <h1
                key={lIdx}
                className={`font-display font-extrabold text-base my-2 pb-1 border-b ${
                  isUser
                    ? 'text-white border-white/30'
                    : 'text-neutral-900 dark:text-neutral-50 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
              </h1>
            );
            return;
          }

          // Heading 2 (## H2)
          if (/^##\s+/.test(trimmed)) {
            flushList(`line-${lIdx}`);
            elements.push(
              <h2
                key={lIdx}
                className={`font-display font-bold text-sm my-1.5 ${
                  isUser ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
              </h2>
            );
            return;
          }

          // Heading 3 (### H3)
          if (/^###\s+/.test(trimmed)) {
            flushList(`line-${lIdx}`);
            elements.push(
              <h3
                key={lIdx}
                className={`font-display font-bold text-xs my-1 ${
                  isUser ? 'text-white' : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
              </h3>
            );
            return;
          }

          // Blockquote (> quote)
          if (/^>\s+/.test(trimmed)) {
            flushList(`line-${lIdx}`);
            elements.push(
              <blockquote
                key={lIdx}
                className={`my-1.5 pl-3 py-1 border-l-2 font-serif italic ${
                  isUser
                    ? 'border-white/60 text-white/90 bg-white/10 rounded-r'
                    : 'border-sky-500 bg-sky-500/5 text-neutral-700 dark:text-neutral-300 rounded-r'
                }`}
              >
                {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
              </blockquote>
            );
            return;
          }

          // Horizontal Rule (--- or ***)
          if (/^(---|\*\*\*|___)$/.test(trimmed)) {
            flushList(`line-${lIdx}`);
            elements.push(
              <hr key={lIdx} className="my-3 border-neutral-200 dark:border-neutral-800" />
            );
            return;
          }

          // Bulleted List (- item or * item)
          const bulletMatch = line.match(/^\s*[-*+]\s+(.*)$/);
          if (bulletMatch) {
            if (!listBuffer || listBuffer.type !== 'ul') {
              flushList(`line-${lIdx}`);
              listBuffer = { type: 'ul', items: [] };
            }
            listBuffer.items.push(bulletMatch[1]);
            return;
          }

          // Numbered List (1. item)
          const numberMatch = line.match(/^\s*\d+\.\s+(.*)$/);
          if (numberMatch) {
            if (!listBuffer || listBuffer.type !== 'ol') {
              flushList(`line-${lIdx}`);
              listBuffer = { type: 'ol', items: [] };
            }
            listBuffer.items.push(numberMatch[1]);
            return;
          }

          // Regular paragraph / line
          flushList(`line-${lIdx}`);

          if (!trimmed) {
            elements.push(<div key={lIdx} className="h-1" />);
          } else {
            elements.push(
              <p key={lIdx} className="leading-relaxed my-0.5">
                {renderInlineMarkdown(line)}
              </p>
            );
          }
        });

        flushList(`block-${bIdx}-end`);

        return <div key={bIdx} className="space-y-0.5">{elements}</div>;
      })}
    </div>
  );
};
