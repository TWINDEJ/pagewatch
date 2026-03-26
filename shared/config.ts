import * as fs from 'fs';
import * as path from 'path';

export interface WatchTarget {
  url: string;
  name: string;
  active: boolean;
  threshold: number;       // procent pixel-diff som triggar AI-analys
  minImportance: number;   // minsta importance-score för att skicka notis
  selector?: string;       // CSS-selektor — screenshota bara detta element
  mobile?: boolean;        // ta screenshot i mobil-viewport (375×812)
  headers?: Record<string, string>;  // extra HTTP-headers (t.ex. Authorization)
  cookies?: Array<{name: string; value: string; domain: string}>;
  waitForSelector?: string; // vänta på att detta element finns innan screenshot
  notifySlack: boolean;
  notifyEmail?: string;    // email-adress att notifiera
}

const CONFIG_FILE = path.join('data', 'urls.json');

function defaultTarget(url: string, name: string): WatchTarget {
  return {
    url,
    name,
    active: true,
    threshold: 0.3,
    minImportance: 5,
    notifySlack: true,
  };
}

export function loadTargets(): WatchTarget[] {
  if (!fs.existsSync(CONFIG_FILE)) return [];
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const items = JSON.parse(raw);

  // Stöd gammalt format (bara url + name) och nytt format
  return items.map((item: Partial<WatchTarget> & { url: string; name: string }) => ({
    ...defaultTarget(item.url, item.name),
    ...item,
  }));
}

export function saveTargets(targets: WatchTarget[]): void {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(targets, null, 2));
}

export function addTarget(url: string, name: string, options?: Partial<WatchTarget>): WatchTarget {
  const targets = loadTargets();
  const existing = targets.find(t => t.url === url);
  if (existing) {
    throw new Error(`URL redan bevakad: ${url} (${existing.name})`);
  }
  // Filtrera bort undefined-värden så de inte skriver över defaults
  const cleanOptions = Object.fromEntries(
    Object.entries(options ?? {}).filter(([, v]) => v !== undefined)
  );
  const target = { ...defaultTarget(url, name), ...cleanOptions } as WatchTarget;
  targets.push(target);
  saveTargets(targets);
  return target;
}

export function removeTarget(url: string): boolean {
  const targets = loadTargets();
  const index = targets.findIndex(t => t.url === url);
  if (index === -1) return false;
  targets.splice(index, 1);
  saveTargets(targets);
  return true;
}

export function listTargets(): void {
  const targets = loadTargets();
  if (targets.length === 0) {
    console.log('Inga bevakade URLs. Lägg till med: npm run cli -- add <url> <namn>');
    return;
  }
  console.log(`\n${targets.length} bevakade sidor:\n`);
  for (const t of targets) {
    const status = t.active ? '●' : '○';
    const extras = [
      t.selector ? `selector: ${t.selector}` : null,
      t.mobile ? 'mobil' : null,
      `tröskel: ${t.threshold}%`,
    ].filter(Boolean).join(', ');
    console.log(`  ${status} ${t.name}`);
    console.log(`    ${t.url}`);
    console.log(`    ${extras}`);
  }
}
