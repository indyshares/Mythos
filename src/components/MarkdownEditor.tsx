import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link2,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  Sliders,
  Sparkles,
  Code,
  Tag,
  Bookmark,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Command,
  MoreVertical,
  Indent,
  Outdent,
  Highlighter,
  Undo,
  Redo,
  Globe,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { parseMarkdown, serializeMarkdown, calculateStats } from '../utils/markdownParser';
import { InternalLinkPickerModal } from './InternalLinkPickerModal';
import { WebLinkPickerModal } from './WebLinkPickerModal';

interface MarkdownEditorProps {
  onOpenInspector?: () => void;
}

// Convert Markdown body string to Rich Text HTML for direct WYSIWYG editing
function markdownToHtml(mdBody: string): string {
  if (!mdBody) return '<div><br></div>';

  const lines = mdBody.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Block start/end
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        inCodeBlock = false;
        const codeContent = codeBlockBuffer
          .map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
          .join('\n');
        html += `<pre class="my-2.5 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200"><code>${codeContent || ' '}</code></pre>`;
        codeBlockBuffer = [];
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Escape raw HTML entities for safety
    let escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format inline markdown tags: code, bold, italic, strikethrough, internal links, external links
    escaped = escaped
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\[\[(.*?)\]\]/g, (_match, p1) => {
        const parts = p1.split('|');
        const target = parts[0].trim();
        const displayName = parts[1] ? parts[1].trim() : target.split('/').pop()?.replace(/\.md$/, '') || target;
        return `<span class="internal-link inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md cursor-pointer hover:underline text-sky-600 dark:text-sky-400 bg-sky-500/10" data-link="${target}">${displayName}</span>`;
      })
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="underline hover:opacity-80 font-medium" style="color: var(--accent-color);" target="_blank" rel="noopener noreferrer">$1</a>');

    if (line.startsWith('# ')) {
      html += `<h1 class="font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 pt-3 pb-1 border-b border-neutral-200 dark:border-neutral-800 my-2">${escaped.slice(2)}</h1>`;
    } else if (line.startsWith('## ')) {
      html += `<h2 class="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 pt-2 pb-0.5 my-2">${escaped.slice(3)}</h2>`;
    } else if (line.startsWith('### ')) {
      html += `<h3 class="font-display text-base font-semibold text-neutral-900 dark:text-neutral-100 pt-1 my-1">${escaped.slice(4)}</h3>`;
    } else if (line.startsWith('> ') || line.startsWith('&gt; ')) {
      const qContent = line.startsWith('> ') ? escaped.slice(2) : escaped.slice(5);
      html += `<blockquote class="pl-4 py-2 border-l-4 text-neutral-700 dark:text-neutral-300 italic rounded-r-xl my-2" style="border-left-color: var(--accent-color); background-color: var(--accent-subtle);">${qContent}</blockquote>`;
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      const isChecked = line.startsWith('- [x] ');
      const taskContent = escaped.slice(6);
      html += `<div class="flex items-start gap-2 my-1 pl-1" data-task="${isChecked ? 'x' : ' '}">
        <span contenteditable="false" class="select-none mt-0.5">
          <input type="checkbox" ${isChecked ? 'checked' : ''} class="rounded text-sky-500 focus:ring-sky-400 cursor-pointer" />
        </span>
        <span class="${isChecked ? 'line-through text-neutral-400' : ''}">${taskContent}</span>
      </div>`;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      html += `<div class="flex items-start gap-2 my-1 pl-3"><span class="font-bold select-none" style="color: var(--accent-color);">•</span><span>${escaped.slice(2)}</span></div>`;
    } else if (/^\d+\.\s/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      const num = numMatch ? numMatch[1] : '1';
      const itemContent = escaped.replace(/^\d+\.\s/, '');
      html += `<div class="flex items-start gap-2 my-1 pl-3"><span class="font-semibold text-neutral-500 select-none tabular-nums">${num}.</span><span>${itemContent}</span></div>`;
    } else if (!line.trim()) {
      html += '<div><br></div>';
    } else {
      html += `<p class="my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200">${escaped}</p>`;
    }
  }

  // Close open code block if any
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    const codeContent = codeBlockBuffer.join('\n');
    html += `<pre class="my-2.5 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200"><code>${codeContent}</code></pre>`;
  }

  return html || '<div><br></div>';
}

