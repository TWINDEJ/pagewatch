import { ChangeAnalysis } from './vision';

// ─── Gemensam payload som alla integrationer kan använda ───

export interface ChangeEvent {
  url: string;
  name: string;
  analysis: ChangeAnalysis;
  diffPercent: number;
  timestamp: string;
}

function buildChangeEvent(url: string, name: string, analysis: ChangeAnalysis, diffPercent: number): ChangeEvent {
  return { url, name, analysis, diffPercent, timestamp: new Date().toISOString() };
}

// ─── Email via Resend ───

export async function sendEmailNotification(
  to: string,
  name: string,
  url: string,
  analysis: ChangeAnalysis
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`  → [EMAIL] Skipped (no RESEND_API_KEY): ${to}`);
    return;
  }

  const emoji = analysis.importance >= 7 ? '🔴' : analysis.importance >= 4 ? '🟡' : '🟢';
  const elements = analysis.changedElements.length > 0
    ? analysis.changedElements.map(el => `<li>${el}</li>`).join('')
    : '<li>N/A</li>';

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">${emoji} Change detected: ${name}</h2>
      <p style="font-size: 16px; color: #1e293b;">${analysis.summary}</p>
      <table style="margin: 16px 0; font-size: 14px; color: #475569;">
        <tr><td style="padding-right: 16px;"><strong>Importance:</strong></td><td>${analysis.importance}/10</td></tr>
        <tr><td style="padding-right: 16px;"><strong>URL:</strong></td><td><a href="${url}">${url}</a></td></tr>
      </table>
      <p style="font-size: 14px; color: #475569;"><strong>Changed elements:</strong></p>
      <ul style="font-size: 14px; color: #475569;">${elements}</ul>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">Sent by <a href="https://changebrief.io" style="color: #3b82f6;">changebrief</a></p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'changebrief <notifications@changebrief.io>',
      reply_to: 'kristian@changebrief.io',
      to: [to],
      subject: `${emoji} ${name}: ${analysis.summary}`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  → Email failed: ${response.status} ${err}`);
  } else {
    console.log(`  → Email sent to ${to}`);
  }
}

// ─── Slack ───

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text: string }>;
  fields?: Array<{ type: string; text: string }>;
}

export async function sendSlackNotification(
  webhookUrl: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const emoji = analysis.importance >= 7 ? '🔴' : analysis.importance >= 4 ? '🟡' : '🟢';

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${emoji} Change on ${name}`, emoji: true }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${analysis.summary}*` }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Importance:* ${analysis.importance}/10` },
        { type: 'mrkdwn', text: `*Pixel diff:* ${diffPercent.toFixed(2)}%` },
        { type: 'mrkdwn', text: `*Changed elements:* ${analysis.changedElements.join(', ') || 'N/A'}` },
        { type: 'mrkdwn', text: `*URL:* <${url}|Open page>` }
      ]
    }
  ];

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks })
  });

  if (!response.ok) {
    console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
  } else {
    console.log('  → Slack notification sent!');
  }
}

// ─── Microsoft Teams ───

export async function sendTeamsNotification(
  webhookUrl: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const card = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', text: `Change on ${name}`, weight: 'Bolder', size: 'Large', color: analysis.importance >= 7 ? 'Attention' : 'Default' },
          { type: 'TextBlock', text: analysis.summary, wrap: true },
          {
            type: 'ColumnSet',
            columns: [
              { type: 'Column', width: 'auto', items: [{ type: 'TextBlock', text: `**Importance:** ${analysis.importance}/10`, wrap: true }] },
              { type: 'Column', width: 'auto', items: [{ type: 'TextBlock', text: `**Pixel diff:** ${diffPercent.toFixed(2)}%`, wrap: true }] }
            ]
          },
          { type: 'TextBlock', text: `**Changed elements:** ${analysis.changedElements.join(', ') || 'N/A'}`, wrap: true }
        ],
        actions: [{ type: 'Action.OpenUrl', title: 'Open page', url }]
      }
    }]
  };

  const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
  if (!response.ok) console.error(`Teams notification failed: ${response.status}`);
  else console.log('  → Teams notification sent!');
}

