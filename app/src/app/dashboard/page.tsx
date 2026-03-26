import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserByEmail, getWatchedUrls, getChangeHistory, getUrlLimit } from '@/lib/db';
import { AddUrlForm } from './add-url-form';
import { UrlList } from './url-list';
import { ChangeLog } from './change-log';
import { SignOutButton } from './sign-out-button';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect('/login');

  const urls = await getWatchedUrls(user.id as string) as any[];
  const history = await getChangeHistory(user.id as string, 20) as any[];
  const urlLimit = getUrlLimit(user.plan as string);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">
            change<span className="text-blue-500">brief</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
              {user.plan === 'free' ? 'Free' : user.plan === 'pro' ? 'Pro' : 'Team'}
            </span>
            <span className="text-sm text-slate-400">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Lägg till URL */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Bevakade sidor</h2>
            <span className="text-sm text-slate-500">{urls.length} / {urlLimit}</span>
          </div>
          <AddUrlForm canAdd={urls.length < urlLimit} />
        </section>

        {/* URL-lista */}
        <section>
          <UrlList urls={urls} />
        </section>

        {/* Ändringslogg */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Senaste ändringar</h2>
          <ChangeLog history={history} />
        </section>
      </main>
    </div>
  );
}
