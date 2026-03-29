'use client';

import { useState, useCallback } from 'react';

interface Props {
  url: string;
  className?: string;
}

export function CopyUrl({ url, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard API not available */ }
  }, [url]);

  return (
    <span className={`inline-flex items-center gap-1 group ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 transition truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
      <button
        onClick={handleCopy}
        className={`cursor-pointer shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'animate-copy-flash' : ''}`}
        title="Copy URL"
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
      </button>
    </span>
  );
}
