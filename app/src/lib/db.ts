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

export async function updateUserPlan(userId: string, plan: string) {
  await getDb().execute({ sql: 'UPDATE users SET plan = ? WHERE id = ?', args: [plan, userId] });
}

// ─── Watched URLs ───

export async function getWatchedUrls(userId: string) {
  const result = await getDb().execute({ sql: 'SELECT * FROM watched_urls WHERE user_id = ? ORDER BY created_at DESC', args: [userId] });
  return result.rows;
}

export async function addWatchedUrl(userId: string, url: string, name: string, options?: { threshold?: number; selector?: string; mobile?: boolean; minImportance?: number }) {
  await getDb().execute({
    sql: 'INSERT INTO watched_urls (user_id, url, name, threshold, selector, mobile, min_importance) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      userId, url, name,
      options?.threshold ?? 0.3,
      options?.selector ?? null,
      options?.mobile ? 1 : 0,
      options?.minImportance ?? 5
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

// ─── All URLs (for cron job) ───

export async function getAllActiveUrls() {
  const result = await getDb().execute({ sql: 'SELECT wu.*, u.email, u.plan FROM watched_urls wu JOIN users u ON wu.user_id = u.id WHERE wu.active = 1', args: [] });
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

// ─── Plan limits ───

export function getUrlLimit(plan: string): number {
  switch (plan) {
    case 'pro': return 25;
    case 'team': return 100;
    default: return 3;
  }
}
