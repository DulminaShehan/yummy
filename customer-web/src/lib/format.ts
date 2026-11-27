export function formatCurrency(
  amount: number | null | undefined,
  currencyCode = 'USD'
): string {
  const value = amount ?? 0;
  const code = (currencyCode || 'USD').toUpperCase().trim();

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback if currency code is custom or unsupported by browser
    return `${code} ${value.toFixed(2)}`;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '15-25 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`;
}
