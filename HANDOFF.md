# HANDOFF — changebrief

## Datum: 2026-03-26

## Arkitektur
```
changebrief.io (Cloudflare Pages) → Landing page
app.changebrief.io (Vercel) → Next.js webbapp med auth
Turso (AWS Ireland) → Databas
GitHub Actions (cron var 6h) → Screenshots + AI-analys
Polar + Stripe → Betalning
```

## Vad som fungerar
- Landing page live på changebrief.io
- Webbapp med Google/GitHub login på app.changebrief.io
- Dashboard: lägg till/ta bort URLs, visa ändringshistorik
- Turso-databas i produktion (ersätter SQLite)
- GitHub Actions kör core engine var 6:e timme
- Polar checkout-knappar i landing page (TEST MODE)

## Kvar innan kundlansering
1. Google OAuth: publicera (testing → production)
2. GitHub OAuth: uppdatera callback URL till app.changebrief.io
3. Polar: Go Live
4. Regenerera exponerade secrets (GitHub + Google)
5. Testa hela flödet end-to-end

## Dev-kommandon
```bash
# Landing page
cd landing && npm run build && npx wrangler pages deploy dist --project-name pagewatch

# Webbapp lokalt
cd app && npm run dev

# Deploy webbapp
cd app && npx vercel --prod

# Kör engine manuellt
npx ts-node engine/check-all.ts

# Trigga GitHub Actions manuellt
gh workflow run check-urls.yml
```
