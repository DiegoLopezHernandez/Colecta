export const formatCurrency = (
  amount?: number,
  currency = 'EUR'
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-ES');
  } catch {
    return iso;
  }
};

export const percentDiff = (oldVal: number, newVal: number): number => {
  if (!oldVal) return 0;
  return ((newVal - oldVal) / oldVal) * 100;
};

export const formatPercent = (n: number, digits = 1): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
