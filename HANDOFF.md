# HANDOFF — changebrief

## Datum: 2026-03-26

## Vad som byggts

### Core engine (shared/)
- Playwright screenshots (desktop + mobil, CSS-selektorer, cookies/auth)
- Pixelmatch pixel-diff med konfigurerbar tröskel
- OpenAI GPT-4o Vision-analys med importance scoring
- CLI: add, remove, list, history, report, export, check, integrate
- Integrationer: Slack, Teams, Discord, PagerDuty, Jira, webhooks
- Screenshot-arkivering med retention, daglig rapport, CSV/JSON-export

### Landing page (landing/)
- Astro + Tailwind, live på https://changebrief.io (Cloudflare Pages)
- 8 sektioner: Hero, Problem, HowItWorks, UseCases, Features, Pricing, FAQ, Footer
- Checkout-knappar kopplade till Polar, CTA-knappar till app.changebrief.io

### Webbapp (app/)
- Next.js + Auth.js + SQLite, live på https://app.changebrief.io (Vercel)
- GitHub + Google login (Google i test mode)
- Dashboard: lägg till/ta bort URLs, visa historik, plangränser
- API: GET/POST/DELETE /api/urls

### Betalning
- Polar: changebrief (Individual), 2 produkter (Pro $19, Team $49)
- Stripe kopplad + ID-verifierad, i TEST MODE
- Checkout-länkar i landing page

### Infrastruktur
- Domän: changebrief.io (Namecheap)
- DNS: @ och www → Cloudflare Pages, app → Vercel
- GitHub: TWINDEJ/pagewatch

## Blockerare innan kundlansering
1. SQLite → databas som fungerar i serverless (Turso/Supabase)
2. Core engine inte kopplad till webbappen
3. Google OAuth i test mode
4. Polar i test mode
5. Secrets exponerade i chatten → regenerera

## Se NEXT-STEPS.md för detaljerad plan

## Dev-kommandon
```bash
# Landing page
cd landing && npm run build && npx wrangler pages deploy dist --project-name pagewatch

# Webbapp lokalt
cd app && npm run dev

# Deploy webbapp
cd app && npx vercel --prod

# Core engine
npm run check          # Kör bevakning
npm run cli -- list    # Visa URLs
```
