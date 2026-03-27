'use client';

import { useEffect, useState } from 'react';
import { Toast } from './toast';
import { useLocale } from '../locale-provider';

export function CheckoutToast({ show: shouldShow }: { show: boolean }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(shouldShow);

  useEffect(() => {
    if (shouldShow) {
      // Rensa searchParams fran URL utan reload
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    }
  }, [shouldShow]);

  if (!visible) return null;

  return <Toast message={t('checkout.success')} type="success" onClose={() => setVisible(false)} />;
}
