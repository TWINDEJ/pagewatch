import { loadHistory, HistoryEntry } from './history';
import { loadTargets } from './config';

export interface DailySummary {
  date: string;
  totalChecks: number;
  changesDetected: number;
  significantChanges: HistoryEntry[];
  noChangeUrls: string[];
}

/**
 * Generera en sammanfattning för ett givet datum
 */
export function getDailySummary(date?: string): DailySummary {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const history = loadHistory();
  const targets = loadTargets();

  const todaysEntries = history.filter(e =>
    e.timestamp.startsWith(targetDate)
  );

  const significant = todaysEntries.filter(e =>
    e.analysis && e.analysis.hasSignificantChange
  );

  const noChange = targets
    .filter(t => !significant.some(s => s.url === t.url))
    .map(t => t.name);

  return {
    date: targetDate,
    totalChecks: todaysEntries.length,
    changesDetected: significant.length,
    significantChanges: significant,
    noChangeUrls: noChange,
  };
}

/**
 * Skriv ut en snygg sammanfattning i terminalen
 */
export function printDailySummary(summary: DailySummary): void {
  console.log(`\n═══ Daglig rapport: ${summary.date} ═══\n`);
  console.log(`Kontrollerade sidor: ${summary.totalChecks}`);
  console.log(`Ändringar: ${summary.changesDetected}`);

  if (summary.significantChanges.length > 0) {
    console.log('\nSignifikanta ändringar:');
    for (const entry of summary.significantChanges) {
      const imp = entry.analysis?.importance ?? '?';
      console.log(`  [${imp}/10] ${entry.name}: ${entry.analysis?.summary}`);
    }
  }

  if (summary.noChangeUrls.length > 0) {
    console.log(`\nIngen ändring: ${summary.noChangeUrls.join(', ')}`);
  }
}

/**
 * Exportera historik som JSON (för integration med andra verktyg)
 */
export function exportHistory(format: 'json' | 'csv' = 'json'): string {
  const history = loadHistory();

  if (format === 'csv') {
    const header = 'timestamp,url,name,changePercent,importance,summary';
    const rows = history.map(e => {
      const imp = e.analysis?.importance ?? '';
      const summary = (e.analysis?.summary ?? '').replace(/,/g, ';');
      return `${e.timestamp},${e.url},${e.name},${e.changePercent.toFixed(2)},${imp},"${summary}"`;
    });
    return [header, ...rows].join('\n');
  }

  return JSON.stringify(history, null, 2);
}
