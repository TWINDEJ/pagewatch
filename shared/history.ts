import * as fs from 'fs';
import * as path from 'path';
import { ChangeAnalysis } from './vision';

export interface HistoryEntry {
  timestamp: string;
  url: string;
  name: string;
  changePercent: number;
  analysis: ChangeAnalysis | null;
  beforeScreenshot: string;
  afterScreenshot: string;
}

const HISTORY_FILE = path.join('data', 'history.json');

export function loadHistory(): HistoryEntry[] {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  const history = loadHistory();
  history.push(entry);
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

export function getHistoryForUrl(url: string, limit = 20): HistoryEntry[] {
  return loadHistory()
    .filter(e => e.url === url)
    .slice(-limit);
}

export function printHistory(entries: HistoryEntry[]): void {
  if (entries.length === 0) {
    console.log('Ingen historik ännu.');
    return;
  }

  for (const entry of entries) {
    const date = new Date(entry.timestamp).toLocaleString('sv-SE');
    const importance = entry.analysis?.importance ?? '-';
    const summary = entry.analysis?.summary ?? 'Ingen signifikant ändring';
    console.log(`  ${date} | ${entry.changePercent.toFixed(2)}% | ${importance}/10 | ${summary}`);
  }
}
