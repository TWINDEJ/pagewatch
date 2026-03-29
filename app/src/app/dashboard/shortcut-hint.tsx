'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '../locale-provider';

export function ShortcutHint() {
  const { locale } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Visa bara vid första besöket
    if (localStorage.getItem('cb-shortcuts-seen')) return;
    const timer = setTimeout(() => setShow(true), 3000); // Vänta 3s
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('cb-shortcuts-seen', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 animate-fade-in">
      <button
        onClick={() => {
          dismiss();
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
        }}
        className="flex items-center gap-2 cursor-pointer rounded-xl glass-card px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700 transition-all shadow-lg group"
      >
        <kbd className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-slate-600 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">?</kbd>
        <span>{locale === 'sv' ? 'Tangentbordsgenvägar' : 'Keyboard shortcuts'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="cursor-pointer ml-1 opacity-40 hover:opacity-100 transition-opacity"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </button>
    </div>
  );
}
