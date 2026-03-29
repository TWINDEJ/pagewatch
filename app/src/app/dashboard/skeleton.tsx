'use client';

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl glass-card px-4 py-3">
          <div className="h-3 w-16 rounded bg-slate-200 mb-3" />
          <div className="h-7 w-12 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function FeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="rounded-xl glass-card overflow-hidden divide-y divide-slate-100">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div className="h-3 w-24 rounded bg-slate-200 shrink-0" />
            <div className="h-2 w-2 rounded-full bg-slate-200 shrink-0" />
            <div className="h-3 w-28 rounded bg-slate-200 shrink-0" />
            <div className="h-3 flex-1 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="rounded-xl glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
          <div className="h-3 w-48 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
