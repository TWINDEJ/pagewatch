# changebrief — Status & Nästa steg

## Vad är live just nu?

| Del | Status | URL |
|---|---|---|
| Landing page | LIVE | https://changebrief.io |
| Webbapp (login + dashboard) | LIVE | https://app.changebrief.io |
| GitHub login | LIVE | Fungerar |
| Google login | LIVE (test mode*) | Fungerar för ditt konto |
| Polar (betalning) | TEST MODE | Checkout fungerar men debiterar inte |
| Stripe | INTE LIVE | Kopplad via Polar men i test mode |
| Core engine (screenshots + AI) | BARA LOKALT | Inte kopplad till webbappen |

*Google OAuth är i "testing mode" — bara ditt konto kan logga in. Andra användare ser "This app is blocked". Behöver publiceras.

## Vad måste fixas innan du jagar kunder?

### Kritiskt (måste göras)

1. **Polar: Go Live**
   - Gå till https://dashboard.polar.sh/changebrief/finance/account
   - Klicka "Go Live" — aktiverar riktiga betalningar via Stripe
   - Kostnad: $0 att aktivera. Polar tar 4% + $0.40 per transaktion.

2. **Google OAuth: Publicera appen**
   - Gå till https://console.cloud.google.com/auth/audience?project=vernal-seeker-369609
   - Ändra från "Testing" till "In production"
   - Utan detta kan INGEN utom du logga in med Google

3. **Koppla core engine till webbappen**
   - Just nu: dashboard visar en tom lista. Man kan lägga till URLs men inget händer.
   - Behövs: en API-route eller cron-jobb som kör screenshots + AI-analys
   - Detta är den största koduppgiften — uppskattning: ~1 session

4. **GitHub OAuth: Uppdatera callback URL**
   - https://github.com/settings/developers → changebrief
   - Callback URL: `https://app.changebrief.io/api/auth/callback/github`
   - Utan detta fungerar inte GitHub-login på produktion

### Viktigt (bör göras snart)

5. **Regenerera secrets**
   - GitHub client secret exponerades i chatten → regenerera
   - Google client secret exponerades i chatten → regenerera
   - Uppdatera i Vercel env vars efter regenerering

6. **Vercel: SQLite fungerar inte i serverless**
   - better-sqlite3 kräver filsystem — Vercel Functions är stateless
   - Alternativ: byt till Vercel Postgres, Turso (SQLite-as-a-service), eller Supabase
   - Detta blockerar: dashboard kan inte spara data i produktion

7. **Landing page på engelska**
   - Internationell SaaS bör ha engelska som huvudspråk
   - Svenska kan vara sekundärt

### Nice-to-have (efter launch)

8. Privacy policy & Terms of Service på changebrief.io
9. Plausible/Umami analytics
10. E-postnotiser vid ändringar
11. Onboarding-flöde i dashboarden

## Kostnader

### Fasta kostnader (just nu)
| Tjänst | Kostnad | Vad |
|---|---|---|
| Namecheap (changebrief.io) | ~$10/år | Domän |
| Cloudflare Pages | $0 | Landing page hosting |
| Vercel (Hobby) | $0 | App hosting (gratis tier) |
| GitHub | $0 | Repo |
| Google Cloud | $0 | OAuth (gratis) |
| **Totalt** | **~$10/år** | |

### Rörliga kostnader (per kund/användning)
| Tjänst | Kostnad | När |
|---|---|---|
| Polar/Stripe | 4% + $0.40 per transaktion | Vid varje betalning |
| OpenAI GPT-4o Vision | ~$0.01-0.03 per bildpar | Vid varje AI-analys |
| Vercel (om du överstiger Hobby) | $20/mån (Pro) | >100 GB bandwidth eller kommersiell användning |
| Databas (Turso/Supabase/Vercel Postgres) | $0-8/mån | Beroende på val |

### Stripe/Polar-kostnad per kund
| Plan | Pris | Polar tar | Du får |
|---|---|---|---|
| Pro $19/mån | $19 | $1.16 (4% + $0.40) | $17.84 |
| Team $49/mån | $49 | $2.36 (4% + $0.40) | $46.64 |

Stripe kostar dig INGENTING extra — Polar hanterar Stripe-avgiften i sina 4%.

## Rekommenderad ordning för nästa session

```
1. Fixa databas (byt från SQLite till Turso/Supabase)     ← blockerar allt
2. Koppla core engine till webbappen (screenshot-jobb)     ← kärnfunktionen
3. Google OAuth → publicera                                ← 2 min
4. GitHub OAuth → uppdatera callback URL                   ← 2 min
5. Polar → Go Live                                         ← 2 min
6. Regenerera secrets                                      ← 5 min
7. Testa hela flödet end-to-end                            ← 10 min
```

Efter dessa 7 steg har du en fungerande SaaS som kunder kan betala för och använda.
