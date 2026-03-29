'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '../locale-provider';

export interface ComplianceSource {
  id: number;
  url: string;
  name: string;
  category: string | null;
  jurisdiction: string | null;
  last_change_at: string | null;
  compliance_action: string | null;
  document_type: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  last_summary: string | null;
  importance: number | null;
}

type SortKey = 'name' | 'jurisdiction' | 'last_change_at' | 'compliance_action' | 'status' | 'document_type';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'pending' | 'reviewed';

const actionColors: Record<string, string> = {
  action_required: 'bg-red-50 text-red-700',
  review_recommended: 'bg-amber-50 text-amber-700',
  info_only: 'bg-slate-100 text-slate-600',
};

const actionLabels: Record<string, { en: string; sv: string }> = {
  action_required: { en: 'Action required', sv: 'Åtgärd krävs' },
  review_recommended: { en: 'Review recommended', sv: 'Granskning rekommenderas' },
  info_only: { en: 'Info only', sv: 'Endast information' },
};

const docTypeLabels: Record<string, { en: string; sv: string }> = {
  regulation: { en: 'Regulation', sv: 'Föreskrift' },
  guidance: { en: 'Guidance', sv: 'Vägledning' },
  consultation: { en: 'Consultation', sv: 'Remiss' },
  decision: { en: 'Decision', sv: 'Beslut' },
  standard: { en: 'Standard', sv: 'Standard' },
  law: { en: 'Law', sv: 'Lag' },
};

