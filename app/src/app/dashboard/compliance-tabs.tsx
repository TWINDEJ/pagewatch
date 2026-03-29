'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocale } from '../locale-provider';

interface Props {
  feedContent: ReactNode;
  overviewContent: ReactNode;
  trendContent: ReactNode | null;
}

type Tab = 'changes' | 'sources' | 'trend';

export function ComplianceTabs({ feedContent, overviewContent, trendContent }: Props) {
  const { locale, t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('changes');
  const [rssCopied, setRssCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cb-compliance-tab') as Tab | null;
    if (saved && ['changes', 'sources', 'trend'].includes(saved)) setActiveTab(saved);
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem('cb-compliance-tab', tab);
  };

  const copyRssUrl = useCallback(() => {
    const url = `${window.location.origin}/api/feed`;
    navigator.clipboard.writeText(url);
    setRssCopied(true);
    setTimeout(() => setRssCopied(false), 2000);
  }, []);

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'changes', label: t('ctabs.changes'), show: true },
    { key: 'sources', label: t('ctabs.sources'), show: true },
    { key: 'trend', label: t('ctabs.trend'), show: !!trendContent },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('ctabs.title')}
          </h2>
          <button
            onClick={copyRssUrl}
            title={rssCopied ? (locale === 'sv' ? 'Kopierat!' : 'Copied!') : (locale === 'sv' ? 'Kopiera RSS-URL' : 'Copy RSS feed URL')}
            className="cursor-pointer flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            {rssCopied ? (locale === 'sv' ? 'Kopierat!' : 'Copied!') : 'RSS'}
          </button>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {tabs.filter(tab => tab.show).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'changes' && feedContent}
      {activeTab === 'sources' && overviewContent}
      {activeTab === 'trend' && trendContent}
    </div>
  );
}
