import 'dotenv/config';
import { takeScreenshot } from './shared/screenshot';
import { compareScreenshots } from './shared/diff';
import { analyzeChange } from './shared/vision';
import { dispatchNotifications } from './shared/integrations';
import { saveHistoryEntry } from './shared/history';
import { loadTargets, WatchTarget } from './shared/config';
import { archiveScreenshots } from './shared/storage';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = './data/screenshots';

async function checkTarget(target: WatchTarget): Promise<void> {
  console.log(`\nKollar: ${target.name} (${target.url})`);

  if (!target.active) {
    console.log('  → Inaktiv, hoppar över.');
    return;
  }

  const slug = target.url.replace(/[^a-z0-9]/gi, '_');
  const suffix = target.mobile ? '_mobile' : '';
  const beforePath = path.join(DATA_DIR, `${slug}${suffix}_before.png`);
  const afterPath = path.join(DATA_DIR, `${slug}${suffix}_after.png`);
  const diffPath = path.join(DATA_DIR, `${slug}${suffix}_diff.png`);

  // Första körningen — spara baseline
  if (!fs.existsSync(beforePath)) {
    console.log('  → Ingen baseline finns. Sparar baseline...');
    await takeScreenshot(target.url, beforePath, {
      selector: target.selector,
      mobile: target.mobile,
      headers: target.headers,
      cookies: target.cookies,
      waitForSelector: target.waitForSelector,
    });
    console.log('  → Baseline sparad. Kör igen senare för att se ändringar.');
    return;
  }

  // Ta ny skärmdump
  await takeScreenshot(target.url, afterPath, {
    selector: target.selector,
    mobile: target.mobile,
    headers: target.headers,
    cookies: target.cookies,
    waitForSelector: target.waitForSelector,
  });

  // Jämför pixlar
  const diff = await compareScreenshots(beforePath, afterPath, diffPath);
  console.log(`  → Förändring: ${diff.changePercent.toFixed(2)}%`);

  if (diff.changePercent > target.threshold) {
    console.log('  → Förändring detekterad! Analyserar med GPT-4o Vision...');

    const analysis = await analyzeChange(beforePath, afterPath, target.url);

    console.log(`  → Sammanfattning: ${analysis.summary}`);
    console.log(`  → Importance: ${analysis.importance}/10`);
    console.log(`  → Ändrade element: ${analysis.changedElements.join(', ')}`);

    // Spara till historik
    saveHistoryEntry({
      timestamp: new Date().toISOString(),
      url: target.url,
      name: target.name,
      changePercent: diff.changePercent,
      analysis,
      beforeScreenshot: beforePath,
      afterScreenshot: afterPath,
    });

    // Skicka notiser till alla konfigurerade integrationer
    if (analysis.importance >= target.minImportance) {
      await dispatchNotifications(
        target.url, target.name, analysis, diff.changePercent,
        target.notifySlack, target.notifyEmail
      );
    }
  } else {
    console.log('  → Ingen signifikant förändring.');

    // Logga även icke-ändringar i historiken
    saveHistoryEntry({
      timestamp: new Date().toISOString(),
      url: target.url,
      name: target.name,
      changePercent: diff.changePercent,
      analysis: null,
      beforeScreenshot: beforePath,
      afterScreenshot: afterPath,
    });
  }

  // Rotera: efter blir ny baseline
  if (fs.existsSync(afterPath)) {
    fs.copyFileSync(afterPath, beforePath);
  }
}

async function runCheck() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const targets = loadTargets();
  if (targets.length === 0) {
    console.log('Inga URLs att bevaka. Lägg till med: npm run cli -- add <url> <namn>');
    return;
  }

  console.log(`Startar bevakning av ${targets.length} sidor...`);

  for (const target of targets) {
    await checkTarget(target);
  }

  // Arkivera screenshots och rensa gamla (behåll 7 dagar)
  archiveScreenshots(7);

  console.log('\nKlart!');
}

runCheck().catch(console.error);
