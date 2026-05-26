import { Currency } from '@/types';

/**
 * Static FX rates against TZS. Phase 1 ships with these; a future phase
 * will let Finance edit them via UI. Keep in sync with the spec.
 */
export const FX_RATES_TO_TZS: Record<Currency, number> = {
  TZS: 1,
  USD: 2600,
  GBP: 3250,
  EUR: 2800,
};

export function convertToTzs(amount: number, from: Currency): number {
  return Math.round(amount * FX_RATES_TO_TZS[from]);
}

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return Math.round((amount * FX_RATES_TO_TZS[from]) / FX_RATES_TO_TZS[to]);
}

/** Sum a list of (amount, currency) pairs into a single target currency. */
export function sumInCurrency(
  items: ReadonlyArray<{ amount: number; currency: Currency }>,
  target: Currency,
): number {
  return items.reduce((acc, it) => acc + convertCurrency(it.amount, it.currency, target), 0);
}
