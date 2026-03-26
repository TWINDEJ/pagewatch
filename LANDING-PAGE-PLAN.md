# Pagewatch AI — Landing Page Plan

## 1. Landing Page-struktur

### Sektionsordning (top-down)

**1. Hero (above the fold)**
- Rubrik: *"Se vad som ändrades — inte bara att något ändrades"*
- Underrubrik: *"Pagewatch bevakar webbsidor och berättar med AI exakt vad som hände. Inga suddiga screenshots. Inga röda pixlar. Bara en tydlig mening."*
- CTA-knapp: "Kom igång gratis" (primary) + "Se demo" (secondary/ghost)
- Kort animerad gif/video: före/efter-screenshot som blir en AI-sammanfattning

**2. Problem/Pain**
- Rubrik: *"Befintliga verktyg visar dig det här..."*
- Visa en typisk Visualping-diff (suddiga röda pixlar) bredvid Pagewatch-output:
  > "Acme Corp tog bort 'Gratis i 14 dagar'-knappen och höjde Pro-priset från 299 kr till 349 kr/månad."
- Poäng: du ska inte behöva tolka screenshots — AI:n gör det åt dig

**3. Så funkar det (3 steg)**
1. *Lägg till en URL* — klistra in sidan du vill bevaka
2. *Vi tar screenshots automatiskt* — Playwright kör headless browser i bakgrunden
3. *AI berättar vad som ändrades* — GPT-4o Vision analyserar före/efter och skickar en sammanfattning till Slack/e-post

**4. Användningsfall (3 kort)**
- **Konkurrentbevakning** — "Vet direkt när en konkurrent ändrar priser, features eller positionering"
- **Leverantörsvillkor** — "Få besked om avtalsändringar, nya policyer eller prisförändringar"
- **Statusesidor** — "Bevaka driftstatus för era kritiska tjänster"

**5. Funktioner (feature grid)**
- AI-driven sammanfattning (inte bara pixeldiff)
- Importance score (1-10) — filtrera brus
- Slack- och e-postnotiser
- Schemalagd bevakning (varje timme/dag/vecka)
- Screenshot-historik
- REST API

**6. Prissättning** (se sektion 5 nedan)

**7. FAQ**
- "Hur skiljer sig Pagewatch från Visualping?" — Vi analyserar *vad* som ändrades, inte bara *att* det ändrades.
- "Vilken AI-modell används?" — GPT-4o Vision från OpenAI.
- "Kan jag bevaka sidor bakom login?" — Inte i v1, men det är på roadmappen.
- "Var hostar ni data?" — EU (Azure Sweden Central).

**8. Footer-CTA**
- Rubrik: *"Börja bevaka dina viktigaste sidor idag"*
- CTA: "Skapa konto — gratis" (samma som hero)
- Länkar: Docs, GitHub, Kontakt, Integritetspolicy

### CTA-placering
- Hero (top)
- Efter "Så funkar det" (mitt)
- Footer (bottom)
- Sticky header-knapp som syns efter scroll förbi hero

---

## 2. Var publicera — hosting-jämförelse

| Egenskap | Vercel | Netlify | Cloudflare Pages | GitHub Pages |
|---|---|---|---|---|
| **Gratis tier** | 100 GB bandwidth | 100 GB bandwidth | Obegränsad bandwidth | 100 GB bandwidth |
| **Custom domain** | Ja, gratis | Ja, gratis | Ja, gratis | Ja, gratis |
| **HTTPS** | Automatiskt | Automatiskt | Automatiskt | Automatiskt |
| **Deploy från Git** | Ja | Ja | Ja | Ja (Actions) |
| **Serverless functions** | Ja | Ja | Workers (kraftfulla) | Nej |
| **Build-tid gratis** | 6000 min/mån | 300 min/mån | 500 builds/mån | GitHub Actions gratis |
| **Formulärhantering** | Nej (behöver extern) | Ja, inbyggt | Nej | Nej |
| **Edge network** | Bra (global) | Bra (global) | Bäst (330+ PoPs) | Okej |
| **Komplexitet** | Låg | Låg | Låg-medel | Lägst |

### Rekommendation: **Cloudflare Pages**

**Varför:**
1. **Obegränsad bandwidth gratis** — ingen risk att bli fakturerad om en Reddit-post tar fart
2. **Snabbast** — 330+ edge locations, Cloudflare har det bästa CDN-nätverket
3. **Workers vid behov** — om du senare vill ha API-routes (t.ex. waitlist signup) kan du lägga till Workers utan att byta plattform
4. **Inget vendor lock-in** — det är bara statiska filer, lätt att flytta

**Andraplats:** Vercel (enklast om du redan använder Next.js, men bandwidth-gränsen kan bli ett problem vid viral spridning)

**Setup:**
```bash
# 1. Skapa repo på GitHub
# 2. Koppla till Cloudflare Pages via dashboard
# 3. Bygg-kommando: npm run build
# 4. Output-katalog: dist/
# 5. Custom domain: pagewatch.ai (köp via Cloudflare Registrar — billigast, at-cost pricing)
```

