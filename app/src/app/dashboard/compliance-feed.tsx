'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '../locale-provider';

interface ComplianceEntry {
  id: number;
  url: string;
  name: string;
  summary: string | null;
  importance: number | null;
  changed_elements: string | null;
  checked_at: string;
  jurisdiction: string | null;
  document_type: string | null;
  compliance_action: string | null;
  reviewed_at: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
}

type ActionFilter = 'all' | 'action_required' | 'review_recommended' | 'info_only';

const actionColors: Record<string, { badge: string; dot: string }> = {
  action_required: { badge: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
  review_recommended: { badge: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  info_only: { badge: 'text-slate-600 bg-slate-100', dot: 'bg-slate-500' },
};

const actionLabels: Record<string, { en: string; sv: string }> = {
  action_required: { en: 'Action required', sv: 'Åtgärd krävs' },
  review_recommended: { en: 'Review recommended', sv: 'Granskning rekommenderas' },
  info_only: { en: 'Info only', sv: 'Endast information' },
};

const actionTooltips: Record<string, { en: string; sv: string }> = {
  action_required: { en: 'This change likely requires you to take action — update a process, notify stakeholders, or adjust compliance.', sv: 'Denna ändring kräver sannolikt åtgärd — uppdatera en process, informera intressenter eller justera efterlevnad.' },
  review_recommended: { en: 'This change should be reviewed to determine if it affects your operations. May not require immediate action.', sv: 'Denna ändring bör granskas för att avgöra om den påverkar er verksamhet. Kräver kanske inte omedelbar åtgärd.' },
  info_only: { en: 'Informational change — format update, minor correction, or cosmetic change. Typically no action needed.', sv: 'Informationsändring — formatuppdatering, mindre korrigering eller kosmetisk ändring. Normalt ingen åtgärd krävs.' },
};

const docTypeLabels: Record<string, { en: string; sv: string }> = {
  regulation: { en: 'Regulation', sv: 'Föreskrift' },
  guidance: { en: 'Guidance', sv: 'Vägledning' },
  consultation: { en: 'Consultation', sv: 'Remiss' },
  decision: { en: 'Decision', sv: 'Beslut' },
  standard: { en: 'Standard', sv: 'Standard' },
  law: { en: 'Law', sv: 'Lag' },
};

function ActionBadge({ action, locale }: { action: string; locale: string }) {
  const colors = actionColors[action] || actionColors.info_only;
  const label = actionLabels[action]?.[locale as 'en' | 'sv'] || action;
  const tooltip = actionTooltips[action]?.[locale as 'en' | 'sv'] || '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium cursor-help ${colors.badge}`}
      title={tooltip}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}

export function ComplianceFeed({ history: initialHistory, plan = 'free', slaActionHours = 48, slaReviewHours = 168 }: { history: ComplianceEntry[]; plan?: string; slaActionHours?: number; slaReviewHours?: number }) {
  const { locale } = useLocale();
  const [history, setHistory] = useState(initialHistory);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [assignInput, setAssignInput] = useState('');

  const jurisdictions = useMemo(() => {
    const set = new Set<string>();
    for (const h of history) if (h.jurisdiction) set.add(h.jurisdiction);
    return Array.from(set).sort();
  }, [history]);

  const filtered = useMemo(() => {
    let items = history;
    if (actionFilter !== 'all') items = items.filter(e => e.compliance_action === actionFilter);
    if (jurisdictionFilter) items = items.filter(e => e.jurisdiction === jurisdictionFilter);
    return items;
  }, [history, actionFilter, jurisdictionFilter]);

  const actionCounts = useMemo(() => {
    const counts = { action_required: 0, review_recommended: 0, info_only: 0 };
    for (const h of history) {
      const a = h.compliance_action as keyof typeof counts;
      if (a && a in counts) counts[a]++;
    }
    return counts;
  }, [history]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markReviewed = async (changeId: number) => {
    setReviewing(changeId);
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId }),
    });
    if (res.ok) {
      setHistory((prev) =>
        prev.map((e) => e.id === changeId ? { ...e, reviewed_at: new Date().toISOString() } : e)
      );
    }
    setReviewing(null);
  };

  const handleAssign = async (changeId: number, assignedTo: string) => {
    setAssigning(changeId);
    const res = await fetch('/api/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeId, assignedTo: assignedTo || null }),
    });
    if (res.ok) {
      setHistory((prev) =>
        prev.map((e) => e.id === changeId
          ? { ...e, assigned_to: assignedTo || null, assigned_at: assignedTo ? new Date().toISOString() : null }
          : e)
      );
      setAssignInput('');
    }
    setAssigning(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'Z').toLocaleString(locale === 'sv' ? 'sv-SE' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  if (history.length === 0) {
    return (
      <div className="space-y-4">
        {/* Ghost preview — visar hur en compliance-ändring ser ut */}
        <div className="rounded-xl border border-dashed border-slate-200 p-4 opacity-50 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {locale === 'sv' ? 'Åtgärd krävs' : 'Action required'}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">SE</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">{locale === 'sv' ? 'Föreskrift' : 'Regulation'}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Finansinspektionen</p>
          <p className="text-sm text-slate-600 mt-1">
            {locale === 'sv'
              ? '"Nya krav på AML-rapportering publicerade. Ikraftträdande: 1 juli 2026."'
              : '"New AML reporting requirements published. Effective date: July 1, 2026."'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-red-500 font-medium">9/10</span>
            <span>fi.se</span>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-sm font-medium text-slate-600">
            {locale === 'sv' ? 'Så kommer dina regulatoriska ändringar att se ut' : 'This is what your regulatory changes will look like'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {locale === 'sv'
              ? 'Lägg till myndigheter under Upptäck för att börja bevaka.'
              : 'Add agencies from Discover below to start monitoring.'}
          </p>
        </div>
      </div>
    );
  }

  const filterBtnCls = (active: boolean) =>
    `cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <div className="space-y-3">
      {/* Stats strip */}
      <div className="flex gap-3">
        {actionCounts.action_required > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-600">{actionCounts.action_required}</span>
            <span className="text-xs text-red-600/70">{locale === 'sv' ? 'kräver åtgärd' : 'need action'}</span>
          </div>
        )}
        {actionCounts.review_recommended > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-amber-600">{actionCounts.review_recommended}</span>
            <span className="text-xs text-amber-600/70">{locale === 'sv' ? 'att granska' : 'to review'}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setActionFilter('all')} className={filterBtnCls(actionFilter === 'all')}>
          {locale === 'sv' ? 'Alla' : 'All'} ({history.length})
        </button>
        <button onClick={() => setActionFilter('action_required')} className={filterBtnCls(actionFilter === 'action_required')}>
          {locale === 'sv' ? 'Åtgärd krävs' : 'Action required'} ({actionCounts.action_required})
        </button>
        <button onClick={() => setActionFilter('review_recommended')} className={filterBtnCls(actionFilter === 'review_recommended')}>
          {locale === 'sv' ? 'Granska' : 'Review'} ({actionCounts.review_recommended})
        </button>
        <button onClick={() => setActionFilter('info_only')} className={filterBtnCls(actionFilter === 'info_only')}>
          {locale === 'sv' ? 'Info' : 'Info'} ({actionCounts.info_only})
        </button>

        {jurisdictions.length > 1 && (
          <select
            value={jurisdictionFilter}
            onChange={(e) => setJurisdictionFilter(e.target.value)}
            className="cursor-pointer rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none ml-auto"
          >
            <option value="">{locale === 'sv' ? 'Alla jurisdiktioner' : 'All jurisdictions'}</option>
            {jurisdictions.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        )}

        {(plan === 'pro' || plan === 'team') ? (
          <a
            href={`/api/export/compliance${jurisdictionFilter ? `?jurisdiction=${jurisdictionFilter}` : ''}${actionFilter !== 'all' ? `${jurisdictionFilter ? '&' : '?'}complianceAction=${actionFilter}` : ''}`}
            className="cursor-pointer rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
          >
            {locale === 'sv' ? 'Exportera audit trail' : 'Export audit trail'}
          </a>
        ) : (
          <a
            href="https://buy.polar.sh/polar_cl_JDnQNmWBFMsJp56ntC0GPsweHhIizDVhwWGIk4CAFVF"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
          >
            {locale === 'sv' ? 'Uppgradera för CSV-export' : 'Upgrade for CSV export'}
          </a>
        )}
      </div>

      {/* Entries */}
      <div className="rounded-xl glass-card overflow-hidden divide-y divide-slate-100">
        {filtered.map((entry) => {
          const isOpen = expanded.has(entry.id);
          let elements: string[] = [];
          if (entry.changed_elements) {
            try { elements = JSON.parse(entry.changed_elements); } catch { /* */ }
          }
          const docLabel = entry.document_type
            ? docTypeLabels[entry.document_type]?.[locale as 'en' | 'sv'] || entry.document_type
            : null;

          // SLA overdue check
          const isOverdue = !entry.reviewed_at && entry.compliance_action && entry.checked_at && (() => {
            const ageMs = Date.now() - new Date(entry.checked_at + 'Z').getTime();
            const ageHours = ageMs / 3600000;
            if (entry.compliance_action === 'action_required') return ageHours > slaActionHours;
            if (entry.compliance_action === 'review_recommended') return ageHours > slaReviewHours;
            return false;
          })();

          return (
            <div key={entry.id}>
              <button
                onClick={() => toggleExpand(entry.id)}
                className={`w-full cursor-pointer px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition text-left ${isOverdue ? 'bg-red-50/50' : ''}`}
              >
                <span className="text-xs text-slate-500 w-24 shrink-0">{formatDate(entry.checked_at)}</span>
                {entry.compliance_action && (
                  <ActionBadge action={entry.compliance_action} locale={locale} />
                )}
                {isOverdue && (
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 shrink-0" title={locale === 'sv' ? 'SLA överskriden' : 'SLA overdue'}>
                    ⚠ {locale === 'sv' ? 'Försenad' : 'Overdue'}
                  </span>
                )}
                {entry.jurisdiction && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shrink-0">
                    {entry.jurisdiction}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-900 shrink-0 max-w-[160px] truncate">{entry.name}</span>
                <span className="text-sm text-slate-600 truncate flex-1 min-w-0">
                  {entry.summary || (locale === 'sv' ? 'Ingen sammanfattning' : 'No summary')}
                </span>
                {entry.reviewed_at && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                    ✓
                  </span>
                )}
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-0 ml-28 space-y-2 animate-expand">
                  {entry.summary && (
                    <p className="text-sm text-slate-700 leading-relaxed">{entry.summary}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {entry.importance != null && entry.importance > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 font-medium ${
                        entry.importance >= 7 ? 'text-red-600 bg-red-50'
                          : entry.importance >= 4 ? 'text-orange-600 bg-orange-50'
                          : 'text-green-600 bg-green-50'
                      }`}>
                        {entry.importance}/10
                      </span>
                    )}
                    {docLabel && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{docLabel}</span>
                    )}
                    <a
                      href={entry.url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600/70 hover:text-blue-500 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entry.url}
                    </a>
                  </div>
                  {elements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {elements.map((el, i) => (
                        <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{el}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    {!entry.reviewed_at ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReviewed(entry.id);
                        }}
                        disabled={reviewing === entry.id}
                        className="text-xs text-emerald-600/70 hover:text-emerald-600 transition cursor-pointer disabled:opacity-50"
                      >
                        {reviewing === entry.id
                          ? (locale === 'sv' ? 'Markerar...' : 'Marking...')
                          : (locale === 'sv' ? 'Markera som granskad' : 'Mark as reviewed')}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600/50">
                        {locale === 'sv' ? 'Granskad' : 'Reviewed'} {new Date(entry.reviewed_at + 'Z').toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-US')}
                      </span>
                    )}
                    {plan === 'team' && (
                      entry.assigned_to ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-blue-700">
                            → {entry.assigned_to}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAssign(entry.id, ''); }}
                            className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                          >×</button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="email"
                            placeholder={locale === 'sv' ? 'tilldela@email.se' : 'assign@email.com'}
                            value={assigning === entry.id ? assignInput : ''}
                            onFocus={() => { setAssigning(entry.id); setAssignInput(''); }}
                            onChange={(e) => setAssignInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && assignInput) handleAssign(entry.id, assignInput); }}
                            className="w-36 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                          {assigning === entry.id && assignInput && (
                            <button
                              onClick={() => handleAssign(entry.id, assignInput)}
                              className="text-xs text-blue-600 hover:text-blue-700 transition cursor-pointer"
                            >
                              {locale === 'sv' ? 'Tilldela' : 'Assign'}
                            </button>
                          )}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            {locale === 'sv' ? 'Inga ändringar matchar filtret' : 'No changes match the filter'}
          </div>
        )}
      </div>
    </div>
  );
}
