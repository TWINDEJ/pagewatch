# Status — changebrief

## Fas: MVP Live + Strukturerad Textpipeline

## Infrastruktur
- [x] Landing page live (changebrief.io) — EN + SV
- [x] Webbapp live (app.changebrief.io) — EN + SV
- [x] Turso-databas i produktion
- [x] GitHub Actions cron (var 6h) — URL checks med screenshot-cache
- [x] GitHub Actions cron (fredag 08:00 UTC) — Weekly digest
- [x] Polar + Stripe godkänd och live
- [x] Google + GitHub OAuth konfigurerat
- [x] DNS korrekt (Namecheap + Vercel + Cloudflare Pages)
- [x] Resend verified (changebrief.io, eu-west-1)
- [x] Resend API-nyckel → GitHub Secret + Vercel env
- [x] Polar webhook → app.changebrief.io/api/webhooks/polar

## Features
- [x] Playwright screenshots (desktop + mobil, selektorer, cookies, headers)
- [x] Pixelmatch diff med konfigurerbar tröskel
- [x] GPT-4o Vision-analys med importance scoring
- [x] **Strukturerad text-extraktion** (priser, rubriker, knappar, länkar, listor)
- [x] **Brus-strippning** (timestamps, cookies, session-IDs, UUIDs)
- [x] **GPT-4o-mini pre-filter** (billig "worth analyzing?" check)
- [x] **Pris-shortcut** (prisändringar → direkt till full analys)
- [x] **Screenshot-cache** i GitHub Actions (baselines bevaras mellan körningar)
- [x] Dashboard: stats-bar, grupperad change log, inline-ändringar i URL-kort
- [x] Auth: Google + GitHub login
- [x] Landing page: 6 use cases, ingen modell-referens, konsekvent branding
- [x] Polar webhook → auto-uppdatera plan vid köp/avslut (verifierad 2026-03-27)
- [x] Resend e-postnotiser (verifierad 2026-03-27)
- [x] Upgrade-knapp i dashboard (Pro/Team via Polar checkout)
- [x] Notification settings UI (email, Slack, weekly digest)
- [x] Popular watchlists (31 förslag, 7 kategorier)
- [x] Felhantering: last_checked, last_error, consecutive_errors
- [x] i18n: EN/SV i hela appen + landing page (/sv)
- [x] Veckorapport (weekly digest)
- [x] Mobilresponsiv dashboard

## Behöver verifieras
- [ ] Strukturerad diff med faktiska textändringar (väntar på att sidor ändras)
- [ ] GPT-4o-mini pre-filter i produktion (har inte trigrats ännu)
- [ ] Dashboard "Last check"-stat visar rätt tid (buggfix deployad, ej verifierad)
- [ ] Grupperad change log med riktigt data

## Kvar att göra (manuellt)
- [x] Skapa Resend-konto + verifiera changebrief.io-domän
- [x] Lägga till RESEND_API_KEY som GitHub Secret + Vercel env
- [x] Konfigurera Polar webhook URL i dashboard.polar.sh
- [x] POLAR_WEBHOOK_SECRET tillagd i Vercel env
- [x] E2E-test: mejlnotis fungerar (2026-03-27, "Email sent to thewigander@gmail.com")
- [x] Testköp via Polar (100%-rabattkod TEST100, webhook 200 OK, plan → Pro)
- [x] Upgrade-knapp i dashboard header
- [ ] E2E-test: trigga weekly-digest.yml → verifiera digest-mejl
- [ ] Implementera webhook-signaturverifiering (tillfälligt avaktiverad)
- [ ] Kolla OpenAI-kostnad efter ett par dagars körningar

## Kvar att bygga (framtida)
- [ ] Brusprofil per URL (auto-lär vilka delar som är dynamiska)
- [ ] Trendanalys (prisändringar över tid)
- [ ] Jämförelse mellan sidor (competitive dashboard)
- [ ] Diff-arkiv med tidsstämplar (juridiskt bevis)
- [ ] Loading skeletons i dashboard
