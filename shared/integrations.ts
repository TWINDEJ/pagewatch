import * as fs from 'fs';
import * as path from 'path';
import { ChangeAnalysis } from './vision';
import {
  sendSlackNotification,
  sendTeamsNotification,
  sendDiscordNotification,
  sendPagerDutyAlert,
  createJiraIssue,
  sendGenericWebhook,
  sendEmailNotification,
} from './notify';

// ─── Global integrations config ───

export interface IntegrationsConfig {
  slack?: { webhookUrl: string };
  teams?: { webhookUrl: string };
  discord?: { webhookUrl: string };
  pagerduty?: { routingKey: string; minImportance: number };
  jira?: { baseUrl: string; email: string; apiToken: string; projectKey: string; minImportance: number };
  webhooks?: Array<{ url: string; name: string }>;
  email?: { to: string };
}

const CONFIG_FILE = path.join('data', 'integrations.json');

export function loadIntegrations(): IntegrationsConfig {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveIntegrations(config: IntegrationsConfig): void {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ─── Dispatcher: skickar till alla konfigurerade integrationer ───

export async function dispatchNotifications(
  url: string,
  name: string,
  analysis: ChangeAnalysis,
  diffPercent: number,
  perUrlSlack: boolean,  // om URL:en har notifySlack: true
  perUrlEmail?: string
): Promise<void> {
  const config = loadIntegrations();
  const promises: Promise<void>[] = [];

  // Slack (global config eller per-URL)
  if (perUrlSlack && config.slack?.webhookUrl) {
    promises.push(sendSlackNotification(config.slack.webhookUrl, url, name, analysis, diffPercent));
  }
  // Fallback: kolla env-variabel
  if (perUrlSlack && !config.slack?.webhookUrl && process.env.SLACK_WEBHOOK_URL) {
    promises.push(sendSlackNotification(process.env.SLACK_WEBHOOK_URL, url, name, analysis, diffPercent));
  }

  // Microsoft Teams
  if (config.teams?.webhookUrl) {
    promises.push(sendTeamsNotification(config.teams.webhookUrl, url, name, analysis, diffPercent));
  }

  // Discord
  if (config.discord?.webhookUrl) {
    promises.push(sendDiscordNotification(config.discord.webhookUrl, url, name, analysis, diffPercent));
  }

  // PagerDuty (bara om importance >= minImportance)
  if (config.pagerduty?.routingKey && analysis.importance >= (config.pagerduty.minImportance ?? 7)) {
    promises.push(sendPagerDutyAlert(config.pagerduty.routingKey, url, name, analysis, diffPercent));
  }

  // Jira (skapa ärende om importance >= minImportance)
  if (config.jira && analysis.importance >= (config.jira.minImportance ?? 6)) {
    promises.push(createJiraIssue(
      config.jira.baseUrl, config.jira.email, config.jira.apiToken,
      config.jira.projectKey, url, name, analysis, diffPercent
    ));
  }

  // Generic webhooks (Zapier, Make, n8n, etc.)
  if (config.webhooks?.length) {
    for (const wh of config.webhooks) {
      promises.push(sendGenericWebhook(wh.url, url, name, analysis, diffPercent));
    }
  }

  // Email
  if (perUrlEmail) {
    promises.push(sendEmailNotification(perUrlEmail, name, url, analysis));
  } else if (config.email?.to) {
    promises.push(sendEmailNotification(config.email.to, name, url, analysis));
  }

  // Kör alla parallellt
  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(`  → Integration misslyckades: ${result.reason}`);
    }
  }
}
