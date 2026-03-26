import 'dotenv/config';
import { addTarget, removeTarget, listTargets, loadTargets } from './shared/config';
import { getHistoryForUrl, printHistory, loadHistory } from './shared/history';
import { getDailySummary, printDailySummary, exportHistory } from './shared/report';
import { loadIntegrations, saveIntegrations, IntegrationsConfig } from './shared/integrations';

const [,, command, ...args] = process.argv;

function usage() {
  console.log(`
changebrief CLI

Kommandon:
  add <url> <namn> [--selector=".pricing"] [--mobile] [--threshold=0.5]
    Lägg till en URL att bevaka

  remove <url>
    Ta bort en URL från bevakningen

  list
    Visa alla bevakade URLs

  history [url]
    Visa ändringshistorik (alla eller specifik URL)

  check
    Kör bevakning nu (samma som: npm run check)

  report [datum]
    Visa daglig sammanfattning (default: idag)

  export [--format=csv]
    Exportera historik som JSON eller CSV

  integrate <typ> <url/nyckel>
    Konfigurera integration (slack, teams, discord, pagerduty, jira, webhook)

  integrations
    Visa konfigurerade integrationer

Exempel:
  npm run cli -- add https://stripe.com/pricing "Stripe Pricing"
  npm run cli -- add https://example.com/pricing "Example" --selector=".price-table" --threshold=1.0
  npm run cli -- list
  npm run cli -- history https://stripe.com/pricing
  npm run cli -- remove https://stripe.com/pricing

Integrationer:
  npm run cli -- integrate slack https://hooks.slack.com/services/...
  npm run cli -- integrate teams https://outlook.office.com/webhook/...
  npm run cli -- integrate discord https://discord.com/api/webhooks/...
  npm run cli -- integrate pagerduty <routing-key>
  npm run cli -- integrate webhook https://hooks.zapier.com/...  "Zapier"
  npm run cli -- integrate remove slack
  npm run cli -- integrations
`);
}

function parseOptions(args: string[]): Record<string, string | boolean> {
  const opts: Record<string, string | boolean> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      opts[key] = value ?? true;
    }
  }
  return opts;
}

switch (command) {
  case 'add': {
    const url = args.find(a => a.startsWith('http'));
    const nameWords = args.filter(a => !a.startsWith('http') && !a.startsWith('--'));
    const name = nameWords.join(' ') || undefined;
    if (!url || !name) {
      console.error('Användning: add <url> <namn>');
      process.exit(1);
    }
    const opts = parseOptions(args);
    try {
      const target = addTarget(url, name, {
        selector: typeof opts.selector === 'string' ? opts.selector : undefined,
        mobile: opts.mobile === true,
        threshold: typeof opts.threshold === 'string' ? parseFloat(opts.threshold) : undefined,
      });
      console.log(`✓ Lade till: ${target.name} (${target.url})`);
      if (target.selector) console.log(`  Selektor: ${target.selector}`);
      if (target.mobile) console.log(`  Mobilvy: ja`);
      console.log(`  Tröskel: ${target.threshold}%`);
    } catch (e: unknown) {
      console.error(`Fel: ${e instanceof Error ? e.message : e}`);
    }
    break;
  }

  case 'remove': {
    const url = args[0];
    if (!url) {
      console.error('Användning: remove <url>');
      process.exit(1);
    }
    if (removeTarget(url)) {
      console.log(`✓ Tog bort: ${url}`);
    } else {
      console.error(`Hittade inte: ${url}`);
    }
    break;
  }

  case 'list':
    listTargets();
    break;

  case 'history': {
    const url = args[0];
    if (url) {
      console.log(`\nHistorik för ${url}:\n`);
      printHistory(getHistoryForUrl(url));
    } else {
      console.log('\nAll historik:\n');
      const all = loadHistory();
      // Gruppera per URL
      const urls = [...new Set(all.map(e => e.url))];
      for (const u of urls) {
        const target = loadTargets().find(t => t.url === u);
        console.log(`\n${target?.name ?? u}:`);
        printHistory(all.filter(e => e.url === u).slice(-10));
      }
    }
    break;
  }

  case 'report': {
    const date = args[0]; // YYYY-MM-DD eller undefined (idag)
    const summary = getDailySummary(date);
    printDailySummary(summary);
    break;
  }

  case 'export': {
    const opts = parseOptions(args);
    const format = opts.format === 'csv' ? 'csv' : 'json';
    console.log(exportHistory(format));
    break;
  }

  case 'integrate': {
    const type = args[0];
    const value = args[1];
    const config = loadIntegrations();

    if (type === 'remove') {
      const target = args[1] as keyof IntegrationsConfig;
      if (target && target in config) {
        delete config[target];
        saveIntegrations(config);
        console.log(`✓ Tog bort integration: ${target}`);
      } else {
        console.error(`Integration "${target}" finns inte.`);
      }
      break;
    }

    if (!type || !value) {
      console.error('Användning: integrate <typ> <url/nyckel>');
      process.exit(1);
    }

    switch (type) {
      case 'slack':
        config.slack = { webhookUrl: value };
        console.log('✓ Slack-webhook konfigurerad');
        break;
      case 'teams':
        config.teams = { webhookUrl: value };
        console.log('✓ Microsoft Teams-webhook konfigurerad');
        break;
      case 'discord':
        config.discord = { webhookUrl: value };
        console.log('✓ Discord-webhook konfigurerad');
        break;
      case 'pagerduty':
        config.pagerduty = { routingKey: value, minImportance: 7 };
        console.log('✓ PagerDuty konfigurerad (triggas vid importance >= 7)');
        break;
      case 'webhook': {
        const whName = args[2] || 'Webhook';
        config.webhooks = config.webhooks || [];
        config.webhooks.push({ url: value, name: whName });
        console.log(`✓ Webhook "${whName}" tillagd`);
        break;
      }
      default:
        console.error(`Okänd integration: ${type}. Välj: slack, teams, discord, pagerduty, webhook`);
        process.exit(1);
    }
    saveIntegrations(config);
    break;
  }

  case 'integrations': {
    const config = loadIntegrations();
    const entries = Object.entries(config).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      console.log('Inga integrationer konfigurerade. Lägg till med: npm run cli -- integrate <typ> <url>');
      break;
    }
    console.log('\nKonfigurerade integrationer:\n');
    if (config.slack) console.log(`  ● Slack: ${config.slack.webhookUrl.slice(0, 40)}...`);
    if (config.teams) console.log(`  ● Microsoft Teams: ${config.teams.webhookUrl.slice(0, 40)}...`);
    if (config.discord) console.log(`  ● Discord: ${config.discord.webhookUrl.slice(0, 40)}...`);
    if (config.pagerduty) console.log(`  ● PagerDuty: routing key konfigurerad (min importance: ${config.pagerduty.minImportance})`);
    if (config.jira) console.log(`  ● Jira: ${config.jira.baseUrl} (projekt: ${config.jira.projectKey})`);
    if (config.webhooks?.length) {
      for (const wh of config.webhooks) {
        console.log(`  ● Webhook "${wh.name}": ${wh.url.slice(0, 40)}...`);
      }
    }
    if (config.email) console.log(`  ● Email: ${config.email.to}`);
    break;
  }

  case 'check': {
    // Delegera till local-test.ts
    import('./local-test');
    break;
  }

  default:
    usage();
    break;
}
