'use client';

import { useEffect } from 'react';

interface Props {
  count: number;
}

// Uppdaterar favicon med en badge-siffra och sidtitel med count
export function FaviconBadge({ count }: Props) {
  useEffect(() => {
    // Uppdatera sidtitel
    const baseTitle = 'changebrief';
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;

    // Skapa favicon med badge
    if (count <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bas-ikon (blå cirkel med öga)
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    const gradient = ctx.createLinearGradient(0, 0, 32, 32);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#4f46e5');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Öga-ikon (förenklad)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(16, 16, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16, 16, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Badge (röd cirkel med siffra)
    const badgeSize = count > 9 ? 14 : 12;
    ctx.beginPath();
    ctx.arc(32 - badgeSize / 2, badgeSize / 2, badgeSize / 2 + 1, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = `bold ${count > 9 ? 8 : 9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 99 ? '99+' : String(count), 32 - badgeSize / 2, badgeSize / 2 + 0.5);

    // Ersätt favicon
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = canvas.toDataURL('image/png');
    document.head.appendChild(link);

    return () => {
      document.title = baseTitle;
    };
  }, [count]);

  return null;
}
