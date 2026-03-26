# Pagewatch AI — Produktspecifikation

## Problem
Befintliga verktyg (Visualping, ChangeTower) visar suddiga screenshots med röda pixlar. Man måste själv tolka vad som ändrats.

## Lösning
Skicka före/efter-screenshots till GPT-4o Vision och få en mening tillbaka:
> "Acme Corp tog bort 'Gratis i 14 dagar'-knappen och höjde Pro-priset från 299 kr till 349 kr/månad."

## Målgrupp
- Produktchefer som bevakar konkurrenters prissidor
- Säljteam som vill veta när leverantörers villkor ändras
- DevOps-team som bevakar statusesidor

## Kärnflöde
1. Ta screenshot med Playwright
2. Jämför pixlar med pixelmatch (billigt filter)
3. Om diff > tröskelvärde → skicka till GPT-4o Vision
4. Få tillbaka: sammanfattning, importance score, ändrade element
5. Notifiera via Slack om importance >= 5

## Faser
- **Fas 1 (PoC):** Lokalt CLI-verktyg — bevisa att flödet fungerar
- **Fas 2:** Azure Functions + Blob Storage — schemalagd körning
- **Fas 3:** SaaS med React-dashboard, auth, billing
