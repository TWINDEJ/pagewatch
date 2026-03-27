export type Locale = 'en' | 'sv';

const translations = {
  // ─── Header ───
  'header.plan.free': { en: 'Free', sv: 'Gratis' },
  'header.plan.pro': { en: 'Pro', sv: 'Pro' },
  'header.plan.team': { en: 'Team', sv: 'Team' },
  'header.upgrade': { en: 'Upgrade', sv: 'Uppgradera' },
  'header.signout': { en: 'Sign out', sv: 'Logga ut' },

  // ─── Dashboard sections ───
  'dashboard.monitored': { en: 'Monitored pages', sv: 'Bevakade sidor' },
  'dashboard.monitored.desc': { en: 'Add a URL and we\'ll check it every 6 hours for changes.', sv: 'Lägg till en URL så kollar vi den var 6:e timme efter ändringar.' },
  'dashboard.monitored.count': { en: 'pages used', sv: 'sidor använda' },
  'dashboard.popular': { en: 'Popular watchlists', sv: 'Populära bevakningar' },
  'dashboard.popular.desc': { en: 'One-click add pages that many teams monitor.', sv: 'Lägg till populära sidor med ett klick.' },
  'dashboard.changes': { en: 'Recent changes', sv: 'Senaste ändringar' },
  'dashboard.changes.desc': { en: 'AI-powered summaries of what changed. Score shows how important the change is (1 = minor, 10 = critical).', sv: 'AI-drivna sammanfattningar av vad som ändrades. Poäng visar hur viktig ändringen är (1 = liten, 10 = kritisk).' },
  'dashboard.settings': { en: 'Notification settings', sv: 'Notisinställningar' },
  'dashboard.settings.desc': { en: 'Choose how you want to be notified when changes are detected.', sv: 'Välj hur du vill bli notifierad när ändringar upptäcks.' },

  // ─── Add URL form ───
  'form.placeholder.url': { en: 'https://example.com/pricing', sv: 'https://example.com/pricing' },
  'form.placeholder.name': { en: 'Name (e.g. Stripe Pricing)', sv: 'Namn (t.ex. Stripe Pricing)' },
  'form.add': { en: 'Add', sv: 'Lägg till' },
  'form.success': { en: 'Monitoring started — first check runs within the hour.', sv: 'Bevakning startad — första kontrollen körs inom en timme.' },
  'form.limit': { en: 'You\'ve reached your plan\'s limit of monitored pages.', sv: 'Du har nått din plans gräns för bevakade sidor.' },
  'form.upgrade': { en: 'Upgrade to Pro for 25 pages', sv: 'Uppgradera till Pro för 25 sidor' },
  'form.advanced': { en: 'Advanced: monitor pages behind login, target specific elements', sv: 'Avancerat: bevaka sidor bakom inloggning, rikta mot specifika element' },
  'form.advanced.hide': { en: 'Hide advanced settings', sv: 'Dölj avancerade inställningar' },
  'form.selector': { en: 'CSS selector', sv: 'CSS-selektor' },
  'form.selector.help': { en: 'Only monitor a specific part of the page instead of the whole thing. Leave empty to monitor the full page.', sv: 'Bevaka bara en specifik del av sidan. Lämna tomt för att bevaka hela sidan.' },
  'form.cookies': { en: 'Cookies', sv: 'Cookies' },
  'form.cookies.help': { en: 'For pages behind a login. Find cookies in your browser: Settings → Privacy → Cookies.', sv: 'För sidor bakom inloggning. Hitta cookies i din webbläsare: Inställningar → Integritet → Cookies.' },
  'form.cookies.add': { en: '+ Add cookie', sv: '+ Lägg till cookie' },
  'form.headers': { en: 'HTTP headers', sv: 'HTTP-headers' },
  'form.headers.help': { en: 'Custom headers sent with each request, e.g. API keys or auth tokens.', sv: 'Egna headers som skickas med varje förfrågan, t.ex. API-nycklar eller auth-tokens.' },
  'form.headers.add': { en: '+ Add header', sv: '+ Lägg till header' },

  // ─── URL list ───
  'urls.empty': { en: 'No monitored pages yet', sv: 'Inga bevakade sidor ännu' },
  'urls.empty.desc': { en: 'Add your first URL above or pick from popular watchlists below.', sv: 'Lägg till din första URL ovan eller välj bland populära bevakningar nedan.' },
  'urls.removed': { en: 'Removed', sv: 'Borttagen' },
  'urls.checked': { en: 'Checked', sv: 'Kontrollerad' },
  'urls.waiting': { en: 'Waiting for first check...', sv: 'Väntar på första kontrollen...' },
  'urls.nochanges': { en: 'No changes detected yet', sv: 'Inga ändringar upptäckta ännu' },
  'urls.failed': { en: 'Failed', sv: 'Misslyckades' },

  // ─── Change log ───
  'changes.empty': { en: 'No changes detected yet', sv: 'Inga ändringar upptäckta ännu' },
  'changes.empty.desc': { en: 'Pages are checked every 6 hours. Changes will appear here automatically.', sv: 'Sidor kontrolleras var 6:e timme. Ändringar visas här automatiskt.' },
  'changes.nosignificant': { en: 'No significant change', sv: 'Ingen signifikant ändring' },
  'changes.pixeldiff': { en: 'pixel difference', sv: 'pixelskillnad' },

  // ─── Settings ───
  'settings.email': { en: 'Email notifications', sv: 'E-postnotiser' },
  'settings.email.desc': { en: 'We\'ll email you when a monitored page changes. Sent to your login email.', sv: 'Vi mejlar dig när en bevakad sida ändras. Skickas till din inloggningsadress.' },
  'settings.slack': { en: 'Slack notifications', sv: 'Slack-notiser' },
  'settings.slack.desc': { en: 'Get change alerts in a Slack channel. To get a webhook URL:', sv: 'Få ändringsnotiser i en Slack-kanal. För att få en webhook-URL:' },
  'settings.digest': { en: 'Weekly digest', sv: 'Veckorapport' },
  'settings.digest.desc': { en: 'Receive a summary of all changes every Friday morning, ranked by importance.', sv: 'Få en sammanfattning av alla ändringar varje fredag morgon, rankade efter vikt.' },
  'settings.save': { en: 'Save settings', sv: 'Spara inställningar' },
  'settings.saving': { en: 'Saving...', sv: 'Sparar...' },
  'settings.saved': { en: 'Saved!', sv: 'Sparat!' },

  // ─── Popular watchlists ───
  'watchlists.all': { en: 'All', sv: 'Alla' },
  'watchlists.added': { en: 'Added', sv: 'Tillagd' },
  'watchlists.showAll': { en: 'Show all', sv: 'Visa alla' },
  'watchlists.suggestions': { en: 'suggestions', sv: 'förslag' },
  'watchlists.showLess': { en: 'Show less', sv: 'Visa färre' },
  'watchlists.upgradeError': { en: 'Upgrade to Pro to monitor more pages', sv: 'Uppgradera till Pro för att bevaka fler sidor' },

  // ─── Login ───
  'login.title': { en: 'Sign in to get started', sv: 'Logga in för att komma igång' },
  'login.google': { en: 'Continue with Google', sv: 'Fortsätt med Google' },
  'login.github': { en: 'Continue with GitHub', sv: 'Fortsätt med GitHub' },
  'login.terms': { en: 'By signing in you agree to our terms of service.', sv: 'Genom att logga in godkänner du våra användarvillkor.' },

  // ─── Stats ───
  'stats.pages': { en: 'Monitored', sv: 'Bevakade' },
  'stats.changes': { en: 'Changes (7d)', sv: 'Ändringar (7d)' },
  'stats.checks': { en: 'Checks (7d)', sv: 'Kontroller (7d)' },
  'stats.lastcheck': { en: 'Last check', sv: 'Senaste kontroll' },
  'stats.never': { en: 'Not yet', sv: 'Inte ännu' },

  // ─── Time ───
  'time.justNow': { en: 'just now', sv: 'nyss' },
  'time.mAgo': { en: 'm ago', sv: 'm sedan' },
  'time.hAgo': { en: 'h ago', sv: 'h sedan' },
  'time.dAgo': { en: 'd ago', sv: 'd sedan' },

  // ─── Activity Feed ───
  'feed.title': { en: 'Activity', sv: 'Aktivitet' },
  'feed.desc': { en: 'Change log for your monitored pages', sv: 'Ändringslogg för dina bevakade sidor' },
  'feed.all': { en: 'All', sv: 'Alla' },
  'feed.high': { en: 'High', sv: 'Hög' },
  'feed.medium': { en: 'Medium', sv: 'Medel' },
  'feed.filter.url': { en: 'Filter by page', sv: 'Filtrera på sida' },

  // ─── Monitored Pages ───
  'monitor.title': { en: 'Monitored pages', sv: 'Bevakade sidor' },
  'monitor.sort.name': { en: 'Name', sv: 'Namn' },
  'monitor.sort.changed': { en: 'Last changed', sv: 'Senast ändrad' },
  'monitor.sort.importance': { en: 'Importance', sv: 'Prioritet' },
  'monitor.muted': { en: 'Paused', sv: 'Pausad' },
  'monitor.mute': { en: 'Pause monitoring', sv: 'Pausa bevakning' },
  'monitor.unmute': { en: 'Resume monitoring', sv: 'Återuppta bevakning' },

  // ─── Discover ───
  'discover.title': { en: 'Discover', sv: 'Upptäck' },
  'discover.desc': { en: 'Popular pages that teams monitor. Add with one click.', sv: 'Populära sidor som team bevakar. Lägg till med ett klick.' },

  // ─── Export ───
  'export.csv': { en: 'Export CSV', sv: 'Exportera CSV' },
  'export.pro': { en: 'Pro feature', sv: 'Pro-funktion' },

  // ─── Digest settings ───
  'settings.digest.weekly': { en: 'Weekly (Fridays)', sv: 'Veckovis (fredagar)' },
  'settings.digest.daily': { en: 'Daily', sv: 'Dagligen' },
  'settings.digest.off': { en: 'Off', sv: 'Av' },
  'settings.digest.pro': { en: 'Daily digest is a Pro feature', sv: 'Daglig rapport är en Pro-funktion' },

  // ─── Webhook ───
  'form.webhook': { en: 'Webhook URL', sv: 'Webhook-URL' },
  'form.webhook.help': { en: 'We POST a JSON payload when this page changes.', sv: 'Vi skickar JSON via POST när sidan ändras.' },
  'form.webhook.pro': { en: 'Webhooks are a Pro feature', sv: 'Webhooks är en Pro-funktion' },

  // ─── Checkout ───
  'checkout.success': { en: 'Plan upgraded! Welcome aboard.', sv: 'Plan uppgraderad! Välkommen ombord.' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] ?? translations[key]?.en ?? key;
}

export function getLocaleFromCookie(cookieHeader: string | null): Locale {
  if (!cookieHeader) return 'en';
  const match = cookieHeader.match(/locale=(en|sv)/);
  return (match?.[1] as Locale) ?? 'en';
}
