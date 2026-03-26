import type { Page } from 'playwright';

export interface PageStructure {
  prices: string[];
  headings: string[];
  buttons: string[];
  links: { text: string; href: string }[];
  lists: string[];
  meta: string[];
}

/**
 * Extraherar strukturerad data från en Playwright-sida.
 * Körs i browser-kontexten via page.evaluate().
 */
export async function extractStructure(page: Page): Promise<PageStructure> {
  return page.evaluate(() => {
    const getText = (el: Element): string => (el.textContent || '').trim().replace(/\s+/g, ' ');

    // Priser — matchar $, €, £, SEK, kr följt av siffror
    const priceRegex = /(?:\$|€|£|SEK|kr\.?)\s*\d[\d\s,.]*\d?|\d[\d\s,.]*\d?\s*(?:\$|€|£|SEK|kr\.?)/gi;
    const bodyText = document.body?.textContent || '';
    const prices = [...new Set(Array.from(bodyText.matchAll(priceRegex), m => m[0].trim()))];

    // Rubriker
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(getText)
      .filter(t => t.length > 0 && t.length < 200);

    // Knappar & CTAs
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], a.btn, a[class*="button"], a[class*="cta"]'))
      .map(getText)
      .filter(t => t.length > 0 && t.length < 100);

    // Länkar med synlig text
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(el => ({ text: getText(el), href: (el as HTMLAnchorElement).href }))
      .filter(l => l.text.length > 0 && l.text.length < 200)
      .slice(0, 100); // begränsa för stora sidor

    // Listor
    const lists = Array.from(document.querySelectorAll('li'))
      .map(getText)
      .filter(t => t.length > 0 && t.length < 300)
      .slice(0, 100);

    // Meta
    const title = document.title || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const meta = [title, metaDesc].filter(Boolean);

    return { prices, headings, buttons, links, lists, meta };
  });
}

// ─── Brus-filter ───

const NOISE_PATTERNS = [
  // Timestamps & datum
  /\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?/i,
  /\d{1,2}\s+(seconds?|minutes?|hours?|days?|weeks?|months?)\s+ago/i,
  /\d{1,2}\s+(sekunder?|minuter?|timmar?|dagar?|veckor?|månader?)\s+sedan/i,
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{4}/i,
  /\d{4}-\d{2}-\d{2}/,
  /updated?\s*(at|on)?\s*:?\s*\d/i,
  /last\s+modified/i,

  // Cookie/GDPR
  /\bcookies?\b/i,
  /\baccept\s+all\b/i,
  /\bconsent\b/i,
  /\bgdpr\b/i,
  /\bprivacy\s+settings?\b/i,

  // Dynamiskt content
  /\d+\s+users?\s+online/i,
  /\bonline\s+now\b/i,
  /\bsession\b/i,
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUIDs
  /\bcsrf\b/i,
  /\bnonce\b/i,
];

function isNoise(text: string): boolean {
  return NOISE_PATTERNS.some(p => p.test(text));
}

function filterNoisy(items: string[]): string[] {
  return items.filter(item => !isNoise(item));
}

/**
 * Tar bort kända dynamiska element (timestamps, cookie-banners etc.)
 */
export function stripNoise(structure: PageStructure): PageStructure {
  return {
    prices: structure.prices, // Priser filtreras ALDRIG — alltid relevanta
    headings: filterNoisy(structure.headings),
    buttons: filterNoisy(structure.buttons),
    links: structure.links.filter(l => !isNoise(l.text)),
    lists: filterNoisy(structure.lists),
    meta: structure.meta, // Meta filtreras inte
  };
}