// Convert Rich Text HTML DOM structure back to Markdown string
function htmlToMarkdown(element: HTMLElement): string {
  const lines: string[] = [];

  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Internal Link Span
      if (el.classList.contains('internal-link')) {
        const target = el.getAttribute('data-link') || el.textContent?.trim() || '';
        const display = el.textContent?.trim() || '';
        const cleanTarget = target.replace(/^\[\[/, '').replace(/\]\]$/, '');
        const cleanDisplay = display.replace(/^\[\[/, '').replace(/\]\]$/, '');
        if (cleanTarget && cleanDisplay && cleanTarget !== cleanDisplay && cleanTarget !== cleanDisplay.split('/').pop()?.replace(/\.md$/, '')) {
          return `[[${cleanTarget}|${cleanDisplay}]]`;
        }
        return `[[${cleanTarget || cleanDisplay}]]`;
      }

      // External Anchor Link
      if (tagName === 'a') {
        const href = el.getAttribute('href') || '#';
        const text = Array.from(el.childNodes).map(processNode).join('');
        return `[${text}](${href})`;
      }

      // Preformatted Code Block
      if (tagName === 'pre') {
        const codeEl = el.querySelector('code');
        const codeText = codeEl ? codeEl.textContent : el.textContent;
        return `\`\`\`\n${codeText || ''}\n\`\`\`\n`;
      }

      // Inline Code
      if (tagName === 'code') {
        return `\`${el.textContent || ''}\``;
      }

      const childText = Array.from(el.childNodes).map(processNode).join('');

      if (tagName === 'h1') return `# ${childText.trim().replace(/^#[\s\u00A0]*/, '')}\n`;
      if (tagName === 'h2') return `## ${childText.trim().replace(/^##[\s\u00A0]*/, '')}\n`;
      if (tagName === 'h3') return `### ${childText.trim().replace(/^###[\s\u00A0]*/, '')}\n`;
      if (tagName === 'h4') return `#### ${childText.trim().replace(/^####[\s\u00A0]*/, '')}\n`;
      if (tagName === 'blockquote') return `> ${childText.trim().replace(/^>[\s\u00A0]*/, '')}\n`;
      if (tagName === 'strong' || tagName === 'b') return `**${childText}**`;
      if (tagName === 'em' || tagName === 'i') return `*${childText}*`;
      if (tagName === 'del' || tagName === 's' || tagName === 'strike') return `~~${childText}~~`;

      if (el.getAttribute('data-task')) {
        const isChecked = el.getAttribute('data-task') === 'x' || !!el.querySelector('input[type="checkbox"]:checked');
        const textSpan = el.querySelector('span:last-child') || el;
        const taskText = Array.from(textSpan.childNodes).map(processNode).join('').trim();
        return `- [${isChecked ? 'x' : ' '}] ${taskText}\n`;
      }

      if (tagName === 'p' || tagName === 'div') {
        const trimmed = childText.trim();
        return trimmed ? `${trimmed}\n` : '\n';
      }

      if (tagName === 'li') return `- ${childText.trim().replace(/^([-*]|\d+\.)[\s\u00A0]*/, '')}\n`;
      if (tagName === 'ul' || tagName === 'ol') return `${childText}\n`;
      if (tagName === 'br') return '\n';

      return childText;
    }
    return '';
  };

  Array.from(element.childNodes).forEach((child) => {
    const res = processNode(child);
    if (res) lines.push(res);
  });

  return lines
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ onOpenInspector }) => {
  const {
    activeFile,
    updateFileContent,
    renameFile,
    saveState,
    navigateInternalLink,
    saveFileAsTemplate,
    files,
    activeWorkspace,
  } = useWorkspace();

  const [content, setContent] = useState('');
  const [isFrontmatterExpanded, setIsFrontmatterExpanded] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showWebLinkModal, setShowWebLinkModal] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isRawSourceMode, setIsRawSourceMode] = useState(false);

  // Save as Template Modal
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('General');
  const [templateDesc, setTemplateDesc] = useState('');

  // Link Preview Tooltip Popover UI state (WikiLink / WebLink hover & long-press)
  interface LinkTooltipState {
    type: 'wikilink' | 'weblink';
    target: string;
    display: string;
    x: number;
    y: number;
    element?: HTMLElement;
  }
  const [linkTooltip, setLinkTooltip] = useState<LinkTooltipState | null>(null);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [editTooltipTarget, setEditTooltipTarget] = useState('');
  const [editTooltipDisplay, setEditTooltipDisplay] = useState('');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openLinkTooltip = (
    type: 'wikilink' | 'weblink',
    target: string,
    display: string,
    rect: DOMRect,
    element: HTMLElement
  ) => {
    setLinkTooltip({
      type,
      target,
      display,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      element,
    });
    setIsEditingTooltip(false);
    setEditTooltipTarget(target);
    setEditTooltipDisplay(display);
  };

  const handleSaveInlineLinkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTooltip || !linkTooltip.element) return;

    const elem = linkTooltip.element;
    const cleanTarget = editTooltipTarget.trim();
    const cleanDisplay = editTooltipDisplay.trim() || cleanTarget;

    if (!cleanTarget) return;

    if (linkTooltip.type === 'wikilink') {
      elem.setAttribute('data-link', cleanTarget);
      elem.textContent = cleanDisplay;
    } else {
      elem.setAttribute('href', cleanTarget);
      elem.textContent = cleanDisplay;
    }

    syncRichTextToMarkdown();
    setLinkTooltip(null);
    setIsEditingTooltip(false);
  };

  // Mobile More Tools Dropdown Menu (3 vertical dots)
  const [showMoreMobileMenu, setShowMoreMobileMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const richEditorRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false);

  // Exact Range and Selection position refs for WebLink and WikiLink modal insertions
  const savedRangeRef = useRef<Range | null>(null);
  const rawSelectionStartRef = useRef<number | null>(null);
  const rawSelectionEndRef = useRef<number | null>(null);

  // Capture current cursor position / selection before opening link picker modals
  const saveCurrentSelection = () => {
    if (isRawSourceMode) {
      const textarea = textareaRef.current;
      if (textarea) {
        rawSelectionStartRef.current = textarea.selectionStart;
        rawSelectionEndRef.current = textarea.selectionEnd;
        const selText = content.substring(textarea.selectionStart, textarea.selectionEnd).trim();
        setSelectedTextForLink(selText);
      }
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && richEditorRef.current?.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        const selText = sel.toString().trim();
        setSelectedTextForLink(selText);
      } else {
        savedRangeRef.current = null;
        setSelectedTextForLink('');
      }
    }
  };

  // Parse current markdown file content
  const parsed = useMemo(() => {
    return parseMarkdown(content);
  }, [content]);

  const stats = useMemo(() => {
    return calculateStats(content);
  }, [content]);

  // Inline Title Editing state & ref
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastActiveBlockRef = useRef<HTMLElement | null>(null);

  const displayTitle = (parsed.frontmatter.title as string) || (activeFile ? activeFile.name.replace(/\.md$/, '') : '');

  // Keep inline title state in sync when not editing
  useEffect(() => {
    if (!isEditingTitle) {
      setInlineTitle(displayTitle);
    }
  }, [displayTitle, isEditingTitle]);

  // Focus and select input text when inline editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Sync content with active file
  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content || '');
      // When switching active file or initial mount, sync HTML to rich text editor
      if (richEditorRef.current && !isInternalUpdateRef.current) {
        const parsedFile = parseMarkdown(activeFile.content || '');
        richEditorRef.current.innerHTML = markdownToHtml(parsedFile.body);
      }
      isInternalUpdateRef.current = false;
    }
  }, [activeFile?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setLinkTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 bg-white dark:bg-neutral-900 select-none">
        <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3 stroke-[1.5]" />
        <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          No Note Selected
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mb-4">
          Select a note from the file explorer, create a new one, or press{' '}
          <kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-[10px]">
            Ctrl+O
          </kbd>{' '}
          to quick switch.
        </p>
      </div>
    );
  }

  // Handle content update from any source
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateFileContent(activeFile.id, newContent);
  };

  const handleSaveInlineTitle = (newVal?: string) => {
    if (!activeFile) return;
    const cleanTitle = (newVal !== undefined ? newVal : inlineTitle).trim();
    if (!cleanTitle) {
      setInlineTitle(displayTitle);
      setIsEditingTitle(false);
      return;
    }

    if (cleanTitle !== displayTitle) {
      // 1. Update frontmatter title
      const updatedFm = { ...parsed.frontmatter, title: cleanTitle };
      const newContent = serializeMarkdown(updatedFm, parsed.body);
      handleContentChange(newContent);

      // 2. Also rename file in workspace if it differs from current file name
      if (cleanTitle !== activeFile.name.replace(/\.md$/, '')) {
        renameFile(activeFile.id, cleanTitle);
      }
    }
    setIsEditingTitle(false);
  };

  // Sync Rich Text contentEditable DOM changes to Markdown
  const syncRichTextToMarkdown = () => {
    if (!richEditorRef.current) return;
    const markdownBody = htmlToMarkdown(richEditorRef.current);
    const fullMarkdown = serializeMarkdown(parsed.frontmatter, markdownBody);
    isInternalUpdateRef.current = true;
    handleContentChange(fullMarkdown);
  };

  // Toggle between Rich WYSIWYG and Raw Markdown Source mode
  const toggleSourceMode = () => {
    if (!isRawSourceMode) {
      // Switching from Rich to Raw Source
      if (richEditorRef.current) {
        const markdownBody = htmlToMarkdown(richEditorRef.current);
        const fullMarkdown = serializeMarkdown(parsed.frontmatter, markdownBody);
        setContent(fullMarkdown);
        updateFileContent(activeFile.id, fullMarkdown);
      }
      setIsRawSourceMode(true);
    } else {
      // Switching from Raw Source to Rich Text
      setIsRawSourceMode(false);
      setTimeout(() => {
        if (richEditorRef.current) {
          const parsedFile = parseMarkdown(content);
          richEditorRef.current.innerHTML = markdownToHtml(parsedFile.body);
        }
      }, 10);
    }
  };

  // Replace text range in DOM node with HTML
  const replaceTextWithHtml = (textNode: Node, startOffset: number, endOffset: number, html: string) => {
    try {
      const range = document.createRange();
      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset);
      range.deleteContents();

      const temp = document.createElement('div');
      temp.innerHTML = html;
      const frag = document.createDocumentFragment();
      let lastChild: Node | null = null;
      while (temp.firstChild) {
        lastChild = frag.appendChild(temp.firstChild);
      }
      range.insertNode(frag);

      if (lastChild) {
        const nextRange = document.createRange();
        nextRange.setStartAfter(lastChild);
        nextRange.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(nextRange);
        }
      }
      syncRichTextToMarkdown();
    } catch (err) {
      console.error('Markdown auto-format error:', err);
    }
  };

  // Format inline markdown in a block element (*italic*, **bold**, ***bold italic***, ~~del~~, `code`, ==highlight==, [[Link]], [link](url))
  const formatInlineMarkdownInBlock = (block: HTMLElement): boolean => {
    if (!block || !richEditorRef.current?.contains(block)) return false;
    const tagName = block.tagName.toLowerCase();
    if (tagName === 'pre' || tagName === 'code') return false;

    let modified = false;

    // Use TreeWalker to inspect all text nodes inside block safely without corrupting existing elements/attributes
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const p = node.parentElement;
        const pTag = p?.tagName.toLowerCase();
        if (pTag === 'code' || pTag === 'pre') return NodeFilter.FILTER_REJECT;
        if (p?.closest('.internal-link')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Node[] = [];
    let cur = walker.nextNode();
    while (cur) {
      textNodes.push(cur);
      cur = walker.nextNode();
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      if (!text) continue;

      const hasSyntax =
        /\*\*\*[^\*\n]+?\*\*\*/.test(text) ||
        /\*\*[^\*\n]+?\*\*/.test(text) ||
        /(?<!\*)\*[^\*\n]+?\*(?!\*)/.test(text) ||
        /~~[^~\n]+?~~/.test(text) ||
        /`[^`\n]+?`/.test(text) ||
        /==[^=\n]+?==/.test(text) ||
        /\[\[[^\]\n]+?\]\]/.test(text) ||
        /\[[^\]\n]+?\]\(https?:\/\/[^\)\s]+\)/.test(text);

      if (!hasSyntax) continue;

      let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // 1. Bold Italic: ***text***
      formatted = formatted.replace(
        /\*\*\*([^\*\n]+?)\*\*\*/g,
        '<strong><em>$1</em></strong>'
      );
      // 2. Bold: **text**
      formatted = formatted.replace(
        /\*\*([^\*\n]+?)\*\*/g,
        '<strong>$1</strong>'
      );
      // 3. Italic: *text* (no space required before or after, works with Thai/English)
      formatted = formatted.replace(
        /(?<!\*)\*([^\*\n]+?)\*(?!\*)/g,
        '<em>$1</em>'
      );
      // 4. Strikethrough: ~~text~~
      formatted = formatted.replace(
        /~~([^~\n]+?)~~/g,
        '<del>$1</del>'
      );
      // 5. Inline Code: `code`
      formatted = formatted.replace(
        /`([^`\n]+?)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">$1</code>'
      );
      // 6. Highlight: ==text==
      formatted = formatted.replace(
        /==([^=\n]+?)==/g,
        '<mark class="px-1 py-0.5 rounded bg-amber-200/60 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-medium">$1</mark>'
      );
      // 7. WikiLink: [[Target]] or [[Target|Display]]
      formatted = formatted.replace(
        /\[\[([^\]\n]+?)\]\]/g,
        (_match, rawTarget) => {
          const parts = rawTarget.split('|');
          const target = parts[0].trim();
          const displayName = parts[1] ? parts[1].trim() : target.split('/').pop()?.replace(/\.md$/, '') || target;
          return `<span class="internal-link inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md cursor-pointer hover:underline text-sky-600 dark:text-sky-400 bg-sky-500/10" data-link="${target}">${displayName}</span>`;
        }
      );
      // 8. External Link: [Label](url)
      formatted = formatted.replace(
        /\[([^\]\n]+?)\]\((https?:\/\/[^\)\s]+)\)/g,
        '<a href="$2" class="underline hover:opacity-80 font-medium text-sky-600 dark:text-sky-400" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      try {
        const range = document.createRange();
        range.selectNode(textNode);
        const fragment = range.createContextualFragment(formatted);
        textNode.parentNode?.replaceChild(fragment, textNode);
        modified = true;
      } catch (e) {
        const span = document.createElement('span');
        span.innerHTML = formatted;
        textNode.parentNode?.replaceChild(span, textNode);
        modified = true;
      }
    }

    return modified;
  };

  // Clean up syntax prefix in an inactive block when cursor leaves it
  const cleanupInactiveBlock = (block: HTMLElement) => {
    if (!block || !richEditorRef.current?.contains(block)) return;

    const text = block.textContent || '';
    const tagName = block.tagName.toLowerCase();

    // 1. Strip block syntax prefixes when cursor leaves the block
    if (tagName === 'h1' && /^#[\s\u00A0]+/.test(text)) {
      block.textContent = text.replace(/^#[\s\u00A0]+/, '');
    } else if (tagName === 'h2' && /^##[\s\u00A0]+/.test(text)) {
      block.textContent = text.replace(/^##[\s\u00A0]+/, '');
    } else if (tagName === 'h3' && /^###[\s\u00A0]+/.test(text)) {
      block.textContent = text.replace(/^###[\s\u00A0]+/, '');
    } else if (tagName === 'h4' && /^####[\s\u00A0]+/.test(text)) {
      block.textContent = text.replace(/^####[\s\u00A0]+/, '');
    } else if (tagName === 'blockquote' && /^>[\s\u00A0]+/.test(text)) {
      block.textContent = text.replace(/^>[\s\u00A0]+/, '');
    } else if (tagName === 'li' && /^([-*]|\d+\.)[\s\u00A0]+/.test(text)) {
      block.textContent = text.replace(/^([-*]|\d+\.)[\s\u00A0]+/, '');
    } else if (tagName === 'p' || tagName === 'div') {
      // If a standard paragraph was typed with prefix but not yet formatted:
      if (/^#[\s\u00A0]+/.test(text)) {
        const h1 = document.createElement('h1');
        h1.className = 'font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 pt-3 pb-1 border-b border-neutral-200 dark:border-neutral-800 my-2';
        h1.textContent = text.replace(/^#[\s\u00A0]+/, '');
        block.replaceWith(h1);
      } else if (/^##[\s\u00A0]+/.test(text)) {
        const h2 = document.createElement('h2');
        h2.className = 'font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 pt-2 pb-0.5 my-2';
        h2.textContent = text.replace(/^##[\s\u00A0]+/, '');
        block.replaceWith(h2);
      } else if (/^###[\s\u00A0]+/.test(text)) {
        const h3 = document.createElement('h3');
        h3.className = 'font-display text-base font-semibold text-neutral-900 dark:text-neutral-100 pt-1 my-1';
        h3.textContent = text.replace(/^###[\s\u00A0]+/, '');
        block.replaceWith(h3);
      } else if (/^####[\s\u00A0]+/.test(text)) {
        const h4 = document.createElement('h4');
        h4.className = 'font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100 pt-1 my-1';
        h4.textContent = text.replace(/^####[\s\u00A0]+/, '');
        block.replaceWith(h4);
      } else if (/^>[\s\u00A0]+/.test(text)) {
        const bq = document.createElement('blockquote');
        bq.className = 'pl-4 py-2 border-l-4 text-neutral-700 dark:text-neutral-300 italic rounded-r-xl my-2 border-sky-500 bg-sky-500/10';
        bq.textContent = text.replace(/^>[\s\u00A0]+/, '');
        block.replaceWith(bq);
      }
    }

    // 2. Format all inline markdown in the inactive block (no space required!)
    formatInlineMarkdownInBlock(block);
  };

  // Detect when user moves cursor/selection to another block or line
  const checkActiveBlockChange = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !richEditorRef.current?.contains(sel.anchorNode)) {
      if (lastActiveBlockRef.current) {
        cleanupInactiveBlock(lastActiveBlockRef.current);
        lastActiveBlockRef.current = null;
        syncRichTextToMarkdown();
      }
      return;
    }

    const el =
      sel.anchorNode.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel.anchorNode.parentElement;
    const currentBlock = el?.closest('h1, h2, h3, h4, blockquote, p, div, li') as HTMLElement | null;

    if (currentBlock && currentBlock !== lastActiveBlockRef.current) {
      if (lastActiveBlockRef.current) {
        cleanupInactiveBlock(lastActiveBlockRef.current);
        syncRichTextToMarkdown();
      }
      lastActiveBlockRef.current = currentBlock;
    }
  };

  // Insert formatting into raw source textarea
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 10);
  };

  // Apply Rich Text formatting command (MS Word / Notion style)
  const applyRichFormat = (command: string, value: string | undefined = undefined) => {
    if (isRawSourceMode) {
      if (command === 'bold') insertFormatting('**', '**');
      else if (command === 'italic') insertFormatting('*', '*');
      else if (command === 'strikeThrough') insertFormatting('~~', '~~');
      else if (command === 'h1' || value === '<h1>') insertFormatting('# ');
      else if (command === 'h2' || value === '<h2>') insertFormatting('## ');
      else if (command === 'h3' || value === '<h3>') insertFormatting('### ');
      else if (command === 'insertUnorderedList') insertFormatting('- ');
      else if (command === 'insertOrderedList') insertFormatting('1. ');
      else if (command === 'blockquote' || value === '<blockquote>') insertFormatting('> ');
      return;
    }

    if (richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand(command, false, value);
      syncRichTextToMarkdown();
    }
  };

  // Handle Tab / Indent (Keyboard Tab or Mobile Tool)
  const handleIndent = () => {
    if (isRawSourceMode) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newContent = val.substring(0, start) + '    ' + val.substring(end);
      handleContentChange(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 4, start + 4);
      }, 0);
      return;
    }

    if (richEditorRef.current) {
      richEditorRef.current.focus();
      const sel = window.getSelection();
      const isList =
        sel?.anchorNode &&
        (sel.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode.parentElement
        )?.closest('li');

      if (isList) {
        document.execCommand('indent', false);
      } else {
        // Insert 4 non-breaking spaces for tab spacing in rich editor
        document.execCommand('insertText', false, '\u00A0\u00A0\u00A0\u00A0');
      }
      syncRichTextToMarkdown();
    }
  };

  // Handle Shift+Tab / Outdent
  const handleOutdent = () => {
    if (isRawSourceMode) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const before = val.substring(0, start);
      const spaceMatch = before.match(/( {1,4})$/);
      if (spaceMatch) {
        const removeCount = spaceMatch[1].length;
        const newContent = before.substring(0, start - removeCount) + val.substring(start);
        handleContentChange(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start - removeCount, start - removeCount);
        }, 0);
      }
      return;
    }

    if (richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand('outdent', false);
      syncRichTextToMarkdown();
    }
  };

  // Handle Undo / Redo
  const handleUndo = () => {
    if (isRawSourceMode) {
      if (textareaRef.current) {
        textareaRef.current.focus();
        document.execCommand('undo');
      }
    } else {
      if (richEditorRef.current) {
        richEditorRef.current.focus();
        document.execCommand('undo');
        syncRichTextToMarkdown();
      }
    }
  };

  const handleRedo = () => {
    if (isRawSourceMode) {
      if (textareaRef.current) {
        textareaRef.current.focus();
        document.execCommand('redo');
      }
    } else {
      if (richEditorRef.current) {
        richEditorRef.current.focus();
        document.execCommand('redo');
        syncRichTextToMarkdown();
      }
    }
  };

  // Insert Task Checkbox tool
  const handleInsertTaskCheckbox = () => {
    if (isRawSourceMode) {
      insertFormatting('- [ ] ');
      return;
    }
    if (richEditorRef.current) {
      richEditorRef.current.focus();
      const taskHtml = `<div class="flex items-start gap-2 my-1 pl-1" data-task=" "><span contenteditable="false" class="select-none mt-0.5"><input type="checkbox" class="rounded text-sky-500 focus:ring-sky-400 cursor-pointer" /></span><span>&nbsp;</span></div>`;
      document.execCommand('insertHTML', false, taskHtml);
      syncRichTextToMarkdown();
    }
  };

  // Insert Inline Code tool
  const handleInsertInlineCode = () => {
    if (isRawSourceMode) {
      insertFormatting('`', '`');
      return;
    }
    const sel = window.getSelection();
    const selectedText = sel?.toString() || 'code';
    const codeHtml = `<code class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">${selectedText}</code>`;
    if (richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand('insertHTML', false, codeHtml);
      syncRichTextToMarkdown();
    }
  };

  // Insert Highlight tool
  const handleInsertHighlight = () => {
    if (isRawSourceMode) {
      insertFormatting('==', '==');
      return;
    }
    const sel = window.getSelection();
    const selectedText = sel?.toString() || 'highlight';
    const markHtml = `<mark class="px-1 py-0.5 rounded bg-amber-200/60 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-medium">${selectedText}</mark>`;
    if (richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand('insertHTML', false, markHtml);
      syncRichTextToMarkdown();
    }
  };

  // Insert External Web Link tool (opens modal for URL + Custom Title / selection)
  const handleInsertWebLink = () => {
    saveCurrentSelection();
    setShowWebLinkModal(true);
  };

  const handleSelectWebLink = (url: string, label: string) => {
    const replacement = `[${label}](${url})`;

    if (isRawSourceMode) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = rawSelectionStartRef.current ?? textarea.selectionStart;
      const end = rawSelectionEndRef.current ?? textarea.selectionEnd;
      const newContent = content.substring(0, start) + replacement + content.substring(end);
      handleContentChange(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }, 10);
      return;
    }

    const aHtml = `<a href="${url}" class="underline hover:opacity-80 font-medium text-sky-600 dark:text-sky-400" target="_blank" rel="noopener noreferrer">${label}</a>&nbsp;`;

    if (richEditorRef.current) {
      richEditorRef.current.focus();
      const sel = window.getSelection();
      if (sel && savedRangeRef.current) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        } catch (err) {
          console.warn('Failed to restore range for WebLink:', err);
        }
      }
      document.execCommand('insertHTML', false, aHtml);
      syncRichTextToMarkdown();
    }
  };

  // Handle Rich Editor KeyDown (Markdown block syntax triggers & Shortcuts)
  const handleRichEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 0. Tab key: Indent / Outdent
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        handleOutdent();
      } else {
        handleIndent();
      }
      return;
    }

    // 1. Keyboard shortcuts (Ctrl/Cmd)
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyRichFormat('bold');
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyRichFormat('italic');
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        applyRichFormat('underline');
        return;
      }
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleInsertLink();
        return;
      }
      if (e.key === 'm' || e.key === 'M' || e.key === '/') {
        e.preventDefault();
        toggleSourceMode();
        return;
      }
    }

    // 2. Backspace key: Convert formatted block back to normal paragraph if backspacing prefix
    if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel && sel.isCollapsed && sel.anchorNode) {
        const textNode = sel.anchorNode;
        const text = textNode.textContent || '';
        const offset = sel.anchorOffset;
        const currentBlock = (
          textNode.nodeType === Node.ELEMENT_NODE ? (textNode as HTMLElement) : textNode.parentElement
        )?.closest('h1, h2, h3, h4, blockquote');

        if (currentBlock && richEditorRef.current?.contains(currentBlock)) {
          const match = text.match(/^(#{1,4}|>|[-*]|1\.)[\s\u00A0]/);
          if (match && offset <= match[0].length) {
            e.preventDefault();
            const p = document.createElement('p');
            p.className = 'my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200';
            p.textContent = text.slice(match[0].length) || '';
            if (!p.textContent) p.innerHTML = '<br>';
            currentBlock.replaceWith(p);
            lastActiveBlockRef.current = p;

            const range = document.createRange();
            range.setStart(p.firstChild || p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }
        }
      }
    }

    // 3. Space key: Trigger Block Level Markdown Syntax (#, ##, ###, >, -, *, 1., - [ ])
    // PRESERVES the syntax prefix with a visible space so user can keep typing, while instantly applying H1/H2/Quote styling!
    if (e.key === ' ') {
      const sel = window.getSelection();
      if (!sel || !sel.isCollapsed || !sel.anchorNode) return;

      const textNode = sel.anchorNode;
      if (textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent || '';
        const offset = sel.anchorOffset;
        const textBeforeCursor = text.slice(0, offset);
        const currentBlock = textNode.parentElement?.closest(
          'h1, h2, h3, h4, blockquote, p, div, li'
        ) as HTMLElement | null;

        if (currentBlock && richEditorRef.current?.contains(currentBlock)) {
          // Heading 1: '# '
          if (textBeforeCursor === '#') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const h1 = document.createElement('h1');
            h1.className =
              'font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 pt-3 pb-1 border-b border-neutral-200 dark:border-neutral-800 my-2';
            const newTextNode = document.createTextNode('#\u00A0' + remaining);
            h1.appendChild(newTextNode);
            currentBlock.replaceWith(h1);
            lastActiveBlockRef.current = h1;

            const range = document.createRange();
            range.setStart(newTextNode, 2); // Caret right after '# '
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Heading 2: '## '
          if (textBeforeCursor === '##') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const h2 = document.createElement('h2');
            h2.className =
              'font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 pt-2 pb-0.5 my-2';
            const newTextNode = document.createTextNode('##\u00A0' + remaining);
            h2.appendChild(newTextNode);
            currentBlock.replaceWith(h2);
            lastActiveBlockRef.current = h2;

            const range = document.createRange();
            range.setStart(newTextNode, 3); // Caret right after '## '
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Heading 3: '### '
          if (textBeforeCursor === '###') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const h3 = document.createElement('h3');
            h3.className =
              'font-display text-base font-semibold text-neutral-900 dark:text-neutral-100 pt-1 my-1';
            const newTextNode = document.createTextNode('###\u00A0' + remaining);
            h3.appendChild(newTextNode);
            currentBlock.replaceWith(h3);
            lastActiveBlockRef.current = h3;

            const range = document.createRange();
            range.setStart(newTextNode, 4); // Caret right after '### '
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Heading 4: '#### '
          if (textBeforeCursor === '####') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const h4 = document.createElement('h4');
            h4.className =
              'font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100 pt-1 my-1';
            const newTextNode = document.createTextNode('####\u00A0' + remaining);
            h4.appendChild(newTextNode);
            currentBlock.replaceWith(h4);
            lastActiveBlockRef.current = h4;

            const range = document.createRange();
            range.setStart(newTextNode, 5); // Caret right after '#### '
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Blockquote: '> '
          if (textBeforeCursor === '>') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const bq = document.createElement('blockquote');
            bq.className =
              'pl-4 py-2 border-l-4 text-neutral-700 dark:text-neutral-300 italic rounded-r-xl my-2 border-sky-500 bg-sky-500/10';
            const newTextNode = document.createTextNode('>\u00A0' + remaining);
            bq.appendChild(newTextNode);
            currentBlock.replaceWith(bq);
            lastActiveBlockRef.current = bq;

            const range = document.createRange();
            range.setStart(newTextNode, 2);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Bullet List: '- ' or '* '
          if (textBeforeCursor === '-' || textBeforeCursor === '*') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const ul = document.createElement('ul');
            ul.className = 'list-disc pl-5 my-1.5 space-y-1';
            const li = document.createElement('li');
            const newTextNode = document.createTextNode('-\u00A0' + remaining);
            li.appendChild(newTextNode);
            ul.appendChild(li);
            currentBlock.replaceWith(ul);
            lastActiveBlockRef.current = li;

            const range = document.createRange();
            range.setStart(newTextNode, 2);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Numbered list: '1. '
          if (textBeforeCursor === '1.') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const ol = document.createElement('ol');
            ol.className = 'list-decimal pl-5 my-1.5 space-y-1';
            const li = document.createElement('li');
            const newTextNode = document.createTextNode('1.\u00A0' + remaining);
            li.appendChild(newTextNode);
            ol.appendChild(li);
            currentBlock.replaceWith(ol);
            lastActiveBlockRef.current = li;

            const range = document.createRange();
            range.setStart(newTextNode, 3);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            syncRichTextToMarkdown();
            return;
          }

          // Task checkbox: '- [ ] ' or '[] ' or '[ ] '
          if (
            textBeforeCursor === '- [ ]' ||
            textBeforeCursor === '[]' ||
            textBeforeCursor === '[ ]'
          ) {
            e.preventDefault();
            const remaining = text.slice(offset);
            const taskDiv = document.createElement('div');
            taskDiv.className = 'flex items-start gap-2 my-1 pl-1';
            taskDiv.setAttribute('data-task', ' ');
            taskDiv.innerHTML = `<span contenteditable="false" class="select-none mt-0.5"><input type="checkbox" class="rounded text-sky-500 focus:ring-sky-400 cursor-pointer" /></span><span>${
              remaining ? remaining.trim() : '<br>'
            }</span>`;
            currentBlock.replaceWith(taskDiv);
            lastActiveBlockRef.current = taskDiv;

            const textSpan = taskDiv.querySelector('span:last-child');
            if (textSpan) {
              const range = document.createRange();
              range.setStart(textSpan.firstChild || textSpan, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            syncRichTextToMarkdown();
            return;
          }

          // Code block: '```'
          if (textBeforeCursor === '```') {
            e.preventDefault();
            const remaining = text.slice(offset);
            const codeBlockHtml = `<pre class="my-2.5 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200"><code>${
              remaining || ' '
            }</code></pre>`;
            document.execCommand('insertHTML', false, codeBlockHtml);
            syncRichTextToMarkdown();
            return;
          }
        }
      }
    }

    // 4. Enter key: Collapses/cleans the syntax prefix and starts a new line below!
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        const el =
          sel.anchorNode.nodeType === Node.ELEMENT_NODE
            ? (sel.anchorNode as HTMLElement)
            : sel.anchorNode.parentElement;
        const currentBlock = el?.closest('h1, h2, h3, h4, blockquote, p, div, li') as HTMLElement | null;

        if (currentBlock && richEditorRef.current?.contains(currentBlock)) {
          const text = currentBlock.textContent || '';
          const headingMatch = text.match(/^(#{1,4})[\s\u00A0]+(.*)$/);
          const quoteMatch = text.match(/^>[\s\u00A0]+(.*)$/);
          const bulletMatch = text.match(/^[-*][\s\u00A0]+(.*)$/);
          const orderedMatch = text.match(/^(\d+\.)[\s\u00A0]+(.*)$/);
          const isTask = currentBlock.getAttribute('data-task') !== null;
          const tagName = currentBlock.tagName.toLowerCase();

          // Headings: Strip '# ', '## ', '### ', '#### ' on Enter and jump to next paragraph
          if (headingMatch || tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
            e.preventDefault();
            const cleanContent = text.replace(/^(#{1,4})[\s\u00A0]+/, '').trim();
            if (cleanContent) {
              currentBlock.textContent = cleanContent;
              formatInlineMarkdownInBlock(currentBlock);
            } else {
              currentBlock.innerHTML = '<br>';
            }

            const nextP = document.createElement('p');
            nextP.className = 'my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200';
            nextP.innerHTML = '<br>';
            currentBlock.after(nextP);
            lastActiveBlockRef.current = nextP;

            const range = document.createRange();
            range.setStart(nextP, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            syncRichTextToMarkdown();
            return;
          }

          // Blockquote: Strip '> ' on Enter
          if (quoteMatch || tagName === 'blockquote') {
            e.preventDefault();
            const cleanContent = text.replace(/^>[\s\u00A0]+/, '').trim();
            if (cleanContent) {
              currentBlock.textContent = cleanContent;
              formatInlineMarkdownInBlock(currentBlock);
              const nextP = document.createElement('p');
              nextP.className = 'my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200';
              nextP.innerHTML = '<br>';
              currentBlock.after(nextP);
              lastActiveBlockRef.current = nextP;

              const range = document.createRange();
              range.setStart(nextP, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            } else {
              currentBlock.outerHTML = '<p class="my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200"><br></p>';
            }
            syncRichTextToMarkdown();
            return;
          }

          // Bullet List: Strip prefix and create next list item
          if (bulletMatch) {
            e.preventDefault();
            const cleanContent = bulletMatch[1].trim();
            const ul = document.createElement('ul');
            ul.className = 'list-disc pl-5 my-1.5 space-y-1';
            const li = document.createElement('li');
            li.textContent = cleanContent;
            formatInlineMarkdownInBlock(li);
            ul.appendChild(li);

            const nextLi = document.createElement('li');
            nextLi.innerHTML = '<br>';
            ul.appendChild(nextLi);
            currentBlock.replaceWith(ul);
            lastActiveBlockRef.current = nextLi;

            const range = document.createRange();
            range.setStart(nextLi, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            syncRichTextToMarkdown();
            return;
          }

          // Numbered List: Strip prefix and create next list item
          if (orderedMatch) {
            e.preventDefault();
            const cleanContent = orderedMatch[2].trim();
            const ol = document.createElement('ol');
            ol.className = 'list-decimal pl-5 my-1.5 space-y-1';
            const li = document.createElement('li');
            li.textContent = cleanContent;
            formatInlineMarkdownInBlock(li);
            ol.appendChild(li);

            const nextLi = document.createElement('li');
            nextLi.innerHTML = '<br>';
            ol.appendChild(nextLi);
            currentBlock.replaceWith(ol);
            lastActiveBlockRef.current = nextLi;

            const range = document.createRange();
            range.setStart(nextLi, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            syncRichTextToMarkdown();
            return;
          }

          // Task Checkbox on Enter
          if (isTask) {
            const span = currentBlock.querySelector('span:last-child');
            const taskText = span?.textContent?.trim() || '';
            if (taskText === '') {
              // Empty task: convert back to normal paragraph
              e.preventDefault();
              const p = document.createElement('p');
              p.className = 'my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200';
              p.innerHTML = '<br>';
              currentBlock.replaceWith(p);
              lastActiveBlockRef.current = p;

              const range = document.createRange();
              range.setStart(p, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
              syncRichTextToMarkdown();
              return;
            } else {
              // Format current task text before spawning new one
              if (span && (span as HTMLElement)) {
                formatInlineMarkdownInBlock(span as HTMLElement);
              }
              // Create next task checkbox
              e.preventDefault();
              const newTask = document.createElement('div');
              newTask.className = 'flex items-start gap-2 my-1 pl-1';
              newTask.setAttribute('data-task', ' ');
              newTask.innerHTML = `<span contenteditable="false" class="select-none mt-0.5"><input type="checkbox" class="rounded text-sky-500 focus:ring-sky-400 cursor-pointer" /></span><span><br></span>`;
              currentBlock.after(newTask);
              lastActiveBlockRef.current = newTask;

              const nextSpan = newTask.querySelector('span:last-child');
              if (nextSpan) {
                const range = document.createRange();
                range.setStart(nextSpan, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
              syncRichTextToMarkdown();
              return;
            }
          }

          // Li element inside UL or OL
          if (tagName === 'li') {
            const rawText = currentBlock.textContent || '';
            const cleanLi = rawText.replace(/^([-*]|\d+\.)[\s\u00A0]+/, '').trim();
            if (rawText.trim() === '' || cleanLi === '') {
              // Exit list to paragraph
              e.preventDefault();
              const p = document.createElement('p');
              p.className = 'my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200';
              p.innerHTML = '<br>';
              currentBlock.replaceWith(p);
              lastActiveBlockRef.current = p;

              const range = document.createRange();
              range.setStart(p, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
              syncRichTextToMarkdown();
              return;
            } else {
              // Strip prefix from current li and insert new li below
              e.preventDefault();
              currentBlock.textContent = cleanLi;
              formatInlineMarkdownInBlock(currentBlock);
              const nextLi = document.createElement('li');
              nextLi.innerHTML = '<br>';
              currentBlock.after(nextLi);
              lastActiveBlockRef.current = nextLi;

              const range = document.createRange();
              range.setStart(nextLi, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
              syncRichTextToMarkdown();
              return;
            }
          }

          // Standard Paragraph or Div: Format inline markdown and split to next paragraph
          e.preventDefault();
          let trailingFragment: DocumentFragment | null = null;
          try {
            const range = sel.getRangeAt(0);
            const endRange = range.cloneRange();
            endRange.selectNodeContents(currentBlock);
            endRange.setStart(range.endContainer, range.endOffset);
            trailingFragment = endRange.extractContents();
          } catch (err) {
            // fallback
          }

          cleanupInactiveBlock(currentBlock);
          formatInlineMarkdownInBlock(currentBlock);

          const nextP = document.createElement('p');
          nextP.className = 'my-1.5 leading-relaxed text-sm text-neutral-800 dark:text-neutral-200';
          if (trailingFragment && (trailingFragment.textContent?.trim() || trailingFragment.querySelector('*'))) {
            nextP.appendChild(trailingFragment);
            formatInlineMarkdownInBlock(nextP);
          } else {
            nextP.innerHTML = '<br>';
          }

          currentBlock.after(nextP);
          lastActiveBlockRef.current = nextP;

          const nextRange = document.createRange();
          nextRange.setStart(nextP, 0);
          nextRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nextRange);
          syncRichTextToMarkdown();
          return;
        }
      }
    }
  };

  // Handle Rich Editor KeyUp (Detect Block Change and Inline Markdown)
  const handleRichEditorKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 1. Check if user navigated with Arrow Keys to another line
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
      checkActiveBlockChange();
      return;
    }

    // 2. Inline Markdown Syntax checking on closing trigger keys
    const triggerKeys = ['*', '~', '`', ']', ')', ' '];
    if (!triggerKeys.includes(e.key)) return;

    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.anchorNode) return;
    const node = sel.anchorNode;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || '';
    const offset = sel.anchorOffset;
    const textBefore = text.slice(0, offset);

    // Bold: **text**
    const boldMatch = textBefore.match(/\*\*([^\*\n]+)\*\*$/);
    if (boldMatch) {
      const matchedFull = boldMatch[0];
      const innerText = boldMatch[1];
      replaceTextWithHtml(node, offset - matchedFull.length, offset, `<strong>${innerText}</strong>`);
      return;
    }

    // Strikethrough: ~~text~~
    const strikeMatch = textBefore.match(/~~([^~\n]+)~~$/);
    if (strikeMatch) {
      const matchedFull = strikeMatch[0];
      const innerText = strikeMatch[1];
      replaceTextWithHtml(node, offset - matchedFull.length, offset, `<del>${innerText}</del>`);
      return;
    }

    // Inline code: `text`
    const codeMatch = textBefore.match(/`([^`\n]+)`$/);
    if (codeMatch) {
      const matchedFull = codeMatch[0];
      const innerText = codeMatch[1];
      replaceTextWithHtml(
        node,
        offset - matchedFull.length,
        offset,
        `<code class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-mono text-xs font-semibold">${innerText}</code>`
      );
      return;
    }

    // Internal Link: [[Note Name]]
    const linkMatch = textBefore.match(/\[\[([^\]\n]+)\]\]$/);
    if (linkMatch) {
      const matchedFull = linkMatch[0];
      const rawTarget = linkMatch[1];
      const parts = rawTarget.split('|');
      const target = parts[0].trim();
      const displayName = parts[1] ? parts[1].trim() : target.split('/').pop()?.replace(/\.md$/, '') || target;
      replaceTextWithHtml(
        node,
        offset - matchedFull.length,
        offset,
        `<span class="internal-link inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md cursor-pointer hover:underline text-sky-600 dark:text-sky-400 bg-sky-500/10" data-link="${target}">${displayName}</span>`
      );
      return;
    }

    // External Link: [Label](url)
    const extMatch = textBefore.match(/\[([^\]\n]+)\]\((https?:\/\/[^\)\s]+)\)$/);
    if (extMatch) {
      const matchedFull = extMatch[0];
      const label = extMatch[1];
      const url = extMatch[2];
      replaceTextWithHtml(
        node,
        offset - matchedFull.length,
        offset,
        `<a href="${url}" class="underline hover:opacity-80 font-medium text-sky-600 dark:text-sky-400" target="_blank" rel="noopener noreferrer">${label}</a>`
      );
      return;
    }

    // Italic: *text* (no space required!)
    const italicMatch = textBefore.match(/(?<!\*)\*([^\*\n]+)\*$/);
    if (italicMatch && !boldMatch) {
      const matchedFull = italicMatch[0];
      const innerText = italicMatch[1];
      replaceTextWithHtml(node, offset - matchedFull.length, offset, `<em>${innerText}</em>`);
      return;
    }
  };

  // Clean up on blur or mouse click elsewhere
  const handleRichEditorMouseUp = () => {
    checkActiveBlockChange();
  };

  const handleRichEditorBlur = () => {
    if (lastActiveBlockRef.current) {
      cleanupInactiveBlock(lastActiveBlockRef.current);
      lastActiveBlockRef.current = null;
      syncRichTextToMarkdown();
    }
  };

  // Insert Internal Link [[Note]] via Workspace Modal Picker
  const handleInsertLink = () => {
    saveCurrentSelection();
    setShowLinkPicker(true);
  };

  const handleSelectInternalLink = (noteTitle: string, customDisplay?: string) => {
    const displayText = customDisplay || noteTitle;
    const mdTag = (customDisplay && customDisplay !== noteTitle)
      ? `[[${noteTitle}|${customDisplay}]]`
      : `[[${noteTitle}]]`;

    if (isRawSourceMode) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = rawSelectionStartRef.current ?? textarea.selectionStart;
      const end = rawSelectionEndRef.current ?? textarea.selectionEnd;
      const newContent = content.substring(0, start) + mdTag + content.substring(end);
      handleContentChange(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + mdTag.length, start + mdTag.length);
      }, 10);
      return;
    }

    const linkHtml = `<span class="internal-link inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-semibold px-1.5 py-0.5 bg-sky-500/10 rounded-md cursor-pointer hover:underline" data-link="${noteTitle}">${displayText}</span>&nbsp;`;

    if (richEditorRef.current) {
      richEditorRef.current.focus();
      const sel = window.getSelection();
      if (sel && savedRangeRef.current) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        } catch (err) {
          console.warn('Failed to restore range for WikiLink:', err);
        }
      }
      document.execCommand('insertHTML', false, linkHtml);
      syncRichTextToMarkdown();
    }
  };

  // Add custom Frontmatter property
  const handleAddProperty = () => {
    const key = prompt('Enter property key (e.g. status, author, story_date, location):');
    if (!key || !key.trim()) return;
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');

    if (cleanKey === 'title') {
      setInlineTitle(displayTitle);
      setIsEditingTitle(true);
      return;
    }

    const updatedFm = { ...parsed.frontmatter, [cleanKey]: '' };
    const newContent = serializeMarkdown(updatedFm, parsed.body);
    handleContentChange(newContent);
  };

  const handleUpdateFrontmatterKey = (key: string, value: any) => {
    const updatedFm = { ...parsed.frontmatter, [key]: value };
    const newContent = serializeMarkdown(updatedFm, parsed.body);
    handleContentChange(newContent);
  };

  const handleDeleteFrontmatterKey = (key: string) => {
    const updatedFm = { ...parsed.frontmatter };
    delete updatedFm[key];
    const newContent = serializeMarkdown(updatedFm, parsed.body);
    handleContentChange(newContent);
  };

  const handleSaveAsTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    saveFileAsTemplate(activeFile.id, templateName.trim(), templateCategory.trim(), templateDesc.trim());
    alert(`บันทึกไฟล์ "${activeFile.name}" เป็นเทมเพลตเรียบร้อยแล้ว!`);
    setShowSaveTemplateModal(false);
  };

  // Search & Replace
  const handleReplace = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newContent = content.replace(regex, replaceQuery);
    handleContentChange(newContent);
    if (richEditorRef.current) {
      const newParsed = parseMarkdown(newContent);
      richEditorRef.current.innerHTML = markdownToHtml(newParsed.body);
    }
  };

  // Handle clicks inside Rich Text Container (e.g. clicking [[Link]] chips or task checkboxes)
  const handleRichEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle Task Checkbox Toggle
    if (target.matches('input[type="checkbox"]')) {
      const checkbox = target as HTMLInputElement;
      const taskContainer = checkbox.closest('[data-task]');
      if (taskContainer) {
        const isChecked = checkbox.checked;
        taskContainer.setAttribute('data-task', isChecked ? 'x' : ' ');
        const textSpan = taskContainer.querySelector('span:last-child');
        if (textSpan) {
          if (isChecked) {
            textSpan.classList.add('line-through', 'text-neutral-400');
          } else {
            textSpan.classList.remove('line-through', 'text-neutral-400');
          }
        }
        syncRichTextToMarkdown();
      }
      return;
    }

    // 2. Handle External WebLink (<a>) click - Left-click immediately opens link
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        e.stopPropagation();
        setLinkTooltip(null);
        window.open(href, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // 3. Handle Internal WikiLink (span.internal-link) click - Left-click immediately opens target note
    const linkSpan = target.closest('.internal-link');
    if (linkSpan) {
      const rawTarget = linkSpan.getAttribute('data-link') || linkSpan.textContent?.trim() || '';
      const cleanTarget = rawTarget.replace(/^\[\[/, '').replace(/\]\]$/, '').trim();
      if (cleanTarget) {
        e.preventDefault();
        e.stopPropagation();
        setLinkTooltip(null);
        navigateInternalLink(cleanTarget);
      }
      return;
    }
  };

  // Mouse Down handler for Long-Press (Hold for 350ms) to trigger Link Tooltip on Desktop
  const handleRichEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkSpan = target.closest('.internal-link') as HTMLElement | null;
    const anchor = target.closest('a') as HTMLAnchorElement | null;

    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

    if (linkSpan || anchor) {
      longPressTimeoutRef.current = setTimeout(() => {
        if (linkSpan) {
          const rawTarget = linkSpan.getAttribute('data-link') || linkSpan.textContent?.trim() || '';
          const cleanTarget = rawTarget.replace(/^\[\[/, '').replace(/\]\]$/, '').trim();
          const display = linkSpan.textContent?.trim() || cleanTarget;
          const rect = linkSpan.getBoundingClientRect();

          openLinkTooltip('wikilink', cleanTarget, display, rect, linkSpan);
        } else if (anchor) {
          const href = anchor.getAttribute('href') || '#';
          const display = anchor.textContent?.trim() || href;
          const rect = anchor.getBoundingClientRect();

          openLinkTooltip('weblink', href, display, rect, anchor);
        }
      }, 350);
    }
  };

  // Context Menu (Right-Click) Handler for Link Tooltip UI on Desktop
  const handleRichEditorContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkSpan = target.closest('.internal-link') as HTMLElement | null;
    const anchor = target.closest('a') as HTMLAnchorElement | null;

    if (linkSpan) {
      e.preventDefault();
      e.stopPropagation();
      const rawTarget = linkSpan.getAttribute('data-link') || linkSpan.textContent?.trim() || '';
      const cleanTarget = rawTarget.replace(/^\[\[/, '').replace(/\]\]$/, '').trim();
      const display = linkSpan.textContent?.trim() || cleanTarget;
      const rect = linkSpan.getBoundingClientRect();

      openLinkTooltip('wikilink', cleanTarget, display, rect, linkSpan);
      return;
    }

    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
      const href = anchor.getAttribute('href') || '#';
      const display = anchor.textContent?.trim() || href;
      const rect = anchor.getBoundingClientRect();

      openLinkTooltip('weblink', href, display, rect, anchor);
      return;
    }
  };

  const handleRichEditorMouseOut = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isEditingTooltip) {
        setLinkTooltip(null);
        setIsUrlCopied(false);
      }
    }, 400);
  };

  const handleRichEditorTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkSpan = target.closest('.internal-link') as HTMLElement | null;
    const anchor = target.closest('a') as HTMLAnchorElement | null;

    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

    if (linkSpan || anchor) {
      longPressTimeoutRef.current = setTimeout(() => {
        if (linkSpan) {
          const rawTarget = linkSpan.getAttribute('data-link') || linkSpan.textContent?.trim() || '';
          const cleanTarget = rawTarget.replace(/^\[\[/, '').replace(/\]\]$/, '').trim();
          const display = linkSpan.textContent?.trim() || cleanTarget;
          const rect = linkSpan.getBoundingClientRect();

          openLinkTooltip('wikilink', cleanTarget, display, rect, linkSpan);
        } else if (anchor) {
          const href = anchor.getAttribute('href') || '#';
          const display = anchor.textContent?.trim() || href;
          const rect = anchor.getBoundingClientRect();

          openLinkTooltip('weblink', href, display, rect, anchor);
        }
      }, 350);
    }
  };

  const handleRichEditorTouchEnd = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
  };

  const handleCopyWebLinkUrl = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setIsUrlCopied(true);
    setTimeout(() => setIsUrlCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden relative">
      {/* MS Word / Notion Style Formatting Toolbar */}
      {showToolbar && (
        <>
          {/* DESKTOP TOOLBAR (lg:flex) */}
          <div className="hidden lg:flex min-h-11 border-b border-neutral-200 dark:border-neutral-800 px-3 py-1.5 items-center justify-between gap-y-1.5 gap-x-2 shrink-0 bg-neutral-50/80 dark:bg-neutral-950/80 select-none flex-wrap max-w-full">
            {/* Formatting Actions */}
            <div className="flex items-center gap-y-1.5 gap-x-1 py-0.5 flex-wrap flex-1 min-w-0 max-w-full">
              {/* Mode Switcher: Rich WYSIWYG vs Raw Markdown */}
              <button
                type="button"
                onClick={toggleSourceMode}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  isRawSourceMode
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300/80 dark:hover:bg-neutral-700'
                }`}
                title={isRawSourceMode ? 'Switch to Rich Text WYSIWYG (Ctrl+M)' : 'Switch to Raw Markdown Source Mode (Ctrl+M)'}
              >
                {isRawSourceMode ? (
                  <>
                    <Code className="w-3.5 h-3.5" />
                    <span className="font-mono">Raw MD</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Rich Text</span>
                  </>
                )}
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => applyRichFormat('formatBlock', '<h1>')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Heading 1 (or type '# ')"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyRichFormat('formatBlock', '<h2>')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Heading 2 (or type '## ')"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyRichFormat('formatBlock', '<h3>')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Heading 3 (or type '### ')"
              >
                <Heading3 className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => applyRichFormat('bold')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Bold (or type '**text**' / Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyRichFormat('italic')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Italic (or type '*text*' / Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyRichFormat('strikeThrough')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Strikethrough (or type '~~text~~')"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleInsertHighlight}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Highlight (or type '==text==')"
              >
                <Highlighter className="w-4 h-4 text-amber-500" />
              </button>
              <button
                type="button"
                onClick={handleInsertInlineCode}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-sky-600 dark:text-sky-400 transition-colors"
                title="Inline Code (or type '`code`')"
              >
                <Code className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              <button
                type="button"
                onClick={() => applyRichFormat('insertUnorderedList')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Bullet list (or type '- ' or '* ')"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyRichFormat('insertOrderedList')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Numbered list (or type '1. ')"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleInsertTaskCheckbox}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Task Checkbox (or type '- [ ] ')"
              >
                <CheckSquare className="w-4 h-4 text-sky-500" />
              </button>
              <button
                type="button"
                onClick={() => applyRichFormat('formatBlock', '<blockquote>')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Blockquote (or type '> ')"
              >
                <Quote className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              {/* Tab Indent & Outdent buttons */}
              <button
                type="button"
                onClick={handleIndent}
                className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md transition-colors font-medium shrink-0"
                title="Tab / ย่อหน้า (Tab)"
              >
                <Indent className="w-3.5 h-3.5" />
                <span className="text-[11px]">Tab</span>
              </button>
              <button
                type="button"
                onClick={handleOutdent}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="ยกเลิกการเยื้อง (Shift+Tab)"
              >
                <Outdent className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              <button
                type="button"
                onClick={handleInsertLink}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium hover:border-sky-500 rounded-md transition-colors shrink-0"
                title="Insert Internal Link [[Note]] (or type '[[Note]]' / Ctrl+K)"
              >
                <Link2 className="w-3.5 h-3.5 text-sky-500" />
                <span>WikiLink</span>
              </button>

              <button
                type="button"
                onClick={handleInsertWebLink}
                className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md transition-colors font-medium shrink-0"
                title="Insert External Web Link (URL + Custom Title)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>WebLink</span>
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

              {/* In-Editor Find & Replace */}
              <button
                type="button"
                onClick={() => setShowSearchReplace(!showSearchReplace)}
                className={`p-1.5 rounded-md transition-colors shrink-0 ${
                  showSearchReplace
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Find & Replace text"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplateName(activeFile.name.replace(/\.md$/, ''));
                  setTemplateDesc(`Template created from ${activeFile.name}`);
                  setShowSaveTemplateModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md transition-colors font-medium ml-1 shrink-0"
                title="Save this note structure as a Template"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save as Template</span>
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap ml-auto">
              <button
                type="button"
                onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  showMarkdownGuide
                    ? 'bg-sky-500 text-white'
                    : 'bg-neutral-200/50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title="Markdown Syntax Guide & Shortcuts"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>MD Guide</span>
              </button>

              {onOpenInspector && (
                <button
                  type="button"
                  onClick={onOpenInspector}
                  className="p-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
                  title="Document Info & Inspector"
                >
                  <Sliders className="w-4 h-4 text-sky-500" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowToolbar(false)}
                className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Hide Toolbar (Pure Markdown Focus Mode)"
              >
                <EyeOff className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowSearchReplace(!showSearchReplace)}
                className={`p-1.5 rounded-md transition-colors ${
                  showSearchReplace
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Search and Replace"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MOBILE TOOLBAR (flex lg:hidden) - NO HORIZONTAL SCROLL! */}
          <div className="flex lg:hidden h-11 border-b border-neutral-200 dark:border-neutral-800 px-2 items-center justify-between gap-1 shrink-0 bg-neutral-50/80 dark:bg-neutral-950/80 select-none overflow-hidden w-full">
            {/* Primary mobile buttons fitting inside the viewport */}
            <div className="flex items-center gap-1 overflow-hidden shrink min-w-0">
              {/* Mode Toggle icon */}
              <button
                type="button"
                onClick={toggleSourceMode}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  isRawSourceMode
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
                title={isRawSourceMode ? 'Switch to Rich Text' : 'Switch to Raw Markdown'}
              >
                {isRawSourceMode ? <Code className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-sky-500" />}
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-0.5 shrink-0" />

              {/* Undo */}
              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 shrink-0"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>

              {/* Redo */}
              <button
                type="button"
                onClick={handleRedo}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 shrink-0"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>

              <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-0.5 shrink-0" />

              {/* H1 */}
              <button
                type="button"
                onClick={() => applyRichFormat('formatBlock', '<h1>')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 font-bold text-xs shrink-0"
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>

              {/* H2 */}
              <button
                type="button"
                onClick={() => applyRichFormat('formatBlock', '<h2>')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 shrink-0"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>

              {/* Bold */}
              <button
                type="button"
                onClick={() => applyRichFormat('bold')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 font-bold shrink-0"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => applyRichFormat('italic')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 italic shrink-0"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>

              {/* Tab Indent (Dedicated mobile tool) */}
              <button
                type="button"
                onClick={handleIndent}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-sky-600 dark:text-sky-400 bg-sky-500/10 shrink-0"
                title="Tab / ย่อหน้า"
              >
                <Indent className="w-4 h-4" />
              </button>

              {/* List */}
              <button
                type="button"
                onClick={() => applyRichFormat('insertUnorderedList')}
                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300 shrink-0"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Right Controls: Search + 3-dots Menu for All Other Tools */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                type="button"
                onClick={() => setShowSearchReplace(!showSearchReplace)}
                className={`p-1.5 rounded-md transition-colors ${
                  showSearchReplace
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Search and Replace"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* 3-dots Vertical Menu Button to expand/collapse inline panel */}
              <button
                type="button"
                onClick={() => setShowMoreMobileMenu(!showMoreMobileMenu)}
                className={`p-1.5 rounded-md transition-all ${
                  showMoreMobileMenu
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 bg-neutral-200/50 dark:bg-neutral-800/60'
                }`}
                title={showMoreMobileMenu ? 'ย่อแถบเครื่องมือเพิ่มเติม' : 'ขยายเครื่องมือเพิ่มเติม (Expand Tools)'}
                aria-label="More Tools"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MOBILE MORE TOOLS EXPANDABLE INLINE PANEL (Instead of Modal) */}
          {showMoreMobileMenu && (
            <div className="flex lg:hidden flex-col border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-xs p-2.5 space-y-2 select-none shadow-xs shrink-0 animate-in slide-in-from-top-1 duration-150">
              {/* Category 1: Text Styles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-0.5">Format:</span>
                <button
                  type="button"
                  onClick={() => applyRichFormat('strikeThrough')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                  <span>~~ขีดฆ่า~~</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsertInlineCode}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 font-mono text-[11px] active:scale-95 transition-all"
                  title="Inline Code"
                >
                  <Code className="w-3.5 h-3.5 text-sky-500" />
                  <span>`Code`</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsertHighlight}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-amber-600 dark:text-amber-400 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Highlight"
                >
                  <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                  <span>==ไฮไลต์==</span>
                </button>
              </div>

              {/* Category 2: Structure & Lists */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-0.5">Structure:</span>
                <button
                  type="button"
                  onClick={() => applyRichFormat('formatBlock', '<h3>')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Heading 3"
                >
                  <Heading3 className="w-3.5 h-3.5 text-sky-500" />
                  <span>H3</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormat('formatBlock', '<blockquote>')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Blockquote"
                >
                  <Quote className="w-3.5 h-3.5" />
                  <span>Quote (&gt;)</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsertTaskCheckbox}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Task Checkbox"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                  <span>Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyRichFormat('insertOrderedList')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>1. ลิสต์เลข</span>
                </button>
                <button
                  type="button"
                  onClick={handleOutdent}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Outdent"
                >
                  <Outdent className="w-3.5 h-3.5" />
                  <span>ลดเยื้อง</span>
                </button>
              </div>

              {/* Category 3: Links & Extras */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-0.5">Tools:</span>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-500/20 active:scale-95 transition-all"
                  title="WikiLink [[Note]]"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>[[WikiLink]]</span>
                </button>
                <button
                  type="button"
                  onClick={handleInsertWebLink}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="Web Link"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>[Web Link]</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateName(activeFile.name.replace(/\.md$/, ''));
                    setTemplateDesc(`Template created from ${activeFile.name}`);
                    setShowSaveTemplateModal(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 active:scale-95 transition-all"
                  title="Save as Template"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarkdownGuide(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                  title="MD Guide"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
                  <span>Guide</span>
                </button>
                {onOpenInspector && (
                  <button
                    type="button"
                    onClick={onOpenInspector}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:border-sky-500 active:scale-95 transition-all"
                    title="Document Info"
                  >
                    <Sliders className="w-3.5 h-3.5 text-sky-500" />
                    <span>Info</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowToolbar(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs font-medium hover:border-neutral-400 active:scale-95 transition-all"
                  title="Hide Toolbar"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Mini Restore Button when Toolbar is Hidden */}
      {!showToolbar && (
        <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-1 shadow-md select-none">
          <span className="text-[11px] font-mono text-neutral-500">Markdown Active</span>
          <button
            type="button"
            onClick={() => setShowMarkdownGuide(true)}
            className="p-1 text-sky-500 hover:text-sky-600"
            title="Markdown Syntax Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowToolbar(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-sky-500 pl-1 border-l border-neutral-200 dark:border-neutral-800"
            title="Show Toolbar"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Toolbar</span>
          </button>
        </div>
      )}

      {/* In-Editor Search & Replace Drawer - Mobile First Redesign */}
      {showSearchReplace && (
        <div className="p-3 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 space-y-2 text-xs shadow-inner shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-sky-500" />
              Find & Replace
            </span>
            <button
              onClick={() => setShowSearchReplace(false)}
              className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Find text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute right-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500 shadow-xs"
              />
              <button
                onClick={handleReplace}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors shrink-0 shadow-sm active:scale-95"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-4xl mx-auto w-full">
        {/* Frontmatter Properties - Mobile-First Compact Name Card & Inline List */}
        <div className="mb-4 sm:mb-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden select-none">
          {/* Card Header Bar */}
          <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/50">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {typeof parsed.frontmatter.type === 'string' && parsed.frontmatter.type
                  ? parsed.frontmatter.type.slice(0, 2)
                  : 'MD'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Inline Editable Title */}
                  {isEditingTitle ? (
                    <div className="flex items-center gap-1 min-w-0">
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        onBlur={() => handleSaveInlineTitle()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveInlineTitle();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setInlineTitle(displayTitle);
                            setIsEditingTitle(false);
                          }
                        }}
                        className="font-display font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-950 border border-sky-500 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs min-w-[140px] max-w-[260px] sm:max-w-[360px]"
                        placeholder="ชื่อเรื่อง (Note Title)..."
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setInlineTitle(displayTitle);
                        setIsEditingTitle(true);
                      }}
                      className="group/title flex items-center gap-1.5 py-0.5 px-1.5 -mx-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors text-left max-w-full cursor-text"
                      title="คลิกเพื่อแก้ไข Title (Inline Edit)"
                    >
                      <h3 className="font-display font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover/title:text-sky-600 dark:group-hover/title:text-sky-400 transition-colors">
                        {displayTitle}
                      </h3>
                      <Pencil className="w-3 h-3 text-neutral-400 group-hover/title:text-sky-500 opacity-0 group-hover/title:opacity-100 transition-all shrink-0" />
                    </button>
                  )}
                  {parsed.frontmatter.type && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
                      {parsed.frontmatter.type}
                    </span>
                  )}
                  {parsed.frontmatter.status && (
                    <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      {parsed.frontmatter.status}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                  ID: {parsed.frontmatter.id || activeFile.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAddProperty}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-xs whitespace-nowrap"
                title="Add new property"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Property</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFrontmatterExpanded(!isFrontmatterExpanded)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title={isFrontmatterExpanded ? 'Collapse properties' : 'Expand properties'}
              >
                {isFrontmatterExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Compact Mobile-First Inline Properties List */}
          {isFrontmatterExpanded && (
            <div className="p-2.5 sm:p-4 space-y-2 text-xs bg-neutral-50/30 dark:bg-neutral-950/30">
              {Object.entries(parsed.frontmatter)
                .filter(([key]) => key.toLowerCase() !== 'title')
                .map(([key, val]) => {
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 hover:border-sky-500/40 transition-colors"
                    >
                      {/* Key Label Badge */}
                      <div className="w-20 sm:w-28 shrink-0 flex items-center gap-1 text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide truncate">
                        <Tag className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">{key}</span>
                      </div>

                      {/* Inline Value Input Field */}
                      <div className="flex-1 min-w-0">
                        {Array.isArray(val) ? (
                          <input
                            type="text"
                            value={val.join(', ')}
                            onChange={(e) =>
                              handleUpdateFrontmatterKey(
                                key,
                                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-neutral-900 transition-all"
                            placeholder="comma-separated values..."
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(val ?? '')}
                            onChange={(e) => handleUpdateFrontmatterKey(key, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-neutral-900 transition-all"
                            placeholder="property value..."
                          />
                        )}
                      </div>

                      {/* Delete Property Action */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFrontmatterKey(key)}
                        className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors shrink-0"
                        title="Delete property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              {Object.entries(parsed.frontmatter).filter(([key]) => key.toLowerCase() !== 'title').length === 0 && (
                <div className="py-3 px-2 text-center text-neutral-400 dark:text-neutral-500 text-xs italic">
                  ไม่มีคุณสมบัติอื่นเพิ่มเติม (คุณสมบัติ Title ถูกย้ายไปแสดงและแก้ไขได้ที่หัวเรื่องด้านบนแล้ว)
                </div>
              )}
            </div>
          )}
        </div>

        {/* UNIFIED DIRECT WYSIWYG RICH TEXT DOCUMENT CANVAS */}
        {isRawSourceMode ? (
          /* Optional Raw Plain Text Source Mode */
          <div className="relative space-y-2">
            <div className="flex items-center justify-between px-1 text-xs text-neutral-500 select-none">
              <span className="font-mono text-sky-600 dark:text-sky-400 flex items-center gap-1.5 font-medium">
                <Code className="w-3.5 h-3.5" />
                Raw Markdown Source Mode
              </span>
              <button
                type="button"
                onClick={toggleSourceMode}
                className="text-sky-600 dark:text-sky-400 hover:underline font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Switch to Rich Text (Ctrl+M)
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  if (e.shiftKey) handleOutdent();
                  else handleIndent();
                }
              }}
              className="w-full min-h-[550px] p-5 font-mono text-sm leading-relaxed bg-neutral-50/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500 resize-y shadow-xs"
              placeholder="Write Markdown source code directly (# Heading, - List, **bold**, [[Note]])..."
            />
          </div>
        ) : (
          /* Direct Editable Rich Text Document with Live Markdown Syntax typing */
          <div className="relative min-h-[550px] p-6 sm:p-8 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-4">
            {/* Editable Rich Content Area */}
            <div
              ref={richEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncRichTextToMarkdown}
              onKeyDown={handleRichEditorKeyDown}
              onKeyUp={handleRichEditorKeyUp}
              onMouseDown={handleRichEditorMouseDown}
              onMouseUp={handleRichEditorMouseUp}
              onBlur={handleRichEditorBlur}
              onClick={handleRichEditorClick}
              onContextMenu={handleRichEditorContextMenu}
              onTouchStart={handleRichEditorTouchStart}
              onTouchEnd={handleRichEditorTouchEnd}
              onTouchCancel={handleRichEditorTouchEnd}
              className="w-full min-h-[450px] focus:outline-none leading-relaxed text-neutral-900 dark:text-neutral-100 text-sm space-y-2 font-sans editor-content"
            />

            {/* Bottom Live Document Banner with Markdown Syntax Hints */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800 select-none">
              <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rich Text with Markdown Syntax</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
                  Type #, ##, -, - [ ], &gt;, **, [[ ]]
                </span>
                <button
                  type="button"
                  onClick={() => setShowMarkdownGuide(true)}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                >
                  Syntax Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Markdown Syntax Guide Modal */}
      {showMarkdownGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowMarkdownGuide(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 z-10 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-900 dark:text-neutral-100">
                    Markdown Syntax & Shortcuts
                  </h3>
                  <p className="text-xs text-neutral-500">
                    พิมพ์ Markdown Syntax แทนแถบเครื่องมือได้โดยตรง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMarkdownGuide(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tips */}
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span>
                <strong>ไม่ต้องใช้ Toolbar:</strong> พิมพ์สัญลักษณ์ Markdown เช่น <code className="bg-sky-500/20 px-1 py-0.5 rounded font-mono font-bold">#</code> หรือ <code className="bg-sky-500/20 px-1 py-0.5 rounded font-mono font-bold">-</code> แล้วกด <strong>Space</strong> ระบบจะจัดรูปแบบให้ทันที!
              </span>
            </div>

            {/* Block Syntax Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                1. Block Formatting (พิมพ์ต้นบรรทัด + กด Space)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400"># + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Heading 1 (หัวข้อใหญ่)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">## + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Heading 2 (หัวข้อกลาง)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">### + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Heading 3 (หัวข้อย่อย)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">- หรือ * + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Bullet List (รายการจุด)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">1. + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Numbered List (รายการตัวเลข)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">- [ ] + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Interactive Task Checkbox</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">&gt; + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Blockquote (คำคม / อ้างอิง)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">``` + Space</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Code Block (บล็อกโค้ด)</div>
                </div>
              </div>
            </div>

            {/* Inline Syntax Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                2. Inline Formatting (พิมพ์ในข้อความ)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">**ข้อความ**</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]"><strong>ตัวหนา</strong> (Ctrl+B)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">*ข้อความ*</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]"><em>ตัวเอียง</em> (Ctrl+I)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">~~ข้อความ~~</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]"><del>ขีดฆ่า</del></div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">`โค้ด`</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]"><code>Inline Code</code></div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">[[ชื่อโน้ต]]</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">WikiLink เชื่อมโยงโน้ต (Ctrl+K)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-mono font-semibold text-sky-600 dark:text-sky-400">[ข้อความ](https://...)</div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[11px]">Web Link</div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1.5 text-xs">
              <h5 className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-sky-500" />
                คีย์ลัดที่มีประโยชน์
              </h5>
              <div className="flex flex-wrap gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                <span className="px-2 py-1 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 font-mono">
                  Ctrl+M: สลับ Raw Markdown / Rich Text
                </span>
                <span className="px-2 py-1 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 font-mono">
                  Ctrl+B: ตัวหนา
                </span>
                <span className="px-2 py-1 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 font-mono">
                  Ctrl+I: ตัวเอียง
                </span>
                <span className="px-2 py-1 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 font-mono">
                  Ctrl+K: ลิงก์โน้ต [[Link]]
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMarkdownGuide(false)}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Status Bar */}
      <footer className="h-8 border-t border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-950/80 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums">{stats.words} words</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{stats.charsWithSpaces} chars</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{stats.readingTimeMinutes} min read</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]">v{activeFile.version || 1}</span>
          <span>·</span>
          <span
            className={
              saveState === 'saving'
                ? 'text-sky-500 font-semibold'
                : 'text-neutral-400'
            }
          >
            {saveState === 'saving' ? 'Saving...' : 'Auto-saved'}
          </span>
        </div>
      </footer>

      {/* Save Note as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowSaveTemplateModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Save Note as Template
                </h3>
              </div>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsTemplateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Template Name:
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Category:
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="e.g. Novel, Worldbuilding, Character..."
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Description:
                </label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-xs"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Internal Link Picker Modal */}
      <InternalLinkPickerModal
        isOpen={showLinkPicker}
        onClose={() => setShowLinkPicker(false)}
        onSelectLink={handleSelectInternalLink}
        initialSelectedText={selectedTextForLink}
      />

      {/* Web Link Picker Modal */}
      <WebLinkPickerModal
        isOpen={showWebLinkModal}
        onClose={() => setShowWebLinkModal(false)}
        onInsertLink={handleSelectWebLink}
        initialSelectedText={selectedTextForLink}
      />

      {/* Floating Link Tooltip Popover UI (Desktop Hover & Mobile Long-Press) */}
      {linkTooltip && (
        <div
          ref={tooltipRef}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => {
            setLinkTooltip(null);
            setIsUrlCopied(false);
          }}
          style={{
            position: 'fixed',
            left: `${Math.max(160, Math.min(window.innerWidth - 160, linkTooltip.x))}px`,
            top: `${Math.max(110, linkTooltip.y)}px`,
          }}
          className="z-50 -translate-x-1/2 -translate-y-full mb-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-3 text-xs select-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          {isEditingTooltip ? (
            /* INLINE EDIT MODE FOR TOOLTIP */
            <form onSubmit={handleSaveInlineLinkEdit} className="space-y-2">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="flex items-center gap-1.5 truncate">
                  <Pencil className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>แก้ไขลิงก์ (Inline Edit)</span>
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-500/10 font-mono">
                  {linkTooltip.type}
                </span>
              </div>

              {linkTooltip.type === 'wikilink' ? (
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">เลือกลิงก์โน้ตใหม่:</label>
                    <select
                      value={editTooltipTarget}
                      onChange={(e) => {
                        setEditTooltipTarget(e.target.value);
                        if (!editTooltipDisplay || editTooltipDisplay === linkTooltip.target) {
                          setEditTooltipDisplay(e.target.value);
                        }
                      }}
                      className="w-full mt-0.5 p-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                    >
                      {files
                        .filter((f: any) => f.workspaceId === activeWorkspace.id && !f.deletedAt)
                        .map((f: any) => {
                          const titleName = f.name.replace(/\.md$/, '');
                          return (
                            <option key={f.id} value={titleName}>
                              {titleName}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">ข้อความแสดงผล (Display Text):</label>
                    <input
                      type="text"
                      value={editTooltipDisplay}
                      onChange={(e) => setEditTooltipDisplay(e.target.value)}
                      placeholder="ข้อความแสดงผล..."
                      className="w-full mt-0.5 p-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">URL ปลายทาง:</label>
                    <input
                      type="url"
                      value={editTooltipTarget}
                      onChange={(e) => setEditTooltipTarget(e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-0.5 p-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">ข้อความแสดงผล (Label):</label>
                    <input
                      type="text"
                      value={editTooltipDisplay}
                      onChange={(e) => setEditTooltipDisplay(e.target.value)}
                      placeholder="ข้อความลิงก์..."
                      className="w-full mt-0.5 p-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-1.5 flex items-center justify-end gap-1.5 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditingTooltip(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[11px] shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>บันทึกลิงก์ใหม่</span>
                </button>
              </div>
            </form>
          ) : linkTooltip.type === 'wikilink' ? (
            /* WIKILINK TIP UI */
            (() => {
              const cleanTarget = linkTooltip.target;
              const resolvedNote = files.find(
                (f) =>
                  f.workspaceId === activeWorkspace.id &&
                  !f.deletedAt &&
                  (f.name.replace(/\.md$/, '').toLowerCase() === cleanTarget.toLowerCase() ||
                    f.name.toLowerCase() === `${cleanTarget.toLowerCase()}.md`)
              );
              const snippet = resolvedNote?.content
                ? resolvedNote.content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim().slice(0, 110)
                : null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="flex items-center gap-1.5 truncate">
                      <Link2 className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                      <span className="truncate">Internal WikiLink</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 shrink-0">
                      [[{cleanTarget}]]
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                      {linkTooltip.display}
                    </p>
                    {resolvedNote ? (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 italic font-sans leading-relaxed">
                        &quot;{snippet || 'Empty note content...'}&quot;
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                        ⚠ โน้ตนี้ยังไม่มีอยู่จริง (คลิกเพื่อสร้างโน้ตใหม่)
                      </p>
                    )}
                  </div>

                  <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingTooltip(true)}
                      className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      title="แก้ไขลิงก์และข้อความแสดงผล"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLinkTooltip(null);
                        navigateInternalLink(cleanTarget);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-xs shrink-0"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{resolvedNote ? 'เปิดโน้ต' : 'สร้างและเปิด'}</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            /* WEBLINK TIP UI */
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="flex items-center gap-1.5 truncate">
                  <Globe className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                  <span className="truncate">External Web Link</span>
                </span>
                <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
              </div>

              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                  {linkTooltip.display}
                </p>
                <p className="text-[10px] text-neutral-400 font-mono break-all line-clamp-2 mt-0.5 select-all">
                  {linkTooltip.target}
                </p>
              </div>

              <div className="pt-1.5 flex items-center justify-between gap-1.5 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditingTooltip(true)}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  title="แก้ไข URL และข้อความลิงก์"
                >
                  <Pencil className="w-3 h-3" />
                  <span>แก้ไข</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleCopyWebLinkUrl(linkTooltip.target, e)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 ${
                      isUrlCopied
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                    title="คัดลอก URL External Link"
                  >
                    {isUrlCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{isUrlCopied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLinkTooltip(null);
                      window.open(linkTooltip.target, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-xs shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>เปิดเว็บ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
