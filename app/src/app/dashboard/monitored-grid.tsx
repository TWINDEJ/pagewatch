'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from './toast';
import { useLocale } from '../locale-provider';

interface WatchedUrl {
  id: number;
  url: string;
  name: string;
  active: number;
  threshold: number;
  selector: string | null;
  mobile: number;
  muted: number | null;
  last_checked_at: string | null;
  last_error: string | null;
  consecutive_errors: number | null;
  cookies: string | null;
  headers: string | null;
  last_summary: string | null;
  last_importance: number | null;
  last_change_at: string | null;
}

type SortKey = 'name' | 'changed' | 'importance';

function useTimeAgo() {
  const { t } = useLocale();
  return (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr + 'Z').getTime()) / 1000);
    if (diff < 60) return t('time.justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)}${t('time.mAgo')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}${t('time.hAgo')}`;
    return `${Math.floor(diff / 86400)}${t('time.dAgo')}`;
  };
}

export function MonitoredGrid({ urls }: { urls: WatchedUrl[] }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [removing, setRemoving] = useState<number | null>(null);
  const [muting, setMuting] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('name');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast, show, clear } = useToast();
  const timeAgo = useTimeAgo();

  const sorted = useMemo(() => {
    const items = [...urls];
    switch (sort) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'changed':
        items.sort((a, b) => {
          const aDate = a.last_change_at || '0';
          const bDate = b.last_change_at || '0';
          return bDate.localeCompare(aDate);
        });
        break;
      case 'importance':
        items.sort((a, b) => (b.last_importance ?? 0) - (a.last_importance ?? 0));
        break;
    }
    return items;
  }, [urls, sort]);

  const handleRemove = useCallback(
    async (id: number, name: string) => {
      setRemoving(id);
      const res = await fetch(`/api/urls?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        show(`${t('urls.removed')} "${name}"`, 'success');
        router.refresh();
      } else {
        show('Failed to remove URL', 'error');
      }
      setRemoving(null);
    },
    [router, show, t],
  );

  const handleMute = useCallback(
    async (id: number, name: string, muted: boolean) => {
      setMuting(id);
      const res = await fetch('/api/urls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, muted }),
      });
      if (res.ok) {
        show(muted ? `${t('monitor.muted')}: "${name}"` : `${t('monitor.unmute')}: "${name}"`, 'success');
        router.refresh();
      } else {
        show('Failed', 'error');
      }
      setMuting(null);
    },
    [router, show, t],
  );

  if (urls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{t('urls.empty')}</p>
        <p className="mt-1 text-xs text-slate-600">{t('urls.empty.desc')}</p>
      </div>
    );
  }

  const sortBtnCls = (key: SortKey) =>
    `cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${sort === key ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`;

  return (
    <>
      {/* Sort controls */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setSort('name')} className={sortBtnCls('name')}>
          {t('monitor.sort.name')}
        </button>
        <button onClick={() => setSort('changed')} className={sortBtnCls('changed')}>
          {t('monitor.sort.changed')}
        </button>
        <button onClick={() => setSort('importance')} className={sortBtnCls('importance')}>
          {t('monitor.sort.importance')}
        </button>
      </div>

      {/* Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {sorted.map((u) => {
          const isMuted = u.muted === 1;
          const hasError = u.last_error && (u.consecutive_errors ?? 0) > 0;
          const isWaiting = !u.last_checked_at;
          const statusColor = isMuted
            ? 'bg-slate-600'
            : hasError
              ? 'bg-red-500'
              : isWaiting
                ? 'bg-amber-500'
                : u.active
                  ? 'bg-green-500'
                  : 'bg-slate-600';

          const isExpanded = expandedId === u.id;

          return (
            <div
              key={u.id}
              className={`rounded-xl glass-card p-4 flex flex-col gap-2 cursor-pointer transition-all duration-300 ${isMuted ? 'opacity-50' : ''} ${isExpanded ? 'ring-1 ring-blue-300 sm:col-span-2' : 'hover:bg-slate-50'}`}
              onClick={() => setExpandedId(isExpanded ? null : u.id)}
            >
              {/* Top row: status + name + actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                    {isWaiting && !isMuted && (
                      <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-600 truncate">{u.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {/* Mute toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMute(u.id, u.name, !isMuted); }}
                    disabled={muting === u.id}
                    title={isMuted ? t('monitor.unmute') : t('monitor.mute')}
                    className="cursor-pointer p-1 text-slate-600 transition hover:text-blue-600 disabled:opacity-30"
                  >
                    {muting === u.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : isMuted ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(u.id, u.name); }}
                    disabled={removing === u.id}
                    className="cursor-pointer p-1 text-slate-600 transition hover:text-red-600 disabled:opacity-30"
                  >
                    {removing === u.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Status line */}
              <div className="flex items-center gap-2 flex-wrap">
                {isWaiting && !isMuted && (
                  <span className="text-xs text-amber-600">{t('urls.waiting')}</span>
                )}
                {u.last_checked_at && !hasError && !isMuted && (
                  <span className="text-xs text-slate-600">
                    {t('urls.checked')} {timeAgo(u.last_checked_at)}
                  </span>
                )}
                {hasError && !isMuted && (
                  <span className="text-xs text-red-600">
                    {t('urls.failed')} {u.consecutive_errors}x
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isMuted && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {t('monitor.muted')}
                  </span>
                )}
                {u.selector && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {u.selector}
                  </span>
                )}
                {u.mobile === 1 && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">mobile</span>
                )}
                {(u.cookies || u.headers) && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-600">auth</span>
                )}
              </div>

              {/* Last change summary */}
              {u.last_summary && !hasError && !isMuted && (
                <p className={`text-xs text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-1'}`}>{u.last_summary}</p>
              )}
              {!u.last_summary && u.last_checked_at && !hasError && !isMuted && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('urls.nochanges')}
                </p>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-fade-in">
                  <div>
                    <span className="text-slate-500 block">{locale === 'sv' ? 'Tröskel' : 'Threshold'}</span>
                    <span className="text-slate-700">{u.threshold}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{locale === 'sv' ? 'Min. vikt' : 'Min. importance'}</span>
                    <span className="text-slate-700">{(u as any).min_importance ?? 5}/10</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{locale === 'sv' ? 'Viewport' : 'Viewport'}</span>
                    <span className="text-slate-700">{u.mobile ? 'Mobile' : 'Desktop'}</span>
                  </div>
                  {u.last_importance != null && u.last_importance > 0 && (
                    <div>
                      <span className="text-slate-500 block">{locale === 'sv' ? 'Senaste vikt' : 'Last importance'}</span>
                      <span className={`font-medium ${u.last_importance >= 7 ? 'text-red-600' : u.last_importance >= 4 ? 'text-orange-600' : 'text-green-600'}`}>{u.last_importance}/10</span>
                    </div>
                  )}
                  <div className="col-span-2 sm:col-span-4">
                    <a href={u.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 transition break-all">
                      {u.url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clear} />}
    </>
  );
}
