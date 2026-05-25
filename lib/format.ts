export type FormatCurrencyOpts = {
  compact?: boolean;
  currency?: string;
};

/**
 * Canonical currency formatter for the YPIT app.
 * - Default: TSh prefix, comma-separated, no decimals (e.g. "TSh 1,234,567")
 * - compact: short scale with suffix (e.g. "TSh 1.2M"). KPI tiles only.
 * - currency: ISO code. "TZS" (default) → "TSh" prefix. "USD" → "USD" prefix.
 */
export function formatCurrency(amount: number, opts: FormatCurrencyOpts = {}): string {
  const { compact = false, currency = 'TZS' } = opts;
  const prefix = currency === 'USD' ? 'USD' : 'TSh';

  if (compact) {
    return `${prefix} ${compactNumber(amount)}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${prefix} ${formatted}`;
}

function compactNumber(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let n: number;
  let suffix: string;
  if (abs >= 1_000_000_000) {
    n = abs / 1_000_000_000;
    suffix = 'B';
  } else if (abs >= 1_000_000) {
    n = abs / 1_000_000;
    suffix = 'M';
  } else if (abs >= 1_000) {
    n = abs / 1_000;
    suffix = 'K';
  } else {
    return `${sign}${abs}`;
  }
  const rounded = n.toFixed(1);
  const clean = rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
  return `${sign}${clean}${suffix}`;
}
