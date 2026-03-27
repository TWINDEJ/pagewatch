'use client';

import { useState } from 'react';
import { useLocale } from '../locale-provider';

interface ChangeEntry {
  id: number;
  url: string;
  name: string;
  change_percent: number;
  summary: string | null;
  importance: number | null;
  changed_elements: string | null;
  checked_at: string;
}

interface GroupedPage {
  url: string;
  name: string;
  latest: ChangeEntry;
  entries: ChangeEntry[];
}

function groupByPage(history: ChangeEntry[]): GroupedPage[] {
  const map = new Map<string, GroupedPage>();
  for (const entry of history) {
    const existing = map.get(entry.url);
    if (existing) {
      existing.entries.push(entry);
    } else {
      map.set(entry.url, { url: entry.url, name: entry.name, latest: entry, entries: [entry] });
    }
  }
  // Sortera grupper efter senaste ändring
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latest.checked_at).getTime() - new Date(a.latest.checked_at).getTime()
  );
}

function ImportanceBadge({ importance }: { importance: number | null }) {
  if (importance == null || importance <= 0) return null;
  const color = importance >= 7 ? 'text-red-400 bg-red-500/20' :
                importance >= 4 ? 'text-orange-400 bg-orange-500/20' :
                'text-green-400 bg-green-500/20';
  return <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${color}`}>{importance}/10</span>;
}

export function ChangeLog({ history: initialHistory }: { history: ChangeEntry[] }) {
  const { t, locale } = useLocale();
  const [history, setHistory] = useState(initialHistory);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteGroup = async (url: string) => {
    if (!confirm(locale === 'sv' ? `Ta bort all historik för denna sida?` : `Delete all history for this page?`)) return;
    setDeleting(url);
    const res = await fetch(`/api/history?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    if (res.ok) {
      setHistory(prev => prev.filter(e => e.url !== url));
    }
    setDeleting(null);
  };

  const togglePage = (url: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'Z').toLocaleString(locale === 'sv' ? 'sv-SE' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/5 p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
          <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400">{t('changes.empty')}</p>
        <p className="mt-1 text-xs text-slate-600">{t('changes.empty.desc')}</p>
      </div>
    );
  }

  const groups = groupByPage(history);

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = expandedPages.has(group.url);
        const significantEntries = group.entries.filter(e => e.summary);
        const latestSignificant = significantEntries[0];

        return (
          <div key={group.url} className="rounded-xl glass-card overflow-hidden">
            {/* Sidans header — alltid synlig */}
            <button
              onClick={() => togglePage(group.url)}
              className="w-full cursor-pointer px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-white truncate">{group.name}</span>
                {latestSignificant && <ImportanceBadge importance={latestSignificant.importance} />}
                <span className="shrink-0 text-xs text-slate-600">{formatDate(group.latest.checked_at)}</span>
                {significantEntries.length > 0 && (
                  <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-500">
                    {significantEntries.length} {locale === 'sv' ? 'ändr.' : 'changes'}
                  </span>
                )}
              </div>
              <svg className={`h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Senaste ändringen — alltid synlig som preview */}
            {latestSignificant && !isOpen && (
              <div className="px-5 pb-4 -mt-1">
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-1">{latestSignificant.summary}</p>
              </div>
            )}

            {/* Hela loggen — nedfälld */}
            {isOpen && (
              <div className="border-t border-white/5">
                {group.entries.map((entry) => {
                  let elements: string[] = [];
                  if (entry.changed_elements) {
                    try { elements = JSON.parse(entry.changed_elements); } catch { /* */ }
                  }

                  return (
                    <div key={entry.id} className="px-5 py-3 border-b border-white/[0.03] last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">{formatDate(entry.checked_at)}</span>
                        <ImportanceBadge importance={entry.importance} />
                        <span className="text-xs text-slate-700">{entry.change_percent.toFixed(1)}%</span>
                      </div>
                      {entry.summary ? (
                        <p className="mt-1 text-sm text-slate-300 leading-relaxed">{entry.summary}</p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-600">{t('changes.nosignificant')} ({entry.change_percent.toFixed(2)}% {t('changes.pixeldiff')})</p>
                      )}
                      {elements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {elements.map((el, i) => (
                            <span key={i} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">{el}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="px-5 py-2 bg-white/[0.01] flex items-center justify-between">
                  <a href={group.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400/70 hover:text-blue-300 transition">
                    {group.url} &rarr;
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteGroup(group.url); }}
                    disabled={deleting === group.url}
                    className="text-xs text-slate-600 hover:text-red-400 transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting === group.url
                      ? (locale === 'sv' ? 'Tar bort...' : 'Deleting...')
                      : (locale === 'sv' ? 'Ta bort historik' : 'Delete history')}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
