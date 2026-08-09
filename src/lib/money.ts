/**
 * Every money operation in the app goes through this module: parsing, arithmetic,
 * splitting, formatting. Money math anywhere else is a bug.
 *
 * Money is integer cents. Never floats. Format only at the render layer.
 */

const FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Parse user keypad input ('12', '12.5', '$1,234.56') to cents. Null if unparseable. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === '' || cleaned === '.') return null;
  return Math.round(Number(cleaned) * 100);
}

export function formatCents(cents: number): string {
  return FORMATTER.format(cents / 100);
}

/** '$1,234' — for large balance readouts where cents are noise. */
export function formatWhole(cents: number): string {
  return FORMATTER.format(Math.round(cents / 100)).replace(/\.\d{2}$/, '');
}

export function sumCents(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Even split across `headcount` people INCLUDING the user.
 * Remainder cents land on the user's own share so the total always reconciles.
 */
export function splitEven(totalCents: number, headcount: number): number {
  if (headcount <= 1) return totalCents;
  return Math.floor(totalCents / headcount) + (totalCents % headcount);
}

/** Percent change from `previous` to `current`. Null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