---

## 3. Betalning/Billing — jämförelse

| Egenskap | Stripe | Lemon Squeezy | Polar.sh | Gumroad |
|---|---|---|---|---|
| **Avgift per transaktion** | 2,9% + $0,30 | 5% + $0,50 | 4% + $0,40 | 10% + $0,50 |
| **Månadsavgift** | $0 | $0 | $0 | $0 |
| **Merchant of Record** | Nej (du säljer) | Ja (de säljer) | Ja (de säljer) | Ja (de säljer) |
| **EU-moms (VAT)** | Du hanterar själv | Ingår | Ingår | Ingår |
| **Subscription billing** | Ja (Stripe Billing) | Ja | Ja | Ja |
| **Checkout-sida** | Bygg själv / Checkout Sessions | Hosted, snygg | Hosted, snygg | Hosted, basic |
| **Developer experience** | Bäst API, mest docs | Bra API, enklare | Bra API, modern | Basic |
| **Utbetalning** | Direkt till ditt konto | 2 ggr/mån | Veckovis | Fredagar |
| **Open source** | Nej | Nej | Ja | Nej |
| **SaaS-fokus** | Ja | Ja | Ja (dev tools) | Nej (skapare) |

### Kostnadsexempel vid $50/mån-prenumeration:

| Leverantör | Du får per kund/mån |
|---|---|
| Stripe | $50 - ($1,45 + $0,30) = **$48,25** (men du hanterar moms själv) |
| Lemon Squeezy | $50 - ($2,50 + $0,50) = **$47,00** (moms ingår) |
| Polar.sh | $50 - ($2,00 + $0,40) = **$47,60** (moms ingår) |
| Gumroad | $50 - ($5,00 + $0,50) - ($1,45 + $0,30) = **$42,75** |

### Rekommendation: **Polar.sh**

**Varför:**
1. **Merchant of Record** — de hanterar EU-moms, reverse charge, fakturering. Du slipper registrera dig för VAT MOSS.
2. **Billigare än Lemon Squeezy** — 4% + $0,40 vs 5% + $0,50. Sparar ~$12/år per kund vid $50/mån.
3. **Byggt för dev tools** — deras kundbas är precis din målgrupp
4. **Open source** — passar projektets DNA
5. **Modern API** — TypeScript SDK, webhooks, bra docs
6. **Checkout hosted** — du behöver inte bygga checkout-flow själv

**Alternativ:** Om Polar.sh saknar en specifik feature du behöver (t.ex. avancerad dunning, coupon-management), välj Lemon Squeezy som backup. Undvik Stripe i tidiga stadier — momsen blir ett helvete som solo-dev i EU.

---

## 4. Tech stack för landing page

### Rekommendation: **Astro**

```
astro          — Ramverk (statisk site, 0 KB JS som default)
tailwindcss    — Styling (utility-first, snabbt att prototypa)
@astrojs/mdx   — Om du vill blogga senare
```

**Varför Astro och inte Next.js?**
- En landing page behöver noll interaktiv JavaScript
- Astro skickar 0 KB JS per default. Next.js skickar minst 87 KB även för en tom sida.
- PageSpeed-poäng 98-100 direkt ur lådan
- Perfekt för Cloudflare Pages (genererar bara statiska filer)
- Om du senare behöver interaktiva komponenter (t.ex. pricing toggle) kan du använda Astro Islands med React/Svelte

**Projektstruktur:**
```
landing/
  src/
    pages/
      index.astro          # Huvudsidan
      privacy.astro        # Integritetspolicy
    components/
      Hero.astro
      Problem.astro
      HowItWorks.astro
      UseCases.astro
      Features.astro
      Pricing.astro
      FAQ.astro
      Footer.astro
    layouts/
      Base.astro           # HTML-skal, meta-taggar, OG-taggar
    styles/
      global.css
  public/
    images/                # Screenshots, logo
    og-image.png           # Social sharing
  astro.config.mjs
  tailwind.config.mjs
  package.json
```

**Setup-kommandon:**
```bash
npm create astro@latest landing -- --template minimal
cd landing
npx astro add tailwind
```

---

## 5. Prissättning — tre tiers

### Konkurrentanalys

| | Visualping | ChangeTower | Distill.io | **Pagewatch AI** |
|---|---|---|---|---|
| **Gratis** | 5 sidor, 150 checks/mån | Gratis tier finns | 5 cloud monitors, 1000 checks/mån | 3 sidor, 100 checks/mån |
| **Billigaste betalt** | $10/mån (25 sidor, 1K checks) | ~$9/mån | $15/mån (25 monitors) | $19/mån |
| **Mellantier** | $50/mån (200 sidor, 10K checks) | — | $35/mån | $49/mån |
| **Premium** | $100/mån (500 sidor, 20K checks) | $299/mån (enterprise) | $80/mån | $99/mån |
| **AI-analys** | Nej | Nej | Nej | **Ja (GPT-4o Vision)** |

### Pagewatch AI — prisplan

