import 'dotenv/config';
import { createClient } from '@libsql/client';
import { takeScreenshot } from '../shared/screenshot';
import { compareScreenshots } from '../shared/diff';
import { analyzeChange } from '../shared/vision';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = './data/screenshots';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initSchema() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      plan TEXT DEFAULT 'free',
      polar_customer_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS watched_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      url TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      threshold REAL DEFAULT 0.3,
      selector TEXT,
      mobile INTEGER DEFAULT 0,
      min_importance INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, url)
    );
    CREATE TABLE IF NOT EXISTS change_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      url TEXT NOT NULL,
      name TEXT NOT NULL,
      change_percent REAL NOT NULL,
      summary TEXT,
      importance INTEGER,
      changed_elements TEXT,
      has_significant_change INTEGER DEFAULT 0,
      before_screenshot TEXT,
      after_screenshot TEXT,
      checked_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function checkUrl(row: any) {
  const { user_id, url, name, threshold, selector, mobile } = row;
  console.log(`\nKollar: ${name} (${url})`);

  const slug = url.replace(/[^a-z0-9]/gi, '_');
  const suffix = mobile ? '_mobile' : '';
  const beforePath = path.join(DATA_DIR, `${slug}${suffix}_before.png`);
  const afterPath = path.join(DATA_DIR, `${slug}${suffix}_after.png`);
  const diffPath = path.join(DATA_DIR, `${slug}${suffix}_diff.png`);

  // Första körningen — spara baseline
  if (!fs.existsSync(beforePath)) {
    console.log('  → Ingen baseline. Sparar...');
    await takeScreenshot(url, beforePath, {
      selector: selector || undefined,
      mobile: !!mobile,
    });
    return;
  }

  // Ta ny skärmdump
  await takeScreenshot(url, afterPath, {
    selector: selector || undefined,
    mobile: !!mobile,
  });

  // Jämför
  const diff = await compareScreenshots(beforePath, afterPath, diffPath);
  console.log(`  → Diff: ${diff.changePercent.toFixed(2)}%`);

  const effectiveThreshold = threshold ?? 0.3;

  if (diff.changePercent > effectiveThreshold) {
    console.log('  → Analyserar med GPT-4o Vision...');
    const analysis = await analyzeChange(beforePath, afterPath, url);
    console.log(`  → ${analysis.summary} (${analysis.importance}/10)`);

    await db.execute({
      sql: `INSERT INTO change_history (user_id, url, name, change_percent, summary, importance, changed_elements, has_significant_change)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user_id, url, name, diff.changePercent,
        analysis.summary, analysis.importance,
        JSON.stringify(analysis.changedElements),
        analysis.hasSignificantChange ? 1 : 0
      ]
    });
  } else {
    console.log('  → Ingen signifikant ändring.');
    await db.execute({
      sql: `INSERT INTO change_history (user_id, url, name, change_percent, has_significant_change)
            VALUES (?, ?, ?, ?, 0)`,
      args: [user_id, url, name, diff.changePercent]
    });
  }

  // Rotera
  if (fs.existsSync(afterPath)) {
    fs.copyFileSync(afterPath, beforePath);
  }
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  await initSchema();

  const result = await db.execute({
    sql: 'SELECT wu.*, u.email, u.plan FROM watched_urls wu JOIN users u ON wu.user_id = u.id WHERE wu.active = 1',
    args: []
  });

  if (result.rows.length === 0) {
    console.log('Inga aktiva URLs att kontrollera.');
    return;
  }

  console.log(`Kontrollerar ${result.rows.length} URLs...`);

  for (const row of result.rows) {
    try {
      await checkUrl(row);
    } catch (err) {
      console.error(`  → Fel vid ${row.url}: ${err}`);
    }
  }

  console.log('\nKlart!');
}

main().catch(console.error);
