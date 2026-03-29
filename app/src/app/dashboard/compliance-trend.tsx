'use client';

import { useMemo } from 'react';
import { useLocale } from '../locale-provider';

interface TrendRow {
  name: string;
  compliance_action: string | null;
  count: number;
  month: string;
}

export function ComplianceTrend({ data }: { data: TrendRow[] }) {
  const { locale } = useLocale();

  // Gruppera per myndighet/källa
  const sources = useMemo(() => {
    const map = new Map<string, { total: number; actionRequired: number; review: number; info: number; months: Set<string> }>();
    for (const row of data) {
      const entry = map.get(row.name) || { total: 0, actionRequired: 0, review: 0, info: 0, months: new Set<string>() };
      const count = Number(row.count);
      entry.total += count;
      if (row.compliance_action === 'action_required') entry.actionRequired += count;
      else if (row.compliance_action === 'review_recommended') entry.review += count;
      else entry.info += count;
      if (row.month) entry.months.add(row.month);
      map.set(row.name, entry);
    }
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats, monthCount: stats.months.size }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  if (sources.length === 0) return null;

  const maxTotal = Math.max(...sources.map(s => s.total), 1);

  return (
    <div className="space-y-3">
      <div className="rounded-xl glass-card overflow-hidden divide-y divide-slate-100">
        {sources.map((source) => {
          const actionPct = (source.actionRequired / source.total) * 100;
          const reviewPct = (source.review / source.total) * 100;
          const infoPct = (source.info / source.total) * 100;
          const barWidth = (source.total / maxTotal) * 100;

          return (
            <div key={source.name} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 truncate">{source.name}</span>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-slate-500">
                    {source.total} {locale === 'sv' ? 'ändringar' : 'changes'}
                  </span>
                  {source.actionRequired > 0 && (
                    <span className="text-red-600 font-medium">{source.actionRequired} {locale === 'sv' ? 'åtgärd' : 'action'}</span>
                  )}
                </div>
              </div>
              {/* Stacked bar */}
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden" style={{ width: `${barWidth}%` }}>
                <div className="h-full flex">
                  {actionPct > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${actionPct}%` }} />}
                  {reviewPct > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${reviewPct}%` }} />}
                  {infoPct > 0 && <div className="bg-slate-600 transition-all duration-500" style={{ width: `${infoPct}%` }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />{locale === 'sv' ? 'Åtgärd krävs' : 'Action required'}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />{locale === 'sv' ? 'Granska' : 'Review'}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-600" />{locale === 'sv' ? 'Info' : 'Info'}</span>
      </div>
    </div>
  );
}
