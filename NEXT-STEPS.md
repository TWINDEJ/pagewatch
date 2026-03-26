# changebrief — Nästa steg

## Kritiskt (före kundlansering)

### 1. Regenerera exponerade secrets (~10 min)
GitHub client secret, Google client secret och Turso auth token exponerades i konversationen.
- GitHub: https://github.com/settings/developers → changebrief → regenerate secret
- Google: https://console.cloud.google.com/auth/clients?project=vernal-seeker-369609 → changebrief → add new secret
- Turso: Skapa ny token via API eller CLI
- Uppdatera i Vercel: `echo "NYA_SECRETEN" | npx vercel env add VARIABELNAMN production`
- Redeploya: `cd app && npx vercel --prod --yes`

### 2. End-to-end-test (~15 min)
Öppna incognito → changebrief.io → "Kom igång" → login → lägg till URL → vänta på nästa cron-körning → se resultat i dashboard.

## Finslipning (efter launch)

### 3. Landing page på engelska
Internationell SaaS bör ha engelska som huvudspråk. Byt all copy i landing/-komponenterna.

### 4. Polar webhook → auto-uppdatera plan
När en kund betalar för Pro/Team ska user.plan uppdateras automatiskt.
- Skapa webhook i Polar Dashboard → peka på app.changebrief.io/api/webhooks/polar
- Validera signatur, uppdatera plan i Turso

### 5. Dashboard-polish
- Loading states (skeleton screens)
- Error handling (toast notifications)
- Bekräftelse vid borttagning av URL
- Visa senaste check-datum per URL

### 6. Onboarding
- Guida nya användare: "Lägg till din första URL"
- Visa exempel-output för att demonstrera värdet

### 7. E-postnotiser
- Resend (gratis 3000 mejl/mån)
- Skicka sammanfattning vid viktiga ändringar (importance >= 5)

## Kostnader

### Vid 0 kunder: ~$10/år (domän)
### Vid 100 kunder á $19/mån:
| Post | Kostnad |
|---|---|
| Intäkt | $1,900/mån |
| Polar (4% + $0.40) | -$230/mån |
| OpenAI (GPT-4o Vision) | -$50/mån |
| Vercel Pro (vid behov) | -$20/mån |
| **Netto** | **~$1,600/mån** |
