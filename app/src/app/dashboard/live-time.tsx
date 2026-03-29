'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '../locale-provider';

interface Props {
  dateStr: string;
  className?: string;
}

function formatRelative(dateStr: string, locale: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z').getTime()) / 1000);
  const sv = locale === 'sv';
  if (diff < 60) return sv ? 'nyss' : 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}${sv ? ' min sedan' : 'm ago'}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${sv ? 'h sedan' : 'h ago'}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}${sv ? 'd sedan' : 'd ago'}`;
  return new Date(dateStr + 'Z').toLocaleDateString(sv ? 'sv-SE' : 'en-US', { month: 'short', day: 'numeric' });
}

export function LiveTime({ dateStr, className = '' }: Props) {
  const { locale } = useLocale();
  const [text, setText] = useState(() => formatRelative(dateStr, locale));

  useEffect(() => {
    const interval = setInterval(() => {
      setText(formatRelative(dateStr, locale));
    }, 60000); // Uppdatera varje minut
    return () => clearInterval(interval);
  }, [dateStr, locale]);

  return (
    <time
      dateTime={dateStr}
      title={new Date(dateStr + 'Z').toLocaleString(locale === 'sv' ? 'sv-SE' : 'en-US')}
      className={className}
    >
      {text}
    </time>
  );
}
