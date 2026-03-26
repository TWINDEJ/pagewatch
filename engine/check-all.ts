import 'dotenv/config';
import { createClient } from '@libsql/client';
import { takeScreenshot } from '../shared/screenshot';
import { compareScreenshots, compareStructured } from '../shared/diff';
import { analyzeChange, shouldAnalyze } from '../shared/vision';
import { sendEmailNotification, sendSlackNotification } from '../shared/notify';
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
      notify_email INTEGER DEFAULT 1,
      slack_webhook_url TEXT,
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
  // Add columns if they don't exist (migration)
  for (const col of [
    'ALTER TABLE users ADD COLUMN notify_email INTEGER DEFAULT 1',
    'ALTER TABLE users ADD COLUMN slack_webhook_url TEXT',
    'ALTER TABLE watched_urls ADD COLUMN last_checked_at TEXT',
    'ALTER TABLE watched_urls ADD COLUMN last_error TEXT',
    'ALTER TABLE watched_urls ADD COLUMN consecutive_errors INTEGER DEFAULT 0',
    'ALTER TABLE watched_urls ADD COLUMN cookies TEXT',
    'ALTER TABLE watched_urls ADD COLUMN headers TEXT',
    'ALTER TABLE users ADD COLUMN weekly_digest INTEGER DEFAULT 1',
  ]) {
    try { await db.execute(col); } catch { /* already exists */ }
  }
}

async function sendNotifications(row: any, analysis: any, diffPercent: number) {
  const { url, name, email, notify_email, slack_webhook_url, min_importance } = row;

  // Only notify if importance meets threshold
  if (analysis.importance < (min_importance ?? 5)) {
    console.log(`  → Importance ${analysis.importance} < threshold ${min_importance ?? 5}, skipping notifications`);
    return;
  }

  const promises: Promise<void>[] = [];

  // Email notification
  if (notify_email && email) {
    promises.push(sendEmailNotification(email, name, url, analysis));
  }

  // Slack notification (per-user webhook URL)
  if (slack_webhook_url) {
    promises.push(sendSlackNotification(slack_webhook_url, url, name, analysis, diffPercent));
  }

  if (promises.length > 0) {
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`  → Notification failed: ${result.reason}`);
      }
    }
  }
}