**Observera:** Vår AI-analys kostar pengar per anrop (GPT-4o Vision: ~$0,01-0,03 per bildpar). Det motiverar högre pris per check jämfört med rena pixeldiff-verktyg.

#### Free — $0/mån
- 3 bevakade sidor
- 100 checks/mån
- AI-sammanfattning vid varje ändring
- E-postnotiser
- 7 dagars screenshot-historik
- *Syfte: prova på, bevisa värdet*

#### Pro — $19/mån (eller $190/år, spara 17%)
- 25 bevakade sidor
- 2 000 checks/mån
- AI-sammanfattning + importance score
- Slack + e-postnotiser
- 90 dagars screenshot-historik
- Schemaläggning: ner till var 15:e minut
- *Målgrupp: produktchefer, småföretag*

#### Team — $49/mån (eller $490/år, spara 17%)
- 100 bevakade sidor
- 10 000 checks/mån
- Allt i Pro plus:
- API-åtkomst
- Webhook-integration
- 1 år screenshot-historik
- Prioriterad support
- Flera användare (upp till 5)
- *Målgrupp: team som bevakar många konkurrenter/leverantörer*

### Varför dessa priser?

1. **Högre pris per check än konkurrenter** — motiveras av att varje check inkluderar AI-analys, inte bara pixeljämförelse. Visualping tar $10 för 1000 checks utan AI. Vi tar $19 för 2000 checks *med* AI.
2. **Inget $99+ enterprise-tier ännu** — håll det enkelt vid launch. Lägg till enterprise vid behov.
3. **Årligt rabatt** — 17% (2 månader gratis) för att öka retention.

### Beräknad kostnad per kund (GPT-4o Vision)

| Plan | Checks/mån | ~Andel som triggar AI (30%) | AI-kostnad/mån |
|---|---|---|---|
| Free | 100 | 30 | ~$0,60 |
| Pro | 2 000 | 600 | ~$12 |
| Team | 10 000 | 3 000 | ~$60 |

Pro-planen ger $19 - $12 = ~$7 marginal per kund (exkl. infra). Det är tight men okej tidigt — optimera senare med caching och smartare diff-trösklar.

---

## 6. Launch checklist

### Innan launch (must-have)

- [ ] **Landing page live** — Astro-sida deployad på Cloudflare Pages
- [ ] **Custom domain** — pagewatch.ai (eller .se/.dev) kopplad
- [ ] **OG-taggar** — titel, beskrivning, bild för social sharing
- [ ] **Integritetspolicy** — krävs av GDPR och betalningsleverantör
- [ ] **Villkor (Terms of Service)** — krävs av Polar.sh/betalningsleverantör
- [ ] **Betalningsintegration** — Polar.sh checkout kopplad till pricing-knappar
- [ ] **E-postsamling** — waitlist-formulär (alternativt direkt signup) via t.ex. Buttondown, Resend eller Polar
- [ ] **Analytics** — Plausible eller Umami (GDPR-vänliga, inga cookies)
- [ ] **Favicon + logo** — även apple-touch-icon
- [ ] **Mobilresponsiv** — testa på iPhone/Android

### Innan launch (nice-to-have)

- [ ] **Demo-video/GIF** — 30 sekunder som visar flödet
- [ ] **Blog/changelog-sida** — för SEO och transparens
- [ ] **Twitter/X-konto** — @pagewatchai (om tillgängligt)
- [ ] **Product Hunt-sida** — förbered ship-page
- [ ] **README-badge** — för GitHub-repot

### Launch-dag

- [ ] Posta på Twitter/X med demo-gif
- [ ] Posta på Hacker News (Show HN: Pagewatch AI — ...)
- [ ] Posta på r/SideProject, r/SaaS, r/webdev
- [ ] Posta på Product Hunt
- [ ] Posta på Indie Hackers
- [ ] Skicka till relevanta nyhetsbrev (TLDR, Console.dev, etc.)

### Veckan efter launch

- [ ] Svara på ALLA kommentarer (HN, Reddit, PH)
- [ ] Samla feedback — vad frågar folk om?
- [ ] Justera pricing om nödvändigt
- [ ] Skriv första bloggposten: "Hur vi använde GPT-4o Vision för att bygga en bättre webbsidesbevakare"

---

## Sammanfattning av rekommendationer

| Beslut | Rekommendation |
|---|---|
| **Hosting** | Cloudflare Pages (obegränsad bandwidth, gratis) |
| **Betalning** | Polar.sh (Merchant of Record, hanterar EU-moms, billigare än Lemon Squeezy) |
| **Tech stack** | Astro + Tailwind CSS (0 KB JS, perfekt PageSpeed) |
| **Deploy** | Git push till GitHub, Cloudflare bygger automatiskt |
| **Analytics** | Plausible Analytics ($9/mån) eller Umami (self-hosted, gratis) |
| **Domän** | Köp via Cloudflare Registrar (at-cost, billigast) |
| **E-post** | Resend (gratis upp till 3000 mejl/mån) för transaktionella mejl |
