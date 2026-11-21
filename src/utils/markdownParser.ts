import { load, dump } from 'js-yaml';
import { FrontmatterProperties } from '../types';

export interface ParsedMarkdown {
  frontmatter: FrontmatterProperties;
  rawFrontmatter: string;
  body: string;
  hasFrontmatter: boolean;
}

export function parseMarkdown(content: string): ParsedMarkdown {
  if (!content) {
    return { frontmatter: {}, rawFrontmatter: '', body: '', hasFrontmatter: false };
  }

  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = content.match(frontmatterRegex);

  if (match) {
    const rawYaml = match[1];
    const body = content.slice(match[0].length);
    try {
      const parsed = load(rawYaml) as FrontmatterProperties;
      return {
        frontmatter: parsed && typeof parsed === 'object' ? parsed : {},
        rawFrontmatter: rawYaml,
        body,
        hasFrontmatter: true,
      };
    } catch (e) {
      console.warn('Failed to parse YAML frontmatter:', e);
      return {
        frontmatter: {},
        rawFrontmatter: rawYaml,
        body,
        hasFrontmatter: true,
      };
    }
  }

  return {
    frontmatter: {},
    rawFrontmatter: '',
    body: content,
    hasFrontmatter: false,
  };
}

export function serializeMarkdown(frontmatter: FrontmatterProperties, body: string): string {
  const cleanFrontmatter = Object.entries(frontmatter).reduce((acc: any, [key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      acc[key] = val;
    }
    return acc;
  }, {});

  if (Object.keys(cleanFrontmatter).length === 0) {
    return body;
  }

  try {
    const yamlString = dump(cleanFrontmatter, { lineWidth: -1, forceQuotes: false });
    return `---\n${yamlString.trim()}\n---\n\n${body.replace(/^\s+/, '')}`;
  } catch (e) {
    console.error('Failed to serialize YAML frontmatter:', e);
    return body;
  }
}

// Extract internal links like [[Lucia]] or [[Worldbuilding/Geography]]
export function extractInternalLinks(content: string): string[] {
  const links: string[] = [];
  const regex = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const linkTarget = match[1].split('|')[0].trim();
    if (linkTarget && !links.includes(linkTarget)) {
      links.push(linkTarget);
    }
  }
  return links;
}

// Extract headings for outline
export interface HeadingItem {
  level: number;
  text: string;
  line: number;
}

export function extractHeadings(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: index + 1,
      });
    }
  });

  return headings;
}

// Compute statistics
export function calculateStats(content: string) {
  const text = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ''); // remove frontmatter
  const trimmed = text.trim();

  // Words (handles English and Thai/CJK spaces)
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const charsWithSpaces = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    charsWithSpaces,
    charsNoSpaces,
    paragraphs,
    readingTimeMinutes,
  };
}
