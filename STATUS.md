# Status — changebrief

## Nuvarande fas: Fas 1 (PoC) — fungerande + landing page

## Implementerade features

### Kärnflöde
- [x] Playwright screenshots (desktop + mobil viewport)
- [x] Pixelmatch diff med konfigurerbar tröskel
- [x] OpenAI GPT-4o Vision-analys
- [x] Automatisk baseline vid första körning

### CLI (npm run cli --)
- [x] `add` — med --selector, --mobile, --threshold
- [x] `remove`, `list`, `history`, `report`, `export`, `check`
- [x] `integrate` — konfigurera integrationer via CLI
- [x] `integrations` — visa konfigurerade integrationer

### Integrationer
- [x] Slack webhook
- [x] Microsoft Teams (Adaptive Cards)
- [x] Discord webhook
- [x] PagerDuty (severity mapping)
- [x] Jira (auto-skapa ärenden)
- [x] Generic webhook (Zapier, Make, n8n)
- [x] Email placeholder
- [x] Central dispatcher — alla integrationer körs parallellt

### Konfiguration per URL
- [x] Tröskel, CSS-selektor, mobil viewport
- [x] Cookie/auth-stöd (headers, cookies, waitForSelector)
- [x] Min importance för notis, aktiv/inaktiv

### Data
- [x] JSON-historik, screenshot-arkivering (7d retention)
- [x] Daglig rapport, CSV/JSON-export

### Landing page (landing/)
- [x] Astro + Tailwind CSS
- [x] Hero, Problem, HowItWorks, UseCases, Features, Pricing, FAQ, Footer
- [x] OG-taggar, meta, responsiv design, dark theme
- [x] Bygger utan fel

## Nästa steg
- [ ] Köp domän changebrief.io
- [ ] Deploya landing page till Cloudflare Pages
- [ ] Koppla Polar.sh för betalning
- [ ] Cron-schemaläggning (Azure Functions)
- [ ] Dashboard (React + Vite)
