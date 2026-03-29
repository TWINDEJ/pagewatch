'use client';

import { useLocale } from '../locale-provider';

const steps = [
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    title: { en: 'Add a page to monitor', sv: 'Lägg till en sida att bevaka' },
    desc: { en: 'Paste any URL — a pricing page, terms of service, or status page. Or pick from our suggestions below.', sv: 'Klistra in valfri URL — en prissida, användarvillkor eller statussida. Eller välj bland våra förslag nedan.' },
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    title: { en: 'We check automatically', sv: 'Vi kollar automatiskt' },
    desc: { en: 'Every 6 hours, we take a screenshot and compare it with the previous one.', sv: 'Var 6:e timme tar vi en screenshot och jämför med den förra.' },
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    title: { en: 'AI tells you what changed', sv: 'AI berättar vad som ändrades' },
    desc: { en: 'You get a clear sentence like "Price increased from $29 to $39/mo" — via email or Slack.', sv: 'Du får en tydlig mening som "Priset höjdes från 299 kr till 349 kr/mån" — via mejl eller Slack.' },
  },
];

export function Onboarding() {
  const { locale } = useLocale();

  return (
    <div className="rounded-2xl glass-card p-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-slate-900">
          {locale === 'sv' ? 'Välkommen till changebrief' : 'Welcome to changebrief'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {locale === 'sv' ? 'Tre steg för att börja bevaka webbsidor.' : 'Three steps to start monitoring web pages.'}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {step.icon}
            </div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
              {locale === 'sv' ? `Steg ${i + 1}` : `Step ${i + 1}`}
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{step.title[locale]}</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{step.desc[locale]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
