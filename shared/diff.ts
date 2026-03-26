import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import type { PageStructure } from './extract';

export interface DiffResult {
  changedPixels: number;
  totalPixels: number;
  changePercent: number;
  diffImagePath: string;
}

export interface StructuredDiffResult {
  hasChanged: boolean;
  priceChanges: string[];
  addedHeadings: string[];
  removedHeadings: string[];
  addedButtons: string[];
  removedButtons: string[];
  addedLinks: string[];
  removedLinks: string[];
  summary: string;
}

export async function compareScreenshots(
  beforePath: string,
  afterPath: string,
  diffPath: string
): Promise<DiffResult> {
  const before = PNG.sync.read(fs.readFileSync(beforePath));
  const after = PNG.sync.read(fs.readFileSync(afterPath));

  const { width, height } = before;
  const diff = new PNG({ width, height });

  const changedPixels = pixelmatch(
    before.data, after.data, diff.data,
    width, height,
    { threshold: 0.1 }
  );

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const changePercent = (changedPixels / totalPixels) * 100;

  return { changedPixels, totalPixels, changePercent, diffImagePath: diffPath };
}

// ─── Strukturerad diff ───

function setDiff(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: after.filter(x => !beforeSet.has(x)),
    removed: before.filter(x => !afterSet.has(x)),
  };
}

function findPriceChanges(before: string[], after: string[]): string[] {
  // Matcha priser som ändrats genom att jämföra numeriska värden
  const changes: string[] = [];
  const { added, removed } = setDiff(before, after);

  // Para ihop borttagna och tillagda priser (enkel heuristik)
  for (const rem of removed) {
    for (const add of added) {
      // Om båda har samma valutasymbol, para ihop
      const remCurrency = rem.match(/[\$€£]|SEK|kr/i)?.[0];
      const addCurrency = add.match(/[\$€£]|SEK|kr/i)?.[0];
      if (remCurrency && addCurrency && remCurrency.toLowerCase() === addCurrency.toLowerCase()) {
        changes.push(`${rem} → ${add}`);
      }
    }
  }

  // Om inga parningar hittades, lista alla tillagda/borttagna
  if (changes.length === 0) {
    for (const rem of removed) changes.push(`Removed: ${rem}`);
    for (const add of added) changes.push(`Added: ${add}`);
  }

  return changes;
}

export function compareStructured(
  beforePath: string,
  afterPath: string
): StructuredDiffResult {
  const before: PageStructure = JSON.parse(fs.readFileSync(beforePath, 'utf-8'));
  const after: PageStructure = JSON.parse(fs.readFileSync(afterPath, 'utf-8'));

  const priceChanges = findPriceChanges(before.prices, after.prices);
  const headingDiff = setDiff(before.headings, after.headings);
  const buttonDiff = setDiff(before.buttons, after.buttons);
  const linkDiff = setDiff(
    before.links.map(l => l.text),
    after.links.map(l => l.text)
  );

  const hasChanged = priceChanges.length > 0
    || headingDiff.added.length > 0 || headingDiff.removed.length > 0
    || buttonDiff.added.length > 0 || buttonDiff.removed.length > 0
    || linkDiff.added.length > 0 || linkDiff.removed.length > 0;

  // Bygg sammanfattning för AI-prompten
  const parts: string[] = [];
  if (priceChanges.length > 0) parts.push(`Price changes: ${priceChanges.join(', ')}`);
  if (headingDiff.removed.length > 0) parts.push(`Removed headings: ${headingDiff.removed.join(', ')}`);
  if (headingDiff.added.length > 0) parts.push(`Added headings: ${headingDiff.added.join(', ')}`);
  if (buttonDiff.removed.length > 0) parts.push(`Removed buttons: ${buttonDiff.removed.join(', ')}`);
  if (buttonDiff.added.length > 0) parts.push(`Added buttons: ${buttonDiff.added.join(', ')}`);
  if (linkDiff.removed.length > 0) parts.push(`Removed links: ${linkDiff.removed.slice(0, 10).join(', ')}`);
  if (linkDiff.added.length > 0) parts.push(`Added links: ${linkDiff.added.slice(0, 10).join(', ')}`);

  const summary = parts.join('\n').slice(0, 2000);

  return {
    hasChanged,
    priceChanges,
    addedHeadings: headingDiff.added,
    removedHeadings: headingDiff.removed,
    addedButtons: buttonDiff.added,
    removedButtons: buttonDiff.removed,
    addedLinks: linkDiff.added,
    removedLinks: linkDiff.removed,
    summary,
  };
}
