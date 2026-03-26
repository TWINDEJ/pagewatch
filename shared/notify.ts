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
      text: { type: 'plain_text', text: `${emoji} Ändring på ${name}`, emoji: true }
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
        { type: 'mrkdwn', text: `*Ändrade element:* ${analysis.changedElements.join(', ') || 'N/A'}` },
        { type: 'mrkdwn', text: `*URL:* <${url}|Öppna sidan>` }
      ]
    }
  ];

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks })
  });

  if (!response.ok) {
    console.error(`Slack-notis misslyckades: ${response.status} ${response.statusText}`);
  } else {
    console.log('  → Slack-notis skickad!');
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
  const color = analysis.importance >= 7 ? 'FF0000' : analysis.importance >= 4 ? 'FFA500' : '00FF00';

  // Adaptive Card för Teams Workflows (ny webhook-typ)
  const card = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: `Ändring på ${name}`,
            weight: 'Bolder',
            size: 'Large',
            color: analysis.importance >= 7 ? 'Attention' : 'Default'
          },
          {
            type: 'TextBlock',
            text: analysis.summary,
            wrap: true
          },
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'auto',
                items: [{ type: 'TextBlock', text: `**Importance:** ${analysis.importance}/10`, wrap: true }]
              },
              {
                type: 'Column',
                width: 'auto',
                items: [{ type: 'TextBlock', text: `**Pixel diff:** ${diffPercent.toFixed(2)}%`, wrap: true }]
              }
            ]
          },
          {
            type: 'TextBlock',
            text: `**Ändrade element:** ${analysis.changedElements.join(', ') || 'N/A'}`,
            wrap: true
          }
        ],
        actions: [
          {
            type: 'Action.OpenUrl',
            title: 'Öppna sidan',
            url: url
          }
        ]
      }
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
  });

  if (!response.ok) {
    console.error(`Teams-notis misslyckades: ${response.status} ${response.statusText}`);
  } else {
    console.log('  → Teams-notis skickad!');
  }
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
      title: `Ändring på ${name}`,
      description: analysis.summary,
      color,
      fields: [
        { name: 'Importance', value: `${analysis.importance}/10`, inline: true },
        { name: 'Pixel diff', value: `${diffPercent.toFixed(2)}%`, inline: true },
        { name: 'Ändrade element', value: analysis.changedElements.join(', ') || 'N/A' },
        { name: 'URL', value: url }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(embed)
  });

  if (!response.ok) {
    console.error(`Discord-notis misslyckades: ${response.status} ${response.statusText}`);
  } else {
    console.log('  → Discord-notis skickad!');
  }
}

// ─── PagerDuty ───

export async function sendPagerDutyAlert(
  routingKey: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const severity = analysis.importance >= 8 ? 'critical'
    : analysis.importance >= 6 ? 'error'
    : analysis.importance >= 4 ? 'warning'
    : 'info';

  const payload = {
    routing_key: routingKey,
    event_action: 'trigger',
    payload: {
      summary: `[Pagewatch] ${name}: ${analysis.summary}`,
      severity,
      source: 'pagewatch',
      component: name,
      custom_details: {
        url,
        importance: analysis.importance,
        diffPercent: diffPercent.toFixed(2),
        changedElements: analysis.changedElements,
        summary: analysis.summary
      }
    },
    links: [{ href: url, text: 'Öppna sidan' }]
  };

  const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error(`PagerDuty-alert misslyckades: ${response.status} ${response.statusText}`);
  } else {
    console.log('  → PagerDuty-alert skickad!');
  }
}

// ─── Jira (skapa ärende) ───

export async function createJiraIssue(
  baseUrl: string,   // t.ex. https://company.atlassian.net
  email: string,
  apiToken: string,
  projectKey: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  const issue = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: 'Task' },
      summary: `[Pagewatch] Ändring på ${name} (${analysis.importance}/10)`,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: analysis.summary }]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'URL: ' },
              { type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }
            ]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: `Importance: ${analysis.importance}/10 | Pixel diff: ${diffPercent.toFixed(2)}% | Element: ${analysis.changedElements.join(', ')}` }]
          }
        ]
      },
      labels: ['pagewatch', `importance-${analysis.importance}`]
    }
  };

  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(issue)
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Jira-ärende misslyckades: ${response.status} ${body}`);
  } else {
    const data = await response.json() as { key: string };
    console.log(`  → Jira-ärende skapat: ${data.key}`);
  }
}

// ─── Generic Webhook (Zapier, Make, n8n, egna system) ───

export async function sendGenericWebhook(
  webhookUrl: string,
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number
): Promise<void> {
  const event = buildChangeEvent(url, name, analysis, diffPercent);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    console.error(`Webhook misslyckades: ${response.status} ${response.statusText}`);
  } else {
    console.log('  → Webhook skickad!');
  }
}

// ─── Email (placeholder) ───

export async function sendEmailNotification(
  to: string,
  name: string,
  url: string,
  analysis: ChangeAnalysis
): Promise<void> {
  // Placeholder — koppla till Resend, SendGrid, etc.
  console.log(`  → [EMAIL] Till: ${to} | ${name}: ${analysis.summary}`);
}
