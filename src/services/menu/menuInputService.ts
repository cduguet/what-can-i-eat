import { MenuItem } from '@/types';

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
  const text = stripHtml(html);
  return parseMenuText(text);
}

function stripHtml(html: string): string {
  // Remove scripts/styles and tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>(?=\s*<)/gi, '\n')
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\/\s+/g, ' / ')
    .replace(/\s{2,}/g, ' ') // collapse spaces
    .replace(/\n{2,}/g, '\n')
    .trim();
}

