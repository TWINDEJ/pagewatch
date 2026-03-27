import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserByEmail, getWatchedUrls, getChangeHistory, getUrlLimit, getDashboardStats } from '@/lib/db';
import { t, type Locale } from '@/lib/i18n';
import { Onboarding } from './onboarding';
import { AddUrlForm } from './add-url-form';
import { MonitoredGrid } from './monitored-grid';
import { ActivityFeed } from './activity-feed';
import { PopularWatchlists } from './popular-watchlists';
import { SettingsForm } from './settings-form';
import { SignOutButton } from './sign-out-button';
import { CheckoutToast } from './checkout-toast';
import { LanguageSwitcher } from '../locale-provider';

function formatLastCheck(dateStr: string | null, locale: Locale): string {
  if (!dateStr) return t('stats.never', locale);
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z').getTime()) / 1000);
  if (diff < 60) return locale === 'sv' ? 'nyss' : 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}${locale === 'sv' ? ' min sedan' : 'm ago'}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${locale === 'sv' ? 'h sedan' : 'h ago'}`;
  return `${Math.floor(diff / 86400)}${locale === 'sv' ? 'd sedan' : 'd ago'}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value as Locale) || 'en';

  const params = await searchParams;
  const checkoutSuccess = params.checkout === 'success';

  const [urls, history, stats] = await Promise.all([
    getWatchedUrls(user.id as string) as Promise<any[]>,
    getChangeHistory(user.id as string, 50) as Promise<any[]>,
    getDashboardStats(user.id as string),
  ]);
  const urlLimit = getUrlLimit(user.plan as string);
  const planLabel = t(`header.plan.${user.plan as 'free' | 'pro' | 'team'}` as any, locale);
  const isNewUser = urls.length === 0 && history.length === 0;

  return (
    <div className="min-h-screen bg-[#06080f] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 h-[300px] w-[400px] rounded-full bg-blue-600/3 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[200px] w-[300px] rounded-full bg-indigo-600/3 blur-[80px]" />
      </div>

      {/* Checkout success toast */}
      <CheckoutToast show={checkoutSuccess} />

      {/* Header */}
      <header className="relative border-b border-white/5 px-4 sm:px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              change<span className="text-blue-400">brief</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <span className="rounded-full bg-gradient-to-r from-blue-500/15 to-indigo-500/15 px-2.5 sm:px-3 py-1 text-xs font-medium text-blue-300">
              {planLabel}
            </span>
            {user.plan !== 'team' && (
              <a
                href={user.plan === 'pro'
                  ? 'https://buy.polar.sh/polar_cl_HmjMU2dLQz7qe5fAcTjK2SsssRYDPboqXQJXd4QgARz'
                  : 'https://buy.polar.sh/polar_cl_JDnQNmWBFMsJp56ntC0GPsweHhIizDVhwWGIk4CAFVF'}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-2.5 sm:px-3 py-1 text-xs font-medium text-white hover:from-blue-400 hover:to-indigo-400 transition-all"
              >
                {t('header.upgrade', locale)}
              </a>
            )}
            <span className="text-sm text-slate-500 hidden md:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* 1. Onboarding for new users */}
        {isNewUser && (
          <section>
            <Onboarding />
          </section>
        )}

        {/* 2. Stats bar */}
        {urls.length > 0 && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl glass-card px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">{t('stats.pages', locale)}</p>
              <p className="mt-1 text-2xl font-bold text-white">{urls.length}<span className="text-sm font-normal text-slate-600">/{urlLimit}</span></p>
            </div>
            <div className="rounded-xl glass-card px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">{t('stats.changes', locale)}</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {stats.significantChanges7d > 0 ? (
                  <span className="text-orange-400">{stats.significantChanges7d}</span>
                ) : (
                  <span className="text-emerald-400">0</span>
                )}
              </p>
            </div>
            <div className="rounded-xl glass-card px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">{t('stats.checks', locale)}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.totalChecks7d}</p>
            </div>
            <div className="rounded-xl glass-card px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">{t('stats.lastcheck', locale)}</p>
              <p className="mt-1 text-lg font-semibold text-white">{formatLastCheck(stats.lastCheck, locale)}</p>
            </div>
          </section>
        )}

        {/* 3. Activity Feed */}
        {urls.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white/90 mb-1">{t('feed.title', locale)}</h2>
            <p className="text-sm text-slate-500 mb-4">{t('feed.desc', locale)}</p>
            <ActivityFeed history={history} plan={user.plan as string} />
          </section>
        )}

        {/* 4. Monitored Pages section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white/90">{t('monitor.title', locale)}</h2>
              {!isNewUser && (
                <span className="text-sm text-slate-600">{urls.length} / {urlLimit} {t('dashboard.monitored.count', locale)}</span>
              )}
            </div>
          </div>

          {/* Inline Add URL form */}
          <div className="rounded-xl glass-card p-4 mb-4">
            <AddUrlForm canAdd={urls.length < urlLimit} plan={user.plan as string} />
          </div>

          {/* URL grid */}
          <MonitoredGrid urls={urls} />
        </section>

        {/* 5. Discover section */}
        <section>
          <h2 className="text-lg font-semibold text-white/90 mb-1">{t('discover.title', locale)}</h2>
          <p className="text-sm text-slate-500 mb-4">{t('discover.desc', locale)}</p>
          <PopularWatchlists
            existingUrls={urls.map((u: any) => u.url)}
            canAdd={urls.length < urlLimit}
          />
        </section>

        {/* 6. Settings (collapsed) */}
        <section>
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden mb-1">
              <h2 className="text-lg font-semibold text-white/90">{t('dashboard.settings', locale)}</h2>
              <svg className="h-5 w-5 text-slate-600 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-sm text-slate-500 mb-4">{t('dashboard.settings.desc', locale)}</p>
            <div className="rounded-2xl glass-card p-4 sm:p-6">
              <SettingsForm
                initialNotifyEmail={user.notify_email !== 0}
                initialSlackWebhookUrl={(user.slack_webhook_url as string) || ''}
                initialWeeklyDigest={user.weekly_digest !== 0}
                initialDigestFrequency={(user.digest_frequency as string) || 'weekly'}
                plan={user.plan as string}
              />
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}
