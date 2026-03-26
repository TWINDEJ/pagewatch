# HANDOFF — changebrief

## Datum: 2026-03-26

## Arkitektur
```
changebrief.io          → Landing page (Astro + Tailwind, Cloudflare Pages)
app.changebrief.io      → Webbapp (Next.js, Vercel)
Turso (AWS Ireland)     → Databas (@libsql/client)
GitHub Actions (var 6h) → Core engine: screenshots + GPT-4o Vision-analys
Polar + Stripe          → Betalning (godkänd, live)
```

## Allt som fungerar
- Landing page med 8 sektioner, checkout-knappar, CTA → app
- Webbapp med Google + GitHub login
- Dashboard: lägg till/ta bort URLs, visa ändringshistorik, plangränser (Free 3, Pro 25, Team 100)
- API routes: GET/POST/DELETE /api/urls
- Turso-databas i produktion (ersätter SQLite)
- GitHub Actions cron kör core engine var 6:e timme (testat, fungerar)
- Core engine: Playwright screenshots → pixelmatch diff → GPT-4o Vision-analys → resultat till Turso
- CLI: add, remove, list, history, report, export, check, integrate
- 6 integrationer: Slack, Teams, Discord, PagerDuty, Jira, webhooks
- Polar: Pro $19/mån, Team $49/mån — Stripe kopplad, ID-verifierad, godkänd
- DNS: changebrief.io → Cloudflare, app.changebrief.io → Vercel

## Exponerade secrets (regenerera!)
- GitHub OAuth client secret — exponerad i chatten
- Google OAuth client secret — exponerad i chatten
- AUTH_SECRET — redan regenererad ✅
- Turso auth token — exponerad i chatten

**Åtgärd:** Regenerera i respektive dashboard, uppdatera i Vercel env vars, redeploya.

## Filstruktur
```
pagewatch/
├── landing/           # Astro + Tailwind (Cloudflare Pages)
├── app/               # Next.js webbapp (Vercel)
│   ├── src/lib/db.ts      # Turso-databas (async, libsql)
│   ├── src/lib/auth.ts    # Auth.js (Google + GitHub)
│   ├── src/app/dashboard/ # Dashboard-sida
│   └── src/app/api/urls/  # API routes
├── engine/            # Core engine för GitHub Actions
│   └── check-all.ts       # Läser URLs från Turso, kör checks, skriver resultat
├── shared/            # Delad logik (screenshot, diff, vision, notify)
├── .github/workflows/ # GitHub Actions cron (var 6h)
├── cli.ts             # CLI-verktyg
├── data/urls.json     # CLI-konfiguration (separat från webbappen)
└── .env               # OpenAI API-nyckel (gitignored)
```

## Konton & tjänster
| Tjänst | Konto | Dashboard |
|---|---|---|
| Cloudflare | thewigander@gmail.com | dash.cloudflare.com |
| Vercel | thewigander-4157 | vercel.com/dashboard |
| Polar | changebrief (Individual) | dashboard.polar.sh/changebrief |
| Turso | thewigander-wq | console.turso.tech |
| Google Cloud | vernal-seeker-369609 | console.cloud.google.com |
| GitHub | TWINDEJ/pagewatch | github.com/TWINDEJ/pagewatch |
| Namecheap | changebrief.io | namecheap.com |

## Dev-kommandon
```bash
# Landing page: bygg + deploya
cd landing && npm run build && npx wrangler pages deploy dist --project-name pagewatch

# Webbapp: kör lokalt
cd app && npm run dev

# Webbapp: deploya till produktion
cd app && npx vercel --prod --yes

# Core engine: kör manuellt (lokalt)
npx ts-node engine/check-all.ts

# Core engine: trigga GitHub Actions
gh workflow run check-urls.yml

# CLI (lokal testning)
npm run cli -- list
npm run check
```

## Att finslipa nästa session
- Regenerera exponerade secrets
- Testa hela flödet end-to-end som ny användare (incognito)
- Landing page: byt till engelska för internationell publik
- Design: polera dashboard (loading states, error handling, toasts)
- Onboarding: guide första gången en användare loggar in
- E-postnotiser vid ändringar (Resend, gratis 3000/mån)
- Polar webhook → uppdatera user.plan vid köp/avslut