async function checkUrl(row: any) {
  const { user_id, url, name, threshold, selector, mobile } = row;
  console.log(`\nChecking: ${name} (${url})`);

  // Parse cookies and headers from DB (stored as JSON strings)
  let cookies: Array<{name: string; value: string; domain: string}> | undefined;
  let headers: Record<string, string> | undefined;
  try {
    if (row.cookies) cookies = JSON.parse(row.cookies);
    if (row.headers) headers = JSON.parse(row.headers);
  } catch { /* invalid JSON, skip */ }

  const screenshotOpts = {
    selector: selector || undefined,
    mobile: !!mobile,
    cookies,
    headers,
  };

  const slug = url.replace(/[^a-z0-9]/gi, '_');
  const suffix = mobile ? '_mobile' : '';
  const beforePath = path.join(DATA_DIR, `${slug}${suffix}_before.png`);
  const afterPath = path.join(DATA_DIR, `${slug}${suffix}_after.png`);
  const diffPath = path.join(DATA_DIR, `${slug}${suffix}_diff.png`);
  const beforeJsonPath = beforePath.replace('.png', '.json');
  const afterJsonPath = afterPath.replace('.png', '.json');

  // First run — capture baseline
  if (!fs.existsSync(beforePath)) {
    console.log('  → No baseline. Capturing...');
    await takeScreenshot(url, beforePath, screenshotOpts);
    return;
  }

  // Take new screenshot + extract structure
  await takeScreenshot(url, afterPath, screenshotOpts);

  // Compare pixels
  const pixelDiff = await compareScreenshots(beforePath, afterPath, diffPath);
  console.log(`  → Pixel diff: ${pixelDiff.changePercent.toFixed(2)}%`);

  // Compare structured content
  let structuredDiff = null;
  if (fs.existsSync(beforeJsonPath) && fs.existsSync(afterJsonPath)) {
    structuredDiff = compareStructured(beforeJsonPath, afterJsonPath);
    if (structuredDiff.hasChanged) {
      console.log(`  → Content changed: ${structuredDiff.summary.split('\n')[0]}`);
    } else {
      console.log('  → Content: no structural changes');
    }
  }

  const effectiveThreshold = threshold ?? 0.3;
  const pixelTriggered = pixelDiff.changePercent > effectiveThreshold;
  const textTriggered = structuredDiff?.hasChanged ?? false;

  if (pixelTriggered || textTriggered) {
    // Pre-filter: är detta värt en full analys?
    let worthAnalyzing = pixelTriggered; // Pixel-diff alltid värt att analysera
    if (!worthAnalyzing && structuredDiff) {
      worthAnalyzing = await shouldAnalyze(structuredDiff);
    }

    if (worthAnalyzing) {
      console.log('  → Analyzing with GPT-4o Vision...');
      const analysis = await analyzeChange(
        beforePath,
        afterPath,
        url,
        structuredDiff?.summary
      );
      console.log(`  → ${analysis.summary} (${analysis.importance}/10)`);

      await db.execute({
        sql: `INSERT INTO change_history (user_id, url, name, change_percent, summary, importance, changed_elements, has_significant_change)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user_id, url, name, pixelDiff.changePercent,
          analysis.summary, analysis.importance,
          JSON.stringify(analysis.changedElements),
          analysis.hasSignificantChange ? 1 : 0
        ]
      });

      // Send notifications
      await sendNotifications(row, analysis, pixelDiff.changePercent);
    } else {
      console.log('  → Pre-filter: not worth full analysis, logging as minor.');
      await db.execute({
        sql: `INSERT INTO change_history (user_id, url, name, change_percent, has_significant_change)
              VALUES (?, ?, ?, ?, 0)`,
        args: [user_id, url, name, pixelDiff.changePercent]
      });
    }
  } else {
    console.log('  → No significant change.');
    await db.execute({
      sql: `INSERT INTO change_history (user_id, url, name, change_percent, has_significant_change)
            VALUES (?, ?, ?, ?, 0)`,
      args: [user_id, url, name, pixelDiff.changePercent]
    });
  }

  // Rotate baselines
  if (fs.existsSync(afterPath)) {
    fs.copyFileSync(afterPath, beforePath);
  }
  if (fs.existsSync(afterJsonPath)) {
    fs.copyFileSync(afterJsonPath, beforeJsonPath);
  }

  // Mark success
  await db.execute({
    sql: 'UPDATE watched_urls SET last_checked_at = datetime(\'now\'), last_error = NULL, consecutive_errors = 0 WHERE id = ?',
    args: [row.id]
  });
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  await initSchema();

  const result = await db.execute({
    sql: 'SELECT wu.*, u.email, u.plan, u.notify_email, u.slack_webhook_url FROM watched_urls wu JOIN users u ON wu.user_id = u.id WHERE wu.active = 1',
    args: []
  });

  if (result.rows.length === 0) {
    console.log('No active URLs to check.');
    return;
  }

  console.log(`Checking ${result.rows.length} URLs...`);

  for (const row of result.rows) {
    try {
      await checkUrl(row);
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      const consecutive = (Number(row.consecutive_errors) || 0) + 1;
      console.error(`  → Error checking ${row.url} (${consecutive}x): ${errorMsg}`);

      // Save error status
      await db.execute({
        sql: 'UPDATE watched_urls SET last_checked_at = datetime(\'now\'), last_error = ?, consecutive_errors = ? WHERE id = ?',
        args: [errorMsg.slice(0, 500), consecutive, row.id]
      });

      // Notify user after 3 consecutive failures
      if (consecutive === 3 && row.notify_email && row.email) {
        await sendEmailNotification(
          row.email as string,
          row.name as string,
          row.url as string,
          { summary: `This page has failed 3 checks in a row: ${errorMsg}`, importance: 6, changedElements: ['Page unreachable'], hasSignificantChange: false }
        );
      }
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
