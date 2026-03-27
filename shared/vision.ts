import OpenAI from 'openai';
import * as fs from 'fs';
import type { StructuredDiffResult } from './diff';

const client = new OpenAI();

// Kostnadsberäkning per modell (USD per 1M tokens, 2026-03 priser)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
};

export interface UsageStats {
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

// Ackumulerad kostnad per körning
let sessionUsage: UsageStats[] = [];

function trackUsage(model: string, usage: { prompt_tokens?: number; completion_tokens?: number } | undefined) {
  if (!usage) return;
  const costs = MODEL_COSTS[model] || MODEL_COSTS['gpt-4o'];
  const prompt = usage.prompt_tokens ?? 0;
  const completion = usage.completion_tokens ?? 0;
  const cost = (prompt * costs.input + completion * costs.output) / 1_000_000;
  sessionUsage.push({ model, promptTokens: prompt, completionTokens: completion, estimatedCostUsd: cost });
}

export function getSessionUsage(): { calls: number; totalTokens: number; estimatedCostUsd: number; breakdown: UsageStats[] } {
  const totalTokens = sessionUsage.reduce((sum, u) => sum + u.promptTokens + u.completionTokens, 0);
  const estimatedCostUsd = sessionUsage.reduce((sum, u) => sum + u.estimatedCostUsd, 0);
  return { calls: sessionUsage.length, totalTokens, estimatedCostUsd, breakdown: sessionUsage };
}

export function resetSessionUsage() { sessionUsage = []; }

export interface ChangeAnalysis {
  summary: string;
  importance: number; // 1-10
  changedElements: string[];
  hasSignificantChange: boolean;
  jurisdiction?: string;    // t.ex. "SE", "EU", "US"
  documentType?: string;    // t.ex. "regulation", "guidance", "consultation", "decision"
  complianceAction?: string; // "action_required" | "review_recommended" | "info_only"
}

/**
 * Billig pre-filter: ska vi köra full GPT-4o Vision-analys?
 * Pris-shortcut och CTA-ändringar → alltid ja.
 * Annars → GPT-4o-mini text-only.
 */
export async function shouldAnalyze(diff: StructuredDiffResult): Promise<boolean> {
  // Pris-shortcut — prisändringar är alltid viktiga
  if (diff.priceChanges.length > 0) {
    console.log('  → Price shortcut: prisändring hittad, kör full analys');
    return true;
  }

  // CTA/knapp-ändringar — ofta viktiga
  if (diff.addedButtons.length > 0 || diff.removedButtons.length > 0) {
    console.log('  → CTA shortcut: knappändring hittad, kör full analys');
    return true;
  }

  // Rubrikändringar — ofta viktiga
  if (diff.addedHeadings.length > 0 || diff.removedHeadings.length > 0) {
    console.log('  → Heading shortcut: rubrikändring hittad, kör full analys');
    return true;
  }

  // Annars: fråga GPT-4o-mini (billigt, ~$0.0003)
  if (!diff.summary) return false;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `A web page monitoring tool detected these changes:\n\n${diff.summary}\n\nIs this worth a detailed analysis? Changes to pricing, features, terms, or product offerings are worth it. Minor text tweaks, timestamp updates, or cosmetic changes are not.\n\nReply only YES or NO.`
      }]
    });
    trackUsage('gpt-4o-mini', response.usage);
    const answer = (response.choices[0]?.message?.content || '').trim().toUpperCase();
    console.log(`  → GPT-4o-mini filter: ${answer}`);
    return answer.startsWith('YES');
  } catch (err) {
    // Vid fel, kör full analys ändå (hellre en extra analys än att missa)
    console.warn('  ⚠ GPT-4o-mini filter misslyckades, kör full analys');
    return true;
  }
}

// Regulatoriska kategorier som triggar utökad compliance-analys
const REGULATORY_CATEGORIES = new Set([
  'Finance & Banking', 'Transport & Infrastructure', 'Health & Pharma',
  'Data & Privacy', 'Environment & Energy', 'Labor & Workplace',
  'Laws & Government', 'Regulatory',
]);

export async function analyzeChange(
  beforeImagePath: string,
  afterImagePath: string,
  url: string,
  structuredDiff?: string,
  urlCategory?: string
): Promise<ChangeAnalysis> {
  const beforeBase64 = fs.readFileSync(beforeImagePath).toString('base64');
  const afterBase64 = fs.readFileSync(afterImagePath).toString('base64');

  let textContext = '';
  if (structuredDiff) {
    textContext = `\n\nDessutom har sidans innehåll ändrats:\n${structuredDiff}\n\nAnvänd BÅDE bilderna och textändringarna för din analys.`;
  }

  const isRegulatory = urlCategory && REGULATORY_CATEGORIES.has(urlCategory);

  const complianceFields = isRegulatory ? `
  "jurisdiction": "SE",
  "documentType": "regulation",
  "complianceAction": "action_required",` : '';

  const complianceInstructions = isRegulatory ? `

REGULATORISK KLASSIFICERING (denna sida tillhör kategorin "${urlCategory}"):
Lägg till dessa fält i din JSON:
- "jurisdiction": Landskod för regeln (t.ex. "SE", "EU", "US", "UK"). Om oklart, gissa baserat på myndigheten.
- "documentType": En av: "regulation" (bindande föreskrift), "guidance" (vägledning/riktlinje), "consultation" (remiss/förslag), "decision" (tillsynsbeslut/sanktion), "standard" (teknisk standard), "law" (lag/förordning).
- "complianceAction": En av:
  * "action_required" — ny eller ändrad bindande regel, deadline, sanktion, eller krav som kräver åtgärd
  * "review_recommended" — vägledning, remiss eller förslag som bör granskas men inte kräver omedelbar åtgärd
  * "info_only" — redaktionell ändring, formatuppdatering, eller informationstext utan regulatorisk påverkan

Var STRIKT med "action_required" — använd det bara för faktiska regeländringar som påverkar efterlevnad.
Höj importance med +2 om complianceAction är "action_required" (max 10).` : '';

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Du är ett verktyg för att spåra ändringar på webbsidor.

Jämför dessa två skärmdumpar av samma sida (${url}).
BILD 1 = FÖRE (äldre version)
BILD 2 = EFTER (nyare version)${textContext}

Svara ENDAST med JSON i detta format:
{
  "summary": "En mening som beskriver vad som ändrades, t.ex. 'Priset för Pro-planen höjdes från $29 till $39/månad'",
  "importance": 7,
  "changedElements": ["pricing table", "CTA button"],
  "hasSignificantChange": true${complianceFields}
}

Importance-skalan:
1-3 = Kosmetisk ändring (färg, typsnitt, liten bilduppdatering)
4-6 = Innehållsändring (ny text, uppdaterad info)
7-9 = Viktig ändring (pris, features, villkor, CTA)
10 = Kritisk ändring (sidan borttagen, helt ny layout)
${complianceInstructions}
Om bilderna ser likadana ut, sätt hasSignificantChange: false och importance: 1.`
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${beforeBase64}` }
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${afterBase64}` }
        }
      ]
    }]
  });

  trackUsage('gpt-4o', response.usage);
  const text = response.choices[0]?.message?.content || '';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      summary: text,
      importance: 5,
      changedElements: [],
      hasSignificantChange: true
    };
  }
}
