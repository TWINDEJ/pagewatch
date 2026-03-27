import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface ChangeRow {
  url: string;
  name: string;
  summary: string | null;
  importance: number | null;
  change_percent: number;
  checked_at: string;
}

interface UserDigest {
  email: string;
  changes: ChangeRow[];
  totalUrls: number;
}

async function getUsersWithDigest(): Promise<UserDigest[]> {
  // Get all users who have weekly_digest enabled
  const users = await db.execute({
    sql: `SELECT u.id, u.email FROM users u WHERE u.weekly_digest = 1 AND u.email IS NOT NULL`,
    args: []
  });

  const digests: UserDigest[] = [];

  for (const user of users.rows) {
    // Get changes from the past 7 days with a summary (significant changes only)
    const changes = await db.execute({
      sql: `SELECT url, name, summary, importance, change_percent, checked_at
            FROM change_history
            WHERE user_id = ? AND summary IS NOT NULL AND checked_at >= datetime('now', '-7 days')
            ORDER BY importance DESC, checked_at DESC`,
      args: [user.id]
    });

    const totalUrls = await db.execute({
      sql: `SELECT COUNT(*) as count FROM watched_urls WHERE user_id = ? AND active = 1`,
      args: [user.id]
    });

    digests.push({
      email: user.email as string,
      changes: changes.rows as unknown as ChangeRow[],
      totalUrls: Number(totalUrls.rows[0].count),
    });
  }

  return digests;
}

function buildDigestHtml(digest: UserDigest): string {
  const { changes, totalUrls } = digest;
  const changedPages = new Set(changes.map(c => c.name)).size;
  const topChange = changes[0];

  const changeRows = changes.slice(0, 10).map(c => {
    const imp = c.importance ?? 0;
    const color = imp >= 7 ? '#ef4444' : imp >= 4 ? '#f97316' : '#22c55e';
    const date = new Date(c.checked_at + 'Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${imp}/10</span>
            <strong style="color: #f1f5f9;">${c.name}</strong>
          </div>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">${c.summary}</p>
          <span style="color: #475569; font-size: 12px;">${date}</span>
        </td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #06080f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #f1f5f9; font-size: 24px; margin: 0;">
        change<span style="color: #60a5fa;">brief</span>
      </h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">Weekly Digest</p>
    </div>

    <!-- Summary card -->
    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #f1f5f9; font-size: 18px; margin: 0 0 16px;">This week at a glance</h2>
      <div style="display: flex; gap: 24px;">
        <div>
          <div style="color: #60a5fa; font-size: 28px; font-weight: 700;">${changes.length}</div>
          <div style="color: #64748b; font-size: 13px;">changes detected</div>
        </div>
        <div>
          <div style="color: #60a5fa; font-size: 28px; font-weight: 700;">${changedPages}</div>
          <div style="color: #64748b; font-size: 13px;">pages changed</div>
        </div>
        <div>
          <div style="color: #60a5fa; font-size: 28px; font-weight: 700;">${totalUrls}</div>
          <div style="color: #64748b; font-size: 13px;">pages monitored</div>
        </div>
      </div>
    </div>

    ${changes.length === 0 ? `
    <!-- No changes -->
    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 32px; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">No significant changes detected this week. Your monitored pages are stable.</p>
    </div>
    ` : `
    <!-- Top change highlight -->
    ${topChange ? `
    <div style="background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1)); border: 1px solid rgba(99,102,241,0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <div style="color: #818cf8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Most important change</div>
      <p style="color: #f1f5f9; font-size: 15px; margin: 0; line-height: 1.5;"><strong>${topChange.name}:</strong> ${topChange.summary}</p>
    </div>
    ` : ''}

    <!-- All changes -->
    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden;">
      <div style="padding: 16px; border-bottom: 1px solid #1e293b;">
        <h3 style="color: #f1f5f9; font-size: 14px; margin: 0;">All changes this week (ranked by importance)</h3>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${changeRows}
      </table>
      ${changes.length > 10 ? `<div style="padding: 12px 16px; text-align: center;"><a href="https://app.changebrief.io/dashboard" style="color: #60a5fa; font-size: 13px; text-decoration: none;">View all ${changes.length} changes →</a></div>` : ''}
    </div>
    `}

    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://app.changebrief.io/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Dashboard</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #1e293b;">
      <p style="color: #475569; font-size: 12px; margin: 0;">
        You're receiving this because you have weekly digest enabled.
        <a href="https://app.changebrief.io/dashboard" style="color: #60a5fa; text-decoration: none;">Manage settings</a>
      </p>
      <p style="color: #334155; font-size: 11px; margin: 8px 0 0;">&copy; 2026 changebrief</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendDigestEmail(email: string, html: string, changeCount: number) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`  → Skipped (no RESEND_API_KEY): ${email}`);
    return;
  }

  const subject = changeCount > 0
    ? `Your weekly digest: ${changeCount} change${changeCount === 1 ? '' : 's'} detected`
    : 'Your weekly digest: all pages stable';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'changebrief <digest@changebrief.io>',
      reply_to: 'kristian@changebrief.io',
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  → Digest email failed for ${email}: ${response.status} ${err}`);
  } else {
    console.log(`  → Digest sent to ${email} (${changeCount} changes)`);
  }
}

async function main() {
  console.log('Generating weekly digests...\n');

  const digests = await getUsersWithDigest();
  console.log(`Found ${digests.length} users with digest enabled.`);

  for (const digest of digests) {
    const html = buildDigestHtml(digest);
    await sendDigestEmail(digest.email, html, digest.changes.length);
  }

  console.log('\nDone!');
}

main().catch(console.error);
