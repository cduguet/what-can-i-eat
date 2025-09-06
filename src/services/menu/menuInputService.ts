import { MenuItem } from '@/types';
import { Platform } from 'react-native';

// Match manual text entry limits to ensure parity with URL analysis
const MAX_MENU_TEXT_CHARS = 5000;

// Basic heuristics to extract items from text blocks
export function parseMenuText(raw: string): MenuItem[] {
  const lines = raw
    .split(/\r?\n|\u2022|\*/)
    .map(l => l.trim())
    .filter(l => l.length >= 2);

  const items: MenuItem[] = [];
  let index = 1;
  for (const line of lines) {
    // Split name and description by common separators
    const match = line.match(/^(.*?)[\s]*[-–:][\s]*(.+)$/);
    const name = (match ? match[1] : line).trim();
    const description = match ? match[2].trim() : undefined;
    // Skip lines that look like section headers (ALL CAPS and short)
    if (/^[A-Z\s]{2,}$/.test(name) && name.split(' ').length <= 4) continue;
    // Avoid duplicates
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) continue;
    items.push({ id: String(index++), name, description, rawText: line });
  }
  return items;
}

export async function fetchAndExtractMenuFromUrl(url: string): Promise<MenuItem[]> {
  const normalizedUrl = normalizeUrl(url);

  // Try direct fetch first (works on native). On web, fall back to a CORS-friendly proxy.
  let rawContent: string | null = null;
  try {
    const res = await fetch(normalizedUrl);
    rawContent = await res.text();
  } catch (err) {
    // Ignore and try proxy below
  }

  if (Platform.OS === 'web' && !rawContent) {
    // CORS-safe fallback using Jina Reader proxy which returns markdown/plain text
    const proxyUrl = `https://r.jina.ai/${normalizedUrl}`;
    const proxyRes = await fetch(proxyUrl);
    rawContent = await proxyRes.text();
  }

  if (!rawContent) {
    throw new Error('Failed to fetch content from URL');
  }

  // Decide best cleaning strategy based on content
  const cleaned = looksLikeHtml(rawContent)
    ? stripHtml(rawContent)
    : stripMarkdown(rawContent);

  const text = cleaned.slice(0, MAX_MENU_TEXT_CHARS);
  return parseMenuText(text);
}

function normalizeUrl(input: string): string {
  if (!/^https?:\/\//i.test(input)) {
    return `https://${input}`;
  }
  return input;
}

function looksLikeHtml(input: string): boolean {
  // Heuristic: presence of HTML tags and doctype
  return /<html|<body|<div|<p|<head|<!doctype/i.test(input);
}

function stripHtml(html: string): string {
  // Remove scripts/styles, preserve logical line breaks from common block elements
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // Insert line breaks for common block-level separators
    .replace(/<br\s*\/?>(?=\s*<)/gi, '\n')
    .replace(/<\/(p|li|h\d|div|section|article)>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Normalize slashed spacing (e.g., "A / B")
    .replace(/\s+\/\s+/g, ' / ')
    // Collapse only spaces/tabs, not newlines (preserve line boundaries)
    .replace(/[ \t]{2,}/g, ' ')
    // Trim whitespace around line breaks
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    // Collapse excessive blank lines
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function stripMarkdown(md: string): string {
  // Remove common front-matter style lines injected by proxies (Title/URL Source/Markdown Content)
  const lines = md
    .split(/\r?\n/)
    .filter(l => !/^\s*(Title:|URL Source:|Markdown Content:)/i.test(l))
    // Drop obvious image-only lines
    .filter(l => !/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(l));

  const cleaned = lines
    // Convert markdown links [text](url) -> text
    .map(l => l.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'))
    // Remove heading markers and setext underlines
    .map(l => l.replace(/^#{1,6}\s*/g, ''))
    .filter(l => !/^\s*(=|-){3,}\s*$/.test(l))
    .join('\n');

  return cleaned
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
