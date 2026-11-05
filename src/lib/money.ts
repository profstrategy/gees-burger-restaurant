import type { Money } from '@/types/catalog';

/**
 * Parse a digit string ("9000") or integer to a safe integer in whole Naira.
 * Integer maths only — no floats anywhere in the app.
 */
export function toInt(value: Money | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  const cleaned = value.replace(/[^\d-]/g, '');
  if (!cleaned || cleaned === '-') return 0;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Sum an array of integer naira amounts or Money strings using integer arithmetic.
 */
export function sum(values: ReadonlyArray<Money | number | null | undefined>): number {
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    total += toInt(values[i]);
  }
  return total;
}

/**
 * Multiply an integer unit price by an integer quantity.
 */
export function multiply(unitAmount: Money | number, quantity: number): number {
  const unit = toInt(unitAmount);
  const qty = Math.max(0, Math.trunc(quantity));
  return unit * qty;
}

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/**
 * Format a Money string or integer into "₦9,000".
 */
export function formatNaira(value: Money | number | null | undefined): string {
  const amount = toInt(value);
  return `₦${nairaFormatter.format(amount)}`;
}