function relativeTime(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr + 'Z').getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === 'sv') {
    if (diffMin < 1) return 'just nu';
    if (diffMin < 60) return `${diffMin} min sedan`;
    if (diffHrs < 24) return `${diffHrs} tim sedan`;
    if (diffDays < 30) return `${diffDays} dagar sedan`;
    return new Date(dateStr + 'Z').toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  }
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActionBadge({ action, locale }: { action: string; locale: string }) {
  const colors = actionColors[action] || actionColors.info_only;
  const label = actionLabels[action]?.[locale as 'en' | 'sv'] || action;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {label}
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg className="ml-1 inline h-3 w-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return (
    <svg className="ml-1 inline h-3 w-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {dir === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

export function ComplianceOverview({ data }: { data: ComplianceSource[] }) {
  const { locale } = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>('last_change_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const jurisdictions = useMemo(() => {
    const set = new Set<string>();
    for (const s of data) if (s.jurisdiction) set.add(s.jurisdiction);
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let items = data;
    if (jurisdictionFilter) items = items.filter(s => s.jurisdiction === jurisdictionFilter);
    if (statusFilter === 'reviewed') items = items.filter(s => s.reviewed_at);
    if (statusFilter === 'pending') items = items.filter(s => !s.reviewed_at);
    return items;
  }, [data, jurisdictionFilter, statusFilter]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';

      switch (sortKey) {
        case 'name':
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case 'jurisdiction':
          av = (a.jurisdiction || '').toLowerCase();
          bv = (b.jurisdiction || '').toLowerCase();
          break;
        case 'last_change_at':
          av = a.last_change_at || '';
          bv = b.last_change_at || '';
          break;
        case 'compliance_action': {
          const order: Record<string, number> = { action_required: 0, review_recommended: 1, info_only: 2 };
          av = order[a.compliance_action || ''] ?? 3;
          bv = order[b.compliance_action || ''] ?? 3;
          break;
        }
        case 'status':
          av = a.reviewed_at ? 1 : 0;
          bv = b.reviewed_at ? 1 : 0;
          break;
        case 'document_type':
          av = (a.document_type || '').toLowerCase();
          bv = (b.document_type || '').toLowerCase();
          break;
      }

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return items;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const thClass = 'cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors';

  const labels = {
    source: locale === 'sv' ? 'Källa' : 'Source',
    jurisdiction: locale === 'sv' ? 'Jurisdiktion' : 'Jurisdiction',
    lastChange: locale === 'sv' ? 'Senaste ändring' : 'Last Change',
    actionLevel: locale === 'sv' ? 'Åtgärdsnivå' : 'Action Level',
    status: locale === 'sv' ? 'Status' : 'Status',
    documentType: locale === 'sv' ? 'Dokumenttyp' : 'Document Type',
    allJurisdictions: locale === 'sv' ? 'Alla jurisdiktioner' : 'All jurisdictions',
    allStatuses: locale === 'sv' ? 'Alla' : 'All',
    pending: locale === 'sv' ? 'Väntar' : 'Pending',
    reviewed: locale === 'sv' ? 'Granskade' : 'Reviewed',
    print: locale === 'sv' ? 'Skriv ut' : 'Print',
    emptyTitle: locale === 'sv' ? 'Inga compliance-källor ännu' : 'No compliance sources yet',
    emptyDesc: locale === 'sv'
      ? 'Lägg till myndigheter under Upptäck för att börja bevaka.'
      : 'Add regulatory sources from the Discover section to start monitoring.',
    noMatch: locale === 'sv' ? 'Inga källor matchar filtret' : 'No sources match the filter',
    reviewedBy: locale === 'sv' ? 'Granskad av' : 'Reviewed by',
    neverChanged: locale === 'sv' ? 'Ingen ändring ännu' : 'No change yet',
  };

  // Tomt state
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{labels.emptyTitle}</p>
        <p className="mt-1 text-xs text-slate-500">{labels.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters + Print */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={jurisdictionFilter}
          onChange={(e) => setJurisdictionFilter(e.target.value)}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
        >
          <option value="">{labels.allJurisdictions}</option>
          {jurisdictions.map(j => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
        >
          <option value="all">{labels.allStatuses}</option>
          <option value="pending">{labels.pending}</option>
          <option value="reviewed">{labels.reviewed}</option>
        </select>

        <button
          onClick={() => window.print()}
          className="ml-auto cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <svg className="mr-1 inline h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {labels.print}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              <th onClick={() => handleSort('name')} className={thClass}>
                {labels.source}
                <SortIcon active={sortKey === 'name'} dir={sortDir} />
              </th>
              <th onClick={() => handleSort('jurisdiction')} className={thClass}>
                {labels.jurisdiction}
                <SortIcon active={sortKey === 'jurisdiction'} dir={sortDir} />
              </th>
              <th onClick={() => handleSort('last_change_at')} className={thClass}>
                {labels.lastChange}
                <SortIcon active={sortKey === 'last_change_at'} dir={sortDir} />
              </th>
              <th onClick={() => handleSort('compliance_action')} className={thClass}>
                {labels.actionLevel}
                <SortIcon active={sortKey === 'compliance_action'} dir={sortDir} />
              </th>
              <th onClick={() => handleSort('status')} className={thClass}>
                {labels.status}
                <SortIcon active={sortKey === 'status'} dir={sortDir} />
              </th>
              <th onClick={() => handleSort('document_type')} className={thClass}>
                {labels.documentType}
                <SortIcon active={sortKey === 'document_type'} dir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((source) => {
              const docLabel = source.document_type
                ? docTypeLabels[source.document_type]?.[locale as 'en' | 'sv'] || source.document_type
                : '\u2014';

              return (
                <tr key={source.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{source.name}</div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-blue-500 transition-colors truncate block max-w-[240px]"
                    >
                      {source.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {source.jurisdiction ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                        {source.jurisdiction}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {source.last_change_at
                      ? relativeTime(source.last_change_at, locale)
                      : <span className="text-xs text-slate-400">{labels.neverChanged}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {source.compliance_action ? (
                      <ActionBadge action={source.compliance_action} locale={locale} />
                    ) : (
                      <span className="text-xs text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {source.reviewed_at ? (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-emerald-600">
                          {labels.reviewedBy} {source.reviewed_by || ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">{labels.pending}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{docLabel}</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  {labels.noMatch}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {sorted.map((source) => {
          const docLabel = source.document_type
            ? docTypeLabels[source.document_type]?.[locale as 'en' | 'sv'] || source.document_type
            : null;

          return (
            <div
              key={source.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{source.name}</p>
                  {docLabel && (
                    <p className="text-xs text-slate-500 mt-0.5">{docLabel}</p>
                  )}
                </div>
                {source.reviewed_at ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-emerald-600">{labels.reviewed}</span>
                  </div>
                ) : (
                  <span className="shrink-0 text-xs font-medium text-amber-600">{labels.pending}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {source.jurisdiction && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                    {source.jurisdiction}
                  </span>
                )}
                {source.compliance_action && (
                  <ActionBadge action={source.compliance_action} locale={locale} />
                )}
                <span className="text-xs text-slate-400 ml-auto">
                  {source.last_change_at
                    ? relativeTime(source.last_change_at, locale)
                    : labels.neverChanged}
                </span>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {labels.noMatch}
          </div>
        )}
      </div>
    </div>
  );
}
