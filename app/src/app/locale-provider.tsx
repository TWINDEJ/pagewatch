'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { type Locale, type TranslationKey, t as translate } from '@/lib/i18n';

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }, []);

  const t = useCallback((key: TranslationKey) => translate(key, locale), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'sv' : 'en')}
      className="cursor-pointer rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200"
      title={locale === 'en' ? 'Byt till svenska' : 'Switch to English'}
    >
      {locale === 'en' ? 'SV' : 'EN'}
    </button>
  );
}
