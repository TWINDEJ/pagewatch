'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLocale } from '../locale-provider';
import { useRouter } from 'next/navigation';
import suggestions from '@/data/suggestions.json';

interface Props {
  existingUrlCount: number;
  canAdd: boolean;
}

type Jurisdiction = 'SE' | 'DK' | 'NO' | 'FI' | 'EU' | 'US';
type Step = 1 | 2 | 3;

const JURISDICTIONS: Jurisdiction[] = ['SE', 'DK', 'NO', 'FI', 'EU', 'US'];

const SECTORS = [
  'Finance & Banking',
  'Health & Pharma',
  'Data & Privacy',
  'Transport & Infrastructure',
  'Environment & Energy',
  'Labor & Workplace',
  'Laws & Government',
] as const;

type Sector = typeof SECTORS[number];

const sectorLabels: Record<Sector, { en: string; sv: string }> = {
  'Finance & Banking':           { en: 'Finance & Banking',           sv: 'Finans & Bank' },
  'Health & Pharma':             { en: 'Health & Pharma',             sv: 'Hälsa & Läkemedel' },
  'Data & Privacy':              { en: 'Data & Privacy',              sv: 'Data & Integritet' },
  'Transport & Infrastructure':  { en: 'Transport & Infrastructure',  sv: 'Transport & Infrastruktur' },
  'Environment & Energy':        { en: 'Environment & Energy',        sv: 'Miljö & Energi' },
  'Labor & Workplace':           { en: 'Labor & Workplace',           sv: 'Arbete & Arbetsmiljö' },
  'Laws & Government':           { en: 'Laws & Government',           sv: 'Lagar & Myndigheter' },
};

const i18n = {
  en: {
    step1Title: 'Select your jurisdictions',
    step1Sub: 'Which countries or regions do you need to monitor?',
    step2Title: 'Select your sector',
    step2Sub: 'What industry are you in?',
    step3Title: 'Recommended sources',
    step3Sub: 'Based on your selections, we found these regulatory sources.',
    matchCount: (n: number) => `${n} matching source${n !== 1 ? 's' : ''}`,
    addAll: 'Add all recommended',
    adding: (current: number, total: number) => `Adding ${current} of ${total}...`,
    done: 'All sources added!',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    noMatches: 'No sources match your selection. Try adjusting your jurisdictions or sector.',
    cannotAdd: 'You have reached your URL limit. Upgrade to add more.',
  },
  sv: {
    step1Title: 'Välj dina jurisdiktioner',
    step1Sub: 'Vilka länder eller regioner behöver du bevaka?',
    step2Title: 'Välj din bransch',
    step2Sub: 'Vilken bransch verkar du inom?',
    step3Title: 'Rekommenderade källor',
    step3Sub: 'Baserat på dina val hittade vi dessa regulatoriska källor.',
    matchCount: (n: number) => `${n} matchande käll${n !== 1 ? 'or' : 'a'}`,
    addAll: 'Lägg till alla rekommenderade',
    adding: (current: number, total: number) => `Lägger till ${current} av ${total}...`,
    done: 'Alla källor tillagda!',
    back: 'Tillbaka',
    next: 'Nästa',
    skip: 'Hoppa över',
    noMatches: 'Inga källor matchar ditt urval. Försök ändra jurisdiktioner eller bransch.',
    cannotAdd: 'Du har nått din URL-gräns. Uppgradera för att lägga till fler.',
  },
};

export default function ComplianceOnboarding({ existingUrlCount, canAdd }: Props) {
  const { locale } = useLocale();
  const router = useRouter();
  const tx = locale === 'sv' ? i18n.sv : i18n.en;

  const [step, setStep] = useState<Step>(1);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Set<Jurisdiction>>(new Set());
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addProgress, setAddProgress] = useState({ current: 0, total: 0 });
  const [isDone, setIsDone] = useState(false);
  const [visible, setVisible] = useState(true);

  const toggleJurisdiction = useCallback((j: Jurisdiction) => {
    setSelectedJurisdictions(prev => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j); else next.add(j);
      return next;
    });
  }, []);

  const matched = useMemo(() => {
    if (selectedJurisdictions.size === 0 || !selectedSector) return [];
    return suggestions.filter(
      s => selectedJurisdictions.has(s.jurisdiction as Jurisdiction) && s.category === selectedSector
    );
  }, [selectedJurisdictions, selectedSector]);

  const handleAddAll = useCallback(async () => {
    if (!canAdd) return;
    setIsAdding(true);
    const toAdd = matched;
    setAddProgress({ current: 0, total: toAdd.length });

    for (let i = 0; i < toAdd.length; i++) {
      setAddProgress({ current: i + 1, total: toAdd.length });
      const s = toAdd[i];
      try {
        await fetch('/api/urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: s.url,
            name: locale === 'sv' ? s.name_sv : s.name,
            category: s.category,
          }),
        });
      } catch {
        // Fortsätt med nästa även om en misslyckas
      }
    }

    setIsAdding(false);
    setIsDone(true);
    router.refresh();
  }, [canAdd, matched, locale, router]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      {/* Stegindikator */}
      <div className="mb-5 flex items-center justify-center gap-2">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-colors ${
              s === step ? 'bg-blue-600' : s < step ? 'bg-blue-300' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Steg 1: Jurisdiktioner */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{tx.step1Title}</h3>
          <p className="mb-4 text-sm text-slate-500">{tx.step1Sub}</p>
          <div className="flex flex-wrap gap-2">
            {JURISDICTIONS.map(j => (
              <button
                key={j}
                type="button"
                onClick={() => toggleJurisdiction(j)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedJurisdictions.has(j)
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Steg 2: Bransch */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{tx.step2Title}</h3>
          <p className="mb-4 text-sm text-slate-500">{tx.step2Sub}</p>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSector(s)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedSector === s
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {locale === 'sv' ? sectorLabels[s].sv : sectorLabels[s].en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Steg 3: Resultat */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{tx.step3Title}</h3>
          <p className="mb-3 text-sm text-slate-500">{tx.step3Sub}</p>

          {matched.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
              {tx.noMatches}
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-blue-600">
                {tx.matchCount(matched.length)}
              </p>
              <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                {matched.map(s => (
                  <li
                    key={s.url}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="mt-0.5 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      {s.jurisdiction}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {locale === 'sv' ? s.name_sv : s.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {locale === 'sv' ? s.description_sv : s.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {!canAdd ? (
                <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
                  {tx.cannotAdd}
                </p>
              ) : isDone ? (
                <p className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
                  {tx.done}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleAddAll}
                  disabled={isAdding}
                  className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {isAdding ? tx.adding(addProgress.current, addProgress.total) : tx.addAll}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Navigering */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClose}
          className="cursor-pointer text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          {tx.skip}
        </button>
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {tx.back}
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((step + 1) as Step)}
              disabled={step === 1 && selectedJurisdictions.size === 0}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {tx.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
