import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = './data/screenshots';
const ARCHIVE_DIR = './data/archive';

/**
 * Arkiverar dagens screenshots med datumstämpel.
 * Behåller senaste N dagar, raderar äldre.
 */
export function archiveScreenshots(retentionDays = 7): void {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const todayDir = path.join(ARCHIVE_DIR, today);
  fs.mkdirSync(todayDir, { recursive: true });

  // Kopiera alla _after.png till arkiv
  if (!fs.existsSync(SCREENSHOT_DIR)) return;

  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('_after.png'));
  for (const file of files) {
    const src = path.join(SCREENSHOT_DIR, file);
    const dest = path.join(todayDir, file);
    fs.copyFileSync(src, dest);
  }

  // Rensa gamla arkiv
  const dirs = fs.readdirSync(ARCHIVE_DIR).sort();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  for (const dir of dirs) {
    if (dir < cutoffStr) {
      const fullPath = path.join(ARCHIVE_DIR, dir);
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`  Arkiv raderat: ${dir} (äldre än ${retentionDays} dagar)`);
    }
  }
}

/**
 * Lista arkiverade datum
 */
export function listArchiveDates(): string[] {
  if (!fs.existsSync(ARCHIVE_DIR)) return [];
  return fs.readdirSync(ARCHIVE_DIR).sort().reverse();
}
