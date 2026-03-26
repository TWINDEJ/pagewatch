import OpenAI from 'openai';
import * as fs from 'fs';

const client = new OpenAI();

export interface ChangeAnalysis {
  summary: string;
  importance: number; // 1-10
  changedElements: string[];
  hasSignificantChange: boolean;
}

export async function analyzeChange(
  beforeImagePath: string,
  afterImagePath: string,
  url: string
): Promise<ChangeAnalysis> {
  const beforeBase64 = fs.readFileSync(beforeImagePath).toString('base64');
  const afterBase64 = fs.readFileSync(afterImagePath).toString('base64');

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
BILD 2 = EFTER (nyare version)

Svara ENDAST med JSON i detta format:
{
  "summary": "En mening som beskriver vad som ändrades, t.ex. 'Priset för Pro-planen höjdes från $29 till $39/månad'",
  "importance": 7,
  "changedElements": ["pricing table", "CTA button"],
  "hasSignificantChange": true
}

Importance-skalan:
1-3 = Kosmetisk ändring (färg, typsnitt, liten bilduppdatering)
4-6 = Innehållsändring (ny text, uppdaterad info)
7-9 = Viktig ändring (pris, features, villkor, CTA)
10 = Kritisk ändring (sidan borttagen, helt ny layout)

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