// ─── Discord ───

export async function sendDiscordNotification(
  webhookUrl: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const color = analysis.importance >= 7 ? 0xFF0000 : analysis.importance >= 4 ? 0xFFA500 : 0x00FF00;

  const embed = {
    embeds: [{
      title: `Change on ${name}`,
      description: analysis.summary,
      color,
      fields: [
        { name: 'Importance', value: `${analysis.importance}/10`, inline: true },
        { name: 'Pixel diff', value: `${diffPercent.toFixed(2)}%`, inline: true },
        { name: 'Changed elements', value: analysis.changedElements.join(', ') || 'N/A' },
        { name: 'URL', value: url }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(embed) });
  if (!response.ok) console.error(`Discord notification failed: ${response.status}`);
  else console.log('  → Discord notification sent!');
}

// ─── PagerDuty ───

export async function sendPagerDutyAlert(
  routingKey: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const severity = analysis.importance >= 8 ? 'critical' : analysis.importance >= 6 ? 'error' : analysis.importance >= 4 ? 'warning' : 'info';

  const payload = {
    routing_key: routingKey,
    event_action: 'trigger',
    payload: {
      summary: `[changebrief] ${name}: ${analysis.summary}`,
      severity,
      source: 'changebrief',
      component: name,
      custom_details: { url, importance: analysis.importance, diffPercent: diffPercent.toFixed(2), changedElements: analysis.changedElements, summary: analysis.summary }
    },
    links: [{ href: url, text: 'Open page' }]
  };

  const response = await fetch('https://events.pagerduty.com/v2/enqueue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) console.error(`PagerDuty alert failed: ${response.status}`);
  else console.log('  → PagerDuty alert sent!');
}

// ─── Jira ───

export async function createJiraIssue(
  baseUrl: string, email: string, apiToken: string, projectKey: string,
  url: string, name: string, analysis: ChangeAnalysis, diffPercent: number
): Promise<void> {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const issue = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: 'Task' },
      summary: `[changebrief] Change on ${name} (${analysis.importance}/10)`,
      description: { type: 'doc', version: 1, content: [
        { type: 'paragraph', content: [{ type: 'text', text: analysis.summary }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'URL: ' }, { type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }] },
      ]},
      labels: ['changebrief', `importance-${analysis.importance}`]
    }
  };

  const response = await fetch(`${baseUrl}/rest/api/3/issue`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` }, body: JSON.stringify(issue) });
  if (!response.ok) console.error(`Jira issue failed: ${response.status}`);
  else { const data = await response.json() as { key: string }; console.log(`  → Jira issue created: ${data.key}`); }
}

// ─── Per-URL Webhook (Pro+ feature) ───

export async function sendWebhookNotification(
  webhookUrl: string, url: string, name: string, analysis: ChangeAnalysis, diffPercent: number
): Promise<void> {
  const payload = {
    event: 'change.detected',
    url, name,
    summary: analysis.summary,
    importance: analysis.importance,
    changedElements: analysis.changedElements,
    changePercent: diffPercent,
    timestamp: new Date().toISOString(),
  };
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'changebrief/1.0' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error(`  → Webhook failed: ${response.status} ${webhookUrl}`);
  } else {
    console.log(`  → Webhook sent to ${webhookUrl}`);
  }
}

// ─── Generic Webhook ───

export async function sendGenericWebhook(
  webhookUrl: string, url: string, name: string, analysis: ChangeAnalysis, diffPercent: number
): Promise<void> {
  const event = buildChangeEvent(url, name, analysis, diffPercent);
  const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
  if (!response.ok) console.error(`Webhook failed: ${response.status}`);
  else console.log('  → Webhook sent!');
}
