import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserByEmail, getWatchedUrls, getChangeHistory, getComplianceHistory, getComplianceTrend, getComplianceOverview, getUrlLimit, getDashboardStats, getComplianceActionSummary } from '@/lib/db';
import { t, type Locale } from '@/lib/i18n';
import { Onboarding } from './onboarding';
import { AddUrlForm } from './add-url-form';
import { MonitoredGrid } from './monitored-grid';
import { ActivityFeed } from './activity-feed';
import { PopularWatchlists } from './popular-watchlists';
import { ComplianceFeed } from './compliance-feed';
import { ComplianceTrend } from './compliance-trend';
import { ComplianceOverview } from './compliance-overview';
import { ComplianceTabs } from './compliance-tabs';
import { SettingsForm } from './settings-form';
import { SignOutButton } from './sign-out-button';
import { CheckoutToast } from './checkout-toast';
import { SectionErrorBoundary } from './error-boundary';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts';
import { LanguageSwitcher } from '../locale-provider';
import { ComplianceOnboarding } from './compliance-onboarding';

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
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.email) {
    const ref = typeof params.ref === 'string' ? params.ref : '';
    redirect(ref ? `/login?ref=${ref}` : '/login');
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value as Locale) || 'en';

  const checkoutSuccess = params.checkout === 'success';
  const isComplianceRef = params.ref === 'compliance';

  const [urls, history, complianceHistory, trendData, complianceOverview, stats, complianceSummary] = await Promise.all([
    getWatchedUrls(user.id as string) as Promise<any[]>,
    getChangeHistory(user.id as string, 50) as Promise<any[]>,
    getComplianceHistory(user.id as string) as Promise<any[]>,
    getComplianceTrend(user.id as string) as Promise<any[]>,
    getComplianceOverview(user.id as string) as Promise<any[]>,
    getDashboardStats(user.id as string),
    getComplianceActionSummary(user.id as string),
  ]);
  const urlLimit = getUrlLimit(user.plan as string);
  const planLabel = t(`header.plan.${user.plan as 'free' | 'pro' | 'team'}` as any, locale);
  const isNewUser = urls.length === 0 && history.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Checkout success toast */}
      <CheckoutToast show={checkoutSuccess} />

      {/* Header */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 sm:px-3 py-1 text-xs font-medium text-blue-700">
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
            <a
              href={`mailto:kristian@changebrief.io?subject=${encodeURIComponent(locale === 'sv' ? 'Feedback på changebrief' : 'Feedback on changebrief')}&body=${encodeURIComponent(locale === 'sv'
                ? '1. Vilka sidor/myndigheter bevakar du?\n\n2. Fick du någon ändring klassificerad? Stämde den?\n\n3. Vad saknar du?\n\n4. Skulle du betala för detta? Hur mycket?\n\n5. Vem mer borde testa detta?\n'
                : '1. Which pages/agencies are you monitoring?\n\n2. Did you get any change classified? Was it accurate?\n\n3. What is missing?\n\n4. Would you pay for this? How much?\n\n5. Who else should try this?\n')}`}
              className="group flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-all animate-pulse hover:animate-none"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {locale === 'sv' ? 'Ge feedback' : 'Give feedback'}
            </a>
            <span className="text-sm text-slate-400 hidden md:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* 1. Onboarding for new users */}
        {isNewUser && isComplianceRef ? (
          <section>
            <ComplianceOnboarding existingUrlCount={urls.length} canAdd={urls.length < urlLimit} />
          </section>
        ) : isNewUser ? (
          <section>
            <Onboarding />
          </section>
        ) : null}

        {/* 2. Stats bar — compliance summary or generic */}
        {urls.length > 0 && (
          <section className="space-y-3">
            {/* Compliance action summary (shown when compliance data exists) */}
            {complianceHistory.length > 0 && (complianceSummary.actionRequired > 0 || complianceSummary.reviewRecommended > 0 || complianceSummary.reviewedThisWeek > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-xs text-red-600/70 font-medium">{locale === 'sv' ? 'Åtgärd krävs' : 'Action required'}</p>
                  <p className="mt-1 text-2xl font-bold text-red-700">{complianceSummary.actionRequired}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs text-amber-600/70 font-medium">{locale === 'sv' ? 'Granska' : 'Review'}</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">{complianceSummary.reviewRecommended}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <p className="text-xs text-emerald-600/70 font-medium">{locale === 'sv' ? 'Granskade (7d)' : 'Reviewed (7d)'}</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{complianceSummary.reviewedThisWeek}</p>
                </div>
                <div className="rounded-xl glass-card px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium">{t('stats.lastcheck', locale)}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatLastCheck(stats.lastCheck, locale)}</p>
                </div>
              </div>
            )}
            {/* Generic stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl glass-card px-4 py-3">
                <p className="text-xs text-slate-500 font-medium">{t('stats.pages', locale)}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{urls.length}<span className="text-sm font-normal text-slate-500">/{urlLimit}</span></p>
              </div>
              <div className="rounded-xl glass-card px-4 py-3">
                <p className="text-xs text-slate-500 font-medium">{t('stats.changes', locale)}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {stats.significantChanges7d > 0 ? (
                    <span className="text-orange-600">{stats.significantChanges7d}</span>
                  ) : (
                    <span className="text-emerald-600">0</span>
                  )}
                </p>
              </div>
              <div className="rounded-xl glass-card px-4 py-3">
                <p className="text-xs text-slate-500 font-medium">{t('stats.checks', locale)}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalChecks7d}</p>
              </div>
              {!(complianceHistory.length > 0 && (complianceSummary.actionRequired > 0 || complianceSummary.reviewRecommended > 0 || complianceSummary.reviewedThisWeek > 0)) && (
                <div className="rounded-xl glass-card px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium">{t('stats.lastcheck', locale)}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatLastCheck(stats.lastCheck, locale)}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2b. Pending first check indicator */}
        {urls.length > 0 && urls.some((u: any) => !u.last_checked_at) && (
          <section className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-4 w-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {locale === 'sv' ? 'Väntar på första kontrollen' : 'Waiting for first check'}
                </p>
                <p className="text-xs text-blue-700/70 mt-0.5">
                  {locale === 'sv'
                    ? `${urls.filter((u: any) => !u.last_checked_at).length} ${urls.filter((u: any) => !u.last_checked_at).length === 1 ? 'sida' : 'sidor'} kontrolleras inom 6 timmar. Du får ett mejl när resultaten är klara.`
                    : `${urls.filter((u: any) => !u.last_checked_at).length} ${urls.filter((u: any) => !u.last_checked_at).length === 1 ? 'page' : 'pages'} will be checked within 6 hours. We'll email you when results are ready.`}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 3. Activity Feed + Settings gear */}
        {urls.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-slate-900/90">{t('feed.title', locale)}</h2>
              <details className="relative group">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200">
                  <svg className="h-5 w-5 transition-transform duration-300 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </summary>
                <div className="absolute right-0 top-10 z-20 w-80 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xl animate-fade-in">
                  <SettingsForm
                    initialNotifyEmail={user.notify_email !== 0}
                    initialSlackWebhookUrl={(user.slack_webhook_url as string) || ''}
                    initialWeeklyDigest={user.weekly_digest !== 0}
                    initialDigestFrequency={(user.digest_frequency as string) || 'weekly'}
                    initialNotifyActionRequired={(user as any).notify_action_required !== 0}
                    initialNotifyReviewRecommended={(user as any).notify_review_recommended !== 0}
                    initialNotifyInfoOnly={(user as any).notify_info_only === 1}
                    plan={user.plan as string}
                  />
                </div>
              </details>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('feed.desc', locale)}</p>
            <SectionErrorBoundary fallbackTitle={locale === 'sv' ? 'Kunde inte ladda aktivitetsflödet' : 'Could not load activity feed'}>
              <ActivityFeed history={history} plan={user.plan as string} />
            </SectionErrorBoundary>
          </section>
        )}

        {/* 3b. Compliance section (tabbed: Feed + Overview) */}
        {(complianceHistory.length > 0 || complianceOverview.length > 0) && (
          <section>
            <SectionErrorBoundary fallbackTitle={locale === 'sv' ? 'Kunde inte ladda compliance' : 'Could not load compliance'}>
              <ComplianceTabs
                feedContent={<ComplianceFeed history={complianceHistory} plan={user.plan as string} />}
                overviewContent={<ComplianceOverview data={complianceOverview} />}
                trendContent={trendData.length > 0 ? <ComplianceTrend data={trendData} /> : null}
              />
            </SectionErrorBoundary>
          </section>
        )}

        {/* 4. Monitored Pages section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900/90">{t('monitor.title', locale)}</h2>
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
          <SectionErrorBoundary fallbackTitle={locale === 'sv' ? 'Kunde inte ladda bevakade sidor' : 'Could not load monitored pages'}>
            <MonitoredGrid urls={urls} />
          </SectionErrorBoundary>
        </section>

        {/* 5. Discover section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900/90 mb-1">{t('discover.title', locale)}</h2>
          <p className="text-sm text-slate-500 mb-4">{t('discover.desc', locale)}</p>
          <PopularWatchlists
            existingUrls={urls.map((u: any) => u.url)}
            canAdd={urls.length < urlLimit}
          />
        </section>

        {/* Settings moved to gear icon in Activity header */}
      </main>

      <KeyboardShortcutsHelp />
    </div>
  );
}
