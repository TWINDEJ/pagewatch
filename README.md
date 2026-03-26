# Pagewatch AI

Bevakar webbsidor och berättar på ren svenska/engelska *vad som faktiskt ändrades* — inte bara att något ändrades.

> "Acme Corp tog bort 'Gratis i 14 dagar'-knappen och höjde Pro-priset från 299 kr till 349 kr/månad."

## Snabbstart

```bash
npm install
npx playwright install chromium
cp .env.example .env  # Fyll i din OPENAI_API_KEY
```

## Användning

### Lägg till sidor att bevaka
```bash
npm run cli -- add https://stripe.com/pricing "Stripe Pricing"
npm run cli -- add https://example.com/pricing "Example" --selector=".price-table"
npm run cli -- add https://m.example.com "Example Mobil" --mobile --threshold=1.0
```

### Kör bevakning
```bash
npm run check
```

### Se resultat
```bash
npm run cli -- list              # Visa alla bevakade sidor
npm run cli -- history           # Visa all ändringshistorik
npm run cli -- report            # Daglig sammanfattning
npm run cli -- export            # JSON-export
npm run cli -- export --format=csv  # CSV-export
```

### Ta bort sida
```bash
npm run cli -- remove https://stripe.com/pricing
```

## Hur det fungerar

1. **Playwright** tar screenshot av varje URL (desktop eller mobil viewport)
2. **Pixelmatch** jämför nya screenshotet med förra (billigt pixelfilter)
3. Om förändringen > tröskel skickas bildparet till **GPT-4o Vision**
4. GPT-4o svarar med en sammanfattning, importance score (1-10) och vilka element som ändrats
5. **Slack-notis** skickas om importance >= konfigurerat minimum

## Konfiguration per URL

| Option | Beskrivning | Default |
|---|---|---|
| `--threshold=X` | Min pixel-diff % för AI-analys | 0.3 |
| `--selector=".css"` | Bevaka bara specifik del av sidan | hela viewporten |
| `--mobile` | Mobil viewport (375×812) | desktop (1280×900) |

Stöd finns även för cookies, headers och waitForSelector via `data/urls.json`.

## Notiser

Lägg till `SLACK_WEBHOOK_URL` i `.env` för Slack-notiser. Notiser skickas bara om sidans importance score >= konfigurerat minimum (default 5/10).
