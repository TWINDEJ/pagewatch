'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from '../locale-provider';

export function KeyboardShortcutsHelp() {
  const { locale } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '?') {
        e.preventDefault();
        setShow((s) => !s);
      }
      if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!show) return null;

  const shortcuts = [
    { key: '?', desc: locale === 'sv' ? 'Visa/dölj genvägar' : 'Show/hide shortcuts' },
    { key: 'j / k', desc: locale === 'sv' ? 'Nästa/föregående ändring' : 'Next/previous change' },
    { key: 'Enter', desc: locale === 'sv' ? 'Expandera/kollapsa' : 'Expand/collapse' },
    { key: 'r', desc: locale === 'sv' ? 'Markera som granskad' : 'Mark as reviewed' },
    { key: 'Esc', desc: locale === 'sv' ? 'Stäng' : 'Close' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in" onClick={() => setShow(false)}>
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xl w-80" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {locale === 'sv' ? 'Tangentbordsgenvägar' : 'Keyboard shortcuts'}
          </h3>
          <button onClick={() => setShow(false)} className="cursor-pointer text-slate-400 hover:text-slate-700 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-slate-600">{desc}</span>
              <kbd className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-mono text-slate-700">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook som activity-feed använder för j/k/r navigation
export function useActivityKeyboard({
  itemCount,
  onSelect,
  onReview,
}: {
  itemCount: number;
  onSelect: (index: number) => void;
  onReview: (index: number) => void;
}) {
  const [focusIndex, setFocusIndex] = useState(-1);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (itemCount === 0) return;

      if (e.key === 'j') {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = Math.min(prev + 1, itemCount - 1);
          onSelect(next);
          return next;
        });
      } else if (e.key === 'k') {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          onSelect(next);
          return next;
        });
      } else if (e.key === 'r' && focusIndex >= 0) {
        e.preventDefault();
        onReview(focusIndex);
      }
    },
    [itemCount, focusIndex, onSelect, onReview],
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);

  return { focusIndex, setFocusIndex };
}
