'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from './toast';
import { useLocale } from '../locale-provider';

interface WatchedUrl {
  id: number; url: string; name: string; active: number; threshold: number;
  selector: string | null; mobile: number;
  last_checked_at: string | null; last_error: string | null; consecutive_errors: number | null;
  cookies: string | null; headers: string | null;
  last_summary: string | null; last_importance: number | null; last_change_at: string | null;
}

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

export function UrlList({ urls }: { urls: WatchedUrl[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [removing, setRemoving] = useState<number | null>(null);
  const { toast, show, clear } = useToast();
  const timeAgo = useTimeAgo();

  const handleRemove = useCallback(async (id: number, name: string) => {
    setRemoving(id);
    const res = await fetch(`/api/urls?id=${id}`, { method: 'DELETE' });
    if (res.ok) { show(`${t('urls.removed')} "${name}"`, 'success'); router.refresh(); }
    else { show('Failed to remove URL', 'error'); }
    setRemoving(null);
  }, [router, show, t]);

  if (urls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{t('urls.empty')}</p>
        <p className="mt-1 text-xs text-slate-600">{t('urls.empty.desc')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {urls.map((u) => {
          const hasError = u.last_error && (u.consecutive_errors ?? 0) > 0;
          const isWaiting = !u.last_checked_at;
          const statusColor = hasError ? 'bg-red-500' : isWaiting ? 'bg-amber-500' : u.active ? 'bg-green-500' : 'bg-slate-600';
          return (
            <div key={u.id} className="rounded-xl glass-card px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                    {isWaiting && <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping opacity-40" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{u.url}</p>
                      {isWaiting && (
                        <span className="shrink-0 text-xs text-amber-600">{t('urls.waiting')}</span>
                      )}
                      {u.last_checked_at && !hasError && (
                        <span className="shrink-0 text-xs text-slate-600">{t('urls.checked')} {timeAgo(u.last_checked_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {u.selector && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{u.selector}</span>}
                  {u.mobile === 1 && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">mobile</span>}
                  {(u.cookies || u.headers) && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-600">auth</span>}
                  <button onClick={() => handleRemove(u.id, u.name)} disabled={removing === u.id}
                    className="cursor-pointer text-slate-400 transition hover:text-red-600 disabled:opacity-30">
                    {removing === u.id ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    )}
                  </button>
                </div>
              </div>
              {hasError && (
                <p className="mt-2 ml-6.5 text-xs text-red-600">
                  {t('urls.failed')} {u.consecutive_errors}x: {u.last_error?.slice(0, 80)}
                </p>
              )}
              {u.last_summary && !hasError && (
                <div className="mt-2 ml-6.5 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  {u.last_importance != null && u.last_importance > 0 && (
                    <span className={`shrink-0 mt-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      u.last_importance >= 7 ? 'text-red-700 bg-red-50' :
                      u.last_importance >= 4 ? 'text-orange-700 bg-orange-50' :
                      'text-green-700 bg-green-50'
                    }`}>
                      {u.last_importance}/10
                    </span>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{u.last_summary}</p>
                </div>
              )}
              {!u.last_summary && u.last_checked_at && !hasError && (
                <p className="mt-2 ml-6.5 text-xs text-slate-600 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {t('urls.nochanges')}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clear} />}
    </>
  );
}
