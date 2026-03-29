import { StatsSkeleton, FeedSkeleton, GridSkeleton } from './skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header skeleton */}
      <header className="relative border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              change<span className="text-blue-600">brief</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-6 w-16 rounded-full bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <StatsSkeleton />
        <section>
          <div className="h-5 w-24 rounded bg-slate-200 mb-1 animate-pulse" />
          <div className="h-3 w-56 rounded bg-slate-200 mb-4 animate-pulse" />
          <FeedSkeleton rows={5} />
        </section>
        <section>
          <div className="h-5 w-32 rounded bg-slate-200 mb-3 animate-pulse" />
          <GridSkeleton items={4} />
        </section>
      </main>
    </div>
  );
}
