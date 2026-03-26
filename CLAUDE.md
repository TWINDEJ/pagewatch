# changebrief

## Om projektet
Verktyg som bevakar webbsidor och med AI (GPT-4o Vision) berättar *vad* som ändrades — inte bara att något ändrades.

## Teknikstack
- **Node.js + TypeScript**
- **Playwright** — headless screenshots (desktop + mobil)
- **Pixelmatch + pngjs** — pixeljämförelse (filter innan AI-anrop)
- **OpenAI API (gpt-4o)** — bildanalys av före/efter-screenshots
- **dotenv** — miljövariabler

## Projektstruktur
```
shared/screenshot.ts  — Playwright-wrapper (viewport, selector, cookies, headers)
shared/diff.ts        — Pixelmatch-wrapper
shared/vision.ts      — OpenAI Vision API-anrop
shared/notify.ts      — Alla notis-kanaler (Slack, Teams, Discord, PagerDuty, Jira, webhook)
shared/integrations.ts — Central dispatcher + integrations-config
shared/history.ts     — JSON-baserad ändringslogg
shared/config.ts      — URL-konfiguration med per-URL settings
shared/storage.ts     — Screenshot-arkivering med retention
shared/report.ts      — Daglig rapport + CSV/JSON-export
cli.ts                — CLI med add/remove/list/history/report/export/check/integrate
local-test.ts         — Kör hela bevakningsflödet
data/urls.json        — Bevakade URLs (med konfiguration)
data/integrations.json — Integrationer (gitignored)
data/history.json     — Ändringshistorik (gitignored)
data/screenshots/     — Aktuella screenshots (gitignored)
data/archive/         — Datumstämplade arkiv (gitignored)
landing/              — Astro + Tailwind landing page
```

## Köra lokalt
```bash
cp .env.example .env         # Fyll i OPENAI_API_KEY
npm run cli -- add <url> <namn>  # Lägg till URL
npm run check                # Kör bevakning
npm run cli -- report        # Visa rapport
```

## Lektioner
- pixelmatch v7 är ESM-only, importera med `import pixelmatch from 'pixelmatch'`
- Namn med mellanslag i CLI: samla alla non-option/non-URL args och join med ' '
- Filtrera bort undefined vid spread för att inte skriva över defaults
