'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from './toast';
import { useLocale } from '../locale-provider';

interface CookieRow { name: string; value: string; domain: string }
interface HeaderRow { key: string; value: string }

function CookieFields({ cookies, onChange }: { cookies: CookieRow[]; onChange: (c: CookieRow[]) => void }) {
  const { t } = useLocale();
  const add = () => onChange([...cookies, { name: '', value: '', domain: '' }]);
  const remove = (i: number) => onChange(cookies.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof CookieRow, val: string) => {
    const next = [...cookies];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-medium text-slate-400">{t('form.cookies')}</label>
          <p className="text-xs text-slate-600 mt-0.5">{t('form.cookies.help')}</p>
        </div>
        <button type="button" onClick={add} className="cursor-pointer text-xs text-blue-400 hover:text-blue-300">{t('form.cookies.add')}</button>
      </div>
      {cookies.map((c, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input placeholder="Name (e.g. session_id)" value={c.name} onChange={e => update(i, 'name', e.target.value)}
            className="flex-1 rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <input placeholder="Value" value={c.value} onChange={e => update(i, 'value', e.target.value)}
            className="flex-1 rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <input placeholder="Domain (e.g. example.com)" value={c.domain} onChange={e => update(i, 'domain', e.target.value)}
            className="w-44 rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <button type="button" onClick={() => remove(i)} className="cursor-pointer text-slate-600 hover:text-red-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function HeaderFields({ headers, onChange }: { headers: HeaderRow[]; onChange: (h: HeaderRow[]) => void }) {
  const { t } = useLocale();
  const add = () => onChange([...headers, { key: '', value: '' }]);
  const remove = (i: number) => onChange(headers.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof HeaderRow, val: string) => {
    const next = [...headers];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-medium text-slate-400">{t('form.headers')}</label>
          <p className="text-xs text-slate-600 mt-0.5">{t('form.headers.help')}</p>
        </div>
        <button type="button" onClick={add} className="cursor-pointer text-xs text-blue-400 hover:text-blue-300">{t('form.headers.add')}</button>
      </div>
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input placeholder="Header name (e.g. Authorization)" value={h.key} onChange={e => update(i, 'key', e.target.value)}
            className="w-56 rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <input placeholder="Value (e.g. Bearer abc123)" value={h.value} onChange={e => update(i, 'value', e.target.value)}
            className="flex-1 rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <button type="button" onClick={() => remove(i)} className="cursor-pointer text-slate-600 hover:text-red-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export function AddUrlForm({ canAdd, plan = 'free' }: { canAdd: boolean; plan?: string }) {
  const { t } = useLocale();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selector, setSelector] = useState('');
  const [cookies, setCookies] = useState<CookieRow[]>([]);
  const [headers, setHeaders] = useState<HeaderRow[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast, show, clear } = useToast();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !name) return;
    setLoading(true);

    const validCookies = cookies.filter(c => c.name && c.value && c.domain);
    const validHeaders = headers.filter(h => h.key && h.value);
    const headersObj = validHeaders.length > 0
      ? Object.fromEntries(validHeaders.map(h => [h.key, h.value]))
      : undefined;

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url, name,
          selector: selector || undefined,
          cookies: validCookies.length > 0 ? JSON.stringify(validCookies) : undefined,
          headers: headersObj ? JSON.stringify(headersObj) : undefined,
          webhookUrl: webhookUrl || undefined,
        }),
      });

      if (res.ok) {
        show(t('form.success'), 'success');
        setUrl(''); setName(''); setSelector(''); setCookies([]); setHeaders([]); setWebhookUrl('');
        setShowAdvanced(false);
        router.refresh();
      } else {
        const data = await res.json();
        show(data.error || 'Failed to add URL', 'error');
      }
    } catch { show('Network error', 'error'); }
    setLoading(false);
  }, [url, name, selector, cookies, headers, webhookUrl, router, show, t]);

  if (!canAdd) {
    return (
      <div className="rounded-xl glass-card p-6 text-center">
        <p className="text-sm text-slate-400">{t('form.limit')}</p>
        <a href="https://buy.polar.sh/polar_cl_JDnQNmWBFMsJp56ntC0GPsweHhIizDVhwWGIk4CAFVF" className="mt-2 inline-block text-sm font-medium text-blue-400 hover:text-blue-300">
          {t('form.upgrade')} &rarr;
        </a>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="url" placeholder={t('form.placeholder.url')} value={url} onChange={(e) => setUrl(e.target.value)} required
            className="flex-1 rounded-xl glass px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none" />
          <input type="text" placeholder={t('form.placeholder.name')} value={name} onChange={(e) => setName(e.target.value)} required
            className="sm:w-64 rounded-xl glass px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none" />
          <button type="submit" disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 text-sm font-medium text-white transition disabled:opacity-50">
            {loading ? <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : t('form.add')}
          </button>
        </div>

        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors duration-200">
          <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          {showAdvanced ? t('form.advanced.hide') : t('form.advanced')}
        </button>

        {showAdvanced && (
          <div className="rounded-xl glass-card p-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('form.selector')}</label>
              <input type="text" placeholder="e.g. #pricing-table or .main-content" value={selector} onChange={(e) => setSelector(e.target.value)}
                className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
              <p className="mt-1 text-xs text-slate-600">{t('form.selector.help')}</p>
            </div>
            <CookieFields cookies={cookies} onChange={setCookies} />
            <HeaderFields headers={headers} onChange={setHeaders} />
            {(plan === 'pro' || plan === 'team') ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('form.webhook')}</label>
                <input
                  type="url"
                  placeholder="https://your-app.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-600">{t('form.webhook.help')}</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('form.webhook')}</label>
                <p className="text-xs text-slate-600">{t('form.webhook.pro')}</p>
              </div>
            )}
          </div>
        )}
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clear} />}
    </>
  );
}
