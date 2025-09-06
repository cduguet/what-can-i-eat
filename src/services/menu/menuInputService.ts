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
  const res = await fetch(url);
  const html = await res.text();
  // Normalize and cap extracted text to match manual entry limit (5000 chars)
  const text = stripHtml(html).slice(0, MAX_MENU_TEXT_CHARS);
  return parseMenuText(text);
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
