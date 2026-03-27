import { createClient, type Client } from '@libsql/client';

let client: Client;

function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

// ─── Schema initialization ───

export async function initDb() {
  const db = getDb();
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

  // Add columns if they don't exist (migration for existing DBs)
  for (const col of [
    'ALTER TABLE users ADD COLUMN notify_email INTEGER DEFAULT 1',
    'ALTER TABLE users ADD COLUMN slack_webhook_url TEXT',
    'ALTER TABLE watched_urls ADD COLUMN last_checked_at TEXT',
    'ALTER TABLE watched_urls ADD COLUMN last_error TEXT',
    'ALTER TABLE watched_urls ADD COLUMN consecutive_errors INTEGER DEFAULT 0',
    'ALTER TABLE watched_urls ADD COLUMN cookies TEXT',
    'ALTER TABLE watched_urls ADD COLUMN headers TEXT',
    'ALTER TABLE users ADD COLUMN weekly_digest INTEGER DEFAULT 1',
    'ALTER TABLE watched_urls ADD COLUMN muted INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN checks_this_month INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN checks_month TEXT',
    'ALTER TABLE users ADD COLUMN digest_frequency TEXT DEFAULT \'weekly\'',
    'ALTER TABLE watched_urls ADD COLUMN webhook_url TEXT',
  ]) {
    try { await db.execute(col); } catch { /* column already exists */ }
  }
}

// ─── Users ───

export async function getOrCreateUser(email: string, name?: string, image?: string) {
  const db = getDb();
  await initDb();
  const existing = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  if (existing.rows.length > 0) return existing.rows[0];

  const id = crypto.randomUUID();
  await db.execute({ sql: 'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)', args: [id, email, name ?? null, image ?? null] });
  return { id, email, plan: 'free' };
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  await initDb();
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  return result.rows[0] ?? null;
}

export async function getUserByPolarCustomerId(polarCustomerId: string) {
  const db = getDb();
  await initDb();
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE polar_customer_id = ?', args: [polarCustomerId] });
  return result.rows[0] ?? null;
}

export async function updateUserPlan(userId: string, plan: string) {
  await getDb().execute({ sql: 'UPDATE users SET plan = ? WHERE id = ?', args: [plan, userId] });
}

export async function updateUserPolarId(userId: string, polarCustomerId: string) {
  await getDb().execute({ sql: 'UPDATE users SET polar_customer_id = ? WHERE id = ?', args: [polarCustomerId, userId] });
}

export async function updateUserSettings(userId: string, settings: { notifyEmail?: boolean; slackWebhookUrl?: string | null; weeklyDigest?: boolean; digestFrequency?: string }) {
  const updates: string[] = [];
  const args: any[] = [];

  if (settings.notifyEmail !== undefined) {
    updates.push('notify_email = ?');
    args.push(settings.notifyEmail ? 1 : 0);
  }
  if (settings.slackWebhookUrl !== undefined) {
    updates.push('slack_webhook_url = ?');
    args.push(settings.slackWebhookUrl);
  }
  if (settings.weeklyDigest !== undefined) {
    updates.push('weekly_digest = ?');
    args.push(settings.weeklyDigest ? 1 : 0);
  }
  if (settings.digestFrequency !== undefined) {
    updates.push('digest_frequency = ?');
    args.push(settings.digestFrequency);
  }

  if (updates.length === 0) return;
  args.push(userId);
  await getDb().execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });
}

// ─── Watched URLs ───

export async function getWatchedUrls(userId: string) {
  const result = await getDb().execute({
    sql: `SELECT wu.*,
            ch.summary as last_summary,
            ch.importance as last_importance,
            ch.checked_at as last_change_at
          FROM watched_urls wu
          LEFT JOIN change_history ch ON ch.id = (
            SELECT id FROM change_history
            WHERE user_id = wu.user_id AND url = wu.url AND has_significant_change = 1
            ORDER BY checked_at DESC LIMIT 1
          )
          WHERE wu.user_id = ?
          ORDER BY wu.created_at DESC`,
    args: [userId]
  });
  return result.rows;
}

export async function addWatchedUrl(userId: string, url: string, name: string, options?: { threshold?: number; selector?: string; mobile?: boolean; minImportance?: number; cookies?: string; headers?: string; webhookUrl?: string }) {
  await getDb().execute({
    sql: 'INSERT INTO watched_urls (user_id, url, name, threshold, selector, mobile, min_importance, cookies, headers, webhook_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      userId, url, name,
      options?.threshold ?? 0.3,
      options?.selector ?? null,
      options?.mobile ? 1 : 0,
      options?.minImportance ?? 5,
      options?.cookies ?? null,
      options?.headers ?? null,
      options?.webhookUrl ?? null,
    ]
  });
}

export async function removeWatchedUrl(userId: string, urlId: number) {
  await getDb().execute({ sql: 'DELETE FROM watched_urls WHERE id = ? AND user_id = ?', args: [urlId, userId] });
}

