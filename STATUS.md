# Status — changebrief

## Fas: MVP Live

## Infrastruktur ✅
- [x] Landing page live (changebrief.io)
- [x] Webbapp live (app.changebrief.io)
- [x] Turso-databas i produktion
- [x] GitHub Actions cron (var 6h, testat, fungerar)
- [x] Polar + Stripe godkänd och live
- [x] Google + GitHub OAuth konfigurerat
- [x] DNS korrekt (Cloudflare + Vercel)

## Features ✅
- [x] Playwright screenshots (desktop + mobil, selektorer, cookies)
- [x] Pixelmatch diff med konfigurerbar tröskel
- [x] GPT-4o Vision-analys med importance scoring
- [x] CLI med 10+ kommandon
- [x] 6 integrationer (Slack, Teams, Discord, PagerDuty, Jira, webhooks)
- [x] Dashboard: add/remove URLs, ändringshistorik, plangränser
- [x] Auth: Google + GitHub login
- [x] Landing page: 8 sektioner, checkout-knappar

## Kvar att göra
- [ ] Regenerera exponerade secrets
- [ ] Testa fullständigt end-to-end-flöde
- [ ] Landing page på engelska
- [ ] Polar webhook → auto-uppdatera plan vid köp
- [ ] Dashboard: loading states, error handling
- [ ] Onboarding-flöde
- [ ] E-postnotiser (Resend)
