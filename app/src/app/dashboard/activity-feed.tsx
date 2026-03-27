'use client';

import { useState, useMemo } from 'react';
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

type Filter = 'all' | 'high' | 'medium';

function ImportanceDot({ importance }: { importance: number | null }) {
  if (importance == null || importance <= 0) {
    return <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-600" />;
  }
  const color =
    importance >= 7
      ? 'bg-red-500'
      : importance >= 4
        ? 'bg-orange-500'
        : 'bg-emerald-500';
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

export function ActivityFeed({ history: initialHistory, plan = 'free' }: { history: ChangeEntry[]; plan?: string }) {
  const { t, locale } = useLocale();
  const [history, setHistory] = useState(initialHistory);
  const [filter, setFilter] = useState<Filter>('all');
  const [urlFilter, setUrlFilter] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  const uniquePages = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of history) map.set(h.url, h.name);
    return Array.from(map.entries());
  }, [history]);

  const filtered = useMemo(() => {
    let items = history;
    if (filter === 'high') items = items.filter((e) => (e.importance ?? 0) >= 7);
    if (filter === 'medium') items = items.filter((e) => {
      const imp = e.importance ?? 0;
      return imp >= 4 && imp <= 6;
    });
    if (urlFilter) items = items.filter((e) => e.url === urlFilter);
    return items;
  }, [history, filter, urlFilter]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteGroup = async (url: string) => {
    if (!confirm(locale === 'sv' ? 'Ta bort all historik for denna sida?' : 'Delete all history for this page?')) return;
    setDeleting(url);
    const res = await fetch(`/api/history?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
    if (res.ok) {
      setHistory((prev) => prev.filter((e) => e.url !== url));
    }
    setDeleting(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'Z').toLocaleString(locale === 'sv' ? 'sv-SE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const filterBtnCls = (active: boolean) =>
    `cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('all')} className={filterBtnCls(filter === 'all')}>
          {t('feed.all')}
        </button>
        <button onClick={() => setFilter('high')} className={filterBtnCls(filter === 'high')}>
          {t('feed.high')}
        </button>
        <button onClick={() => setFilter('medium')} className={filterBtnCls(filter === 'medium')}>
          {t('feed.medium')}
        </button>
        {plan === 'pro' || plan === 'team' ? (
          <a
            href="/api/export"
            className="ml-auto cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            {t('export.csv')}
          </a>
        ) : (
          <span
            className="ml-auto rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 cursor-not-allowed"
            title={t('export.pro')}
          >
            {t('export.csv')}
          </span>
        )}
        {uniquePages.length > 1 && (
          <select
            value={urlFilter}
            onChange={(e) => setUrlFilter(e.target.value)}
            className="cursor-pointer rounded-lg bg-white/5 border border-white/5 px-3 py-1.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="">{t('feed.filter.url')}</option>
            {uniquePages.map(([url, name]) => (
              <option key={url} value={url}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Entries */}
      <div className="rounded-xl glass-card overflow-hidden divide-y divide-white/[0.03]">
        {filtered.map((entry) => {
          const isOpen = expanded.has(entry.id);
          let elements: string[] = [];
          if (entry.changed_elements) {
            try {
              elements = JSON.parse(entry.changed_elements);
            } catch {
              /* */
            }
          }

          return (
            <div key={entry.id}>
              <button
                onClick={() => toggleExpand(entry.id)}
                className="w-full cursor-pointer px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.02] transition text-left"
              >
                <span className="text-xs text-slate-600 w-28 shrink-0">{formatDate(entry.checked_at)}</span>
                <ImportanceDot importance={entry.importance} />
                <span className="text-sm font-medium text-slate-300 shrink-0 max-w-[140px] truncate">{entry.name}</span>
                <span className="text-sm text-slate-400 truncate flex-1 min-w-0">
                  {entry.summary || (locale === 'sv' ? 'Ingen signifikant andring' : 'No significant change')}
                </span>
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-0 ml-32 space-y-2">
                  {entry.summary && (
                    <p className="text-sm text-slate-300 leading-relaxed">{entry.summary}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    {entry.importance != null && entry.importance > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-medium ${
                          entry.importance >= 7
                            ? 'text-red-400 bg-red-500/20'
                            : entry.importance >= 4
                              ? 'text-orange-400 bg-orange-500/20'
                              : 'text-green-400 bg-green-500/20'
                        }`}
                      >
                        {entry.importance}/10
                      </span>
                    )}
                    <span>{entry.change_percent.toFixed(1)}% diff</span>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400/70 hover:text-blue-300 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entry.url}
                    </a>
                  </div>
                  {elements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {elements.map((el, i) => (
                        <span key={i} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                          {el}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGroup(entry.url);
                    }}
                    disabled={deleting === entry.url}
                    className="text-xs text-slate-600 hover:text-red-400 transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting === entry.url
                      ? locale === 'sv'
                        ? 'Tar bort...'
                        : 'Deleting...'
                      : locale === 'sv'
                        ? 'Ta bort historik'
                        : 'Delete history'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-600">
            {locale === 'sv' ? 'Inga andringer matchar filtret' : 'No changes match the filter'}
          </div>
        )}
      </div>
    </div>
  );
}