export async function countWatchedUrls(userId: string): Promise<number> {
  const result = await getDb().execute({ sql: 'SELECT COUNT(*) as count FROM watched_urls WHERE user_id = ?', args: [userId] });
  return Number(result.rows[0].count);
}

export async function muteUrl(userId: string, urlId: number, muted: boolean) {
  await getDb().execute({
    sql: 'UPDATE watched_urls SET muted = ? WHERE id = ? AND user_id = ?',
    args: [muted ? 1 : 0, urlId, userId],
  });
}

// ─── All URLs (for cron job) ───

export async function getAllActiveUrls() {
  const result = await getDb().execute({
    sql: 'SELECT wu.*, u.email, u.plan, u.notify_email, u.slack_webhook_url FROM watched_urls wu JOIN users u ON wu.user_id = u.id WHERE wu.active = 1 AND (wu.muted IS NULL OR wu.muted = 0)',
    args: []
  });
  return result.rows;
}

// ─── Change History ───

export async function addChangeRecord(userId: string, record: {
  url: string; name: string; changePercent: number;
  summary?: string; importance?: number; changedElements?: string[];
  hasSignificantChange?: boolean;
}) {
  await getDb().execute({
    sql: 'INSERT INTO change_history (user_id, url, name, change_percent, summary, importance, changed_elements, has_significant_change) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      userId, record.url, record.name, record.changePercent,
      record.summary ?? null, record.importance ?? null,
      record.changedElements ? JSON.stringify(record.changedElements) : null,
      record.hasSignificantChange ? 1 : 0
    ]
  });
}

export async function getChangeHistory(userId: string, limit = 50) {
  const result = await getDb().execute({ sql: 'SELECT * FROM change_history WHERE user_id = ? ORDER BY checked_at DESC LIMIT ?', args: [userId, limit] });
  return result.rows;
}

export async function deleteChangeHistoryByUrl(userId: string, url: string) {
  await getDb().execute({ sql: 'DELETE FROM change_history WHERE user_id = ? AND url = ?', args: [userId, url] });
}

// ─── URL status updates (for engine) ───

export async function updateUrlStatus(urlId: number, status: { lastCheckedAt: string; lastError?: string | null; consecutiveErrors?: number }) {
  await getDb().execute({
    sql: 'UPDATE watched_urls SET last_checked_at = ?, last_error = ?, consecutive_errors = ? WHERE id = ?',
    args: [status.lastCheckedAt, status.lastError ?? null, status.consecutiveErrors ?? 0, urlId]
  });
}

// ─── Dashboard stats ───

export async function getDashboardStats(userId: string) {
  const db = getDb();
  const [significantResult, totalResult, lastCheckResult] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(*) as count FROM change_history
            WHERE user_id = ? AND has_significant_change = 1
            AND checked_at >= datetime('now', '-7 days')`,
      args: [userId]
    }),
    db.execute({
      sql: `SELECT COUNT(*) as count FROM change_history
            WHERE user_id = ? AND checked_at >= datetime('now', '-7 days')`,
      args: [userId]
    }),
    db.execute({
      sql: `SELECT COALESCE(
              (SELECT MAX(last_checked_at) FROM watched_urls WHERE user_id = ?),
              (SELECT MAX(checked_at) FROM change_history WHERE user_id = ?)
            ) as last_check`,
      args: [userId, userId]
    }),
  ]);
  return {
    significantChanges7d: Number(significantResult.rows[0].count),
    totalChecks7d: Number(totalResult.rows[0].count),
    lastCheck: (lastCheckResult.rows[0] as any)?.last_check as string | null,
  };
}

// ─── Plan limits ───

export function getUrlLimit(plan: string): number {
  switch (plan) {
    case 'pro': return 25;
    case 'team': return 100;
    default: return 3;
  }
}

export function getCheckLimit(plan: string): number {
  switch (plan) {
    case 'pro': return 2000;
    case 'team': return 10000;
    default: return 100;
  }
}

// ─── Monthly check counter ───

export async function getMonthlyCheckCount(userId: string): Promise<number> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const result = await db.execute({
    sql: 'SELECT checks_this_month, checks_month FROM users WHERE id = ?',
    args: [userId],
  });
  const row = result.rows[0];
  if (!row) return 0;

  // Reset if month changed
  if (row.checks_month !== currentMonth) {
    await db.execute({
      sql: 'UPDATE users SET checks_this_month = 0, checks_month = ? WHERE id = ?',
      args: [currentMonth, userId],
    });
    return 0;
  }
  return Number(row.checks_this_month) || 0;
}

export async function incrementCheckCount(userId: string): Promise<void> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);
  await db.execute({
    sql: `UPDATE users SET checks_this_month = CASE WHEN checks_month = ? THEN checks_this_month + 1 ELSE 1 END, checks_month = ? WHERE id = ?`,
    args: [currentMonth, currentMonth, userId],
  });
}
