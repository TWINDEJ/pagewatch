'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from './toast';
import { useLocale } from '../locale-provider';
import suggestionsData from '@/data/suggestions.json';

interface Suggestion {
  url: string; name: string; name_sv: string;
  category: string; description: string; description_sv: string;
}

const suggestions = suggestionsData as Suggestion[];
const categories = ['Swedish Gov', 'Newsrooms', 'Pricing', 'Legal', 'Regulatory', 'Status', 'Standards'];

const categoryColors: Record<string, string> = {
  'Swedish Gov': 'text-yellow-400 bg-yellow-500/10',
  Newsrooms: 'text-pink-400 bg-pink-500/10',
  Pricing: 'text-emerald-400 bg-emerald-500/10',
  Legal: 'text-amber-400 bg-amber-500/10',
  Regulatory: 'text-purple-400 bg-purple-500/10',
  Status: 'text-blue-400 bg-blue-500/10',
  Standards: 'text-cyan-400 bg-cyan-500/10',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Swedish Gov': <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Newsrooms: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  Pricing: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Legal: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Regulatory: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  Status: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Standards: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
};

export function PopularWatchlists({ existingUrls, canAdd }: { existingUrls: string[]; canAdd: boolean }) {
  const { locale, t } = useLocale();
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const { toast, show, clear } = useToast();

  const handleAdd = useCallback(async (s: Suggestion) => {
    if (!canAdd) { show(t('watchlists.upgradeError'), 'error'); return; }
    setAdding(s.url);
    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: s.url, name: locale === 'sv' ? s.name_sv : s.name }),
      });
      if (res.ok) {
        setAdded(prev => new Set(prev).add(s.url));
        show(`${t('watchlists.added')} "${locale === 'sv' ? s.name_sv : s.name}"`, 'success');
        router.refresh();
      } else { const data = await res.json(); show(data.error || 'Failed', 'error'); }
    } catch { show('Network error', 'error'); }
    setAdding(null);
  }, [canAdd, locale, router, show, t]);

  const filtered = activeCategory ? suggestions.filter(s => s.category === activeCategory) : suggestions;
  const visible = expanded ? filtered : filtered.slice(0, 6);
  const hasMore = filtered.length > 6;

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory(null)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${!activeCategory ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {t('watchlists.all')}
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${activeCategory === cat ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((s) => {
            const isExisting = existingUrls.includes(s.url) || added.has(s.url);
            const isAdding = adding === s.url;
            const colors = categoryColors[s.category] || 'text-slate-400 bg-slate-500/10';
            const displayName = locale === 'sv' ? s.name_sv : s.name;
            const displayDesc = locale === 'sv' ? s.description_sv : s.description;

            return (
              <div key={s.url} className="flex items-start justify-between gap-3 rounded-xl glass-card p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md ${colors}`}>{categoryIcons[s.category]}</span>
                    <span className="text-sm font-medium text-white/90 truncate">{displayName}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{displayDesc}</p>
                </div>
                <button onClick={() => handleAdd(s)} disabled={isExisting || isAdding}
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${isExisting ? 'bg-white/5 text-slate-600' : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'} disabled:cursor-default`}>
                  {isExisting ? t('watchlists.added') : isAdding ? '...' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <button onClick={() => setExpanded(!expanded)}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors duration-200">
            {expanded ? t('watchlists.showLess') : `${t('watchlists.showAll')} ${suggestions.length} ${t('watchlists.suggestions')}`}
            <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clear} />}
    </>
  );
}
