# changebrief

## Om projektet
Bevakar webbsidor och berättar med AI (GPT-4o Vision) *vad* som ändrades — inte bara att något ändrades.

## Teknikstack
- **Landing page:** Astro + Tailwind → Cloudflare Pages (changebrief.io)
- **Webbapp:** Next.js (App Router) + Auth.js → Vercel (app.changebrief.io)
- **Databas:** Turso (@libsql/client, AWS Ireland)
- **Core engine:** Playwright + Pixelmatch + OpenAI GPT-4o Vision
- **Cron:** GitHub Actions (var 6h)
- **Betalning:** Polar.sh + Stripe
- **Auth:** Google + GitHub via Auth.js (NextAuth v5)

## Projektstruktur
```
landing/               — Astro landing page (Cloudflare Pages)
app/                   — Next.js webbapp (Vercel)
  src/lib/db.ts        — Turso-databas (async, libsql)
  src/lib/auth.ts      — Auth.js config
  src/app/dashboard/   — Dashboard (add/remove URLs, historik)
  src/app/api/urls/    — REST API
  src/app/login/       — Login-sida
engine/                — Core engine för GitHub Actions
  check-all.ts         — Läser URLs från Turso, screenshots, AI, skriver tillbaka
shared/                — Delad logik
  screenshot.ts        — Playwright (viewport, selector, cookies, headers)
  diff.ts              — Pixelmatch
  vision.ts            — OpenAI GPT-4o Vision
  notify.ts            — Slack, Teams, Discord, PagerDuty, Jira, webhooks
  integrations.ts      — Central dispatcher
  config.ts            — URL-konfiguration
  history.ts           — Ändringslogg
  storage.ts           — Screenshot-arkivering
  report.ts            — Rapport + export
cli.ts                 — CLI-verktyg
.github/workflows/     — GitHub Actions cron
```

## Köra lokalt
```bash
cd app && npm run dev          # Webbapp på localhost:3000
npm run check                  # CLI: kör bevakning
npm run cli -- list            # CLI: visa URLs
npx ts-node engine/check-all.ts  # Engine manuellt
```

## Deploya
```bash
cd landing && npm run build && npx wrangler pages deploy dist --project-name pagewatch
cd app && npx vercel --prod --yes
gh workflow run check-urls.yml   # Trigga cron manuellt
```

## Env vars (Vercel)
AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AUTH_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN

## Env vars (GitHub Secrets)
OPENAI_API_KEY, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN

## Lektioner
- pixelmatch v7 är ESM-only
- Turbopack har bugg med @libsql/client LICENSE-fil — bygg utan --turbopack
- Turso free tier har bara AWS-locations (eu-west-1 närmast Sverige)
- Polar kräver pris > $0 — gratis plan hanteras utan checkout
- better-sqlite3 fungerar INTE i Vercel serverless — använd Turso/libsql
- serverExternalPackages i next.config.ts hjälper inte med Turbopack-buggen
