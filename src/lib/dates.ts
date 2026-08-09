/**
 * Every date operation goes through this module: period boundaries, week start,
 * month keys.
 *
 * Dates on transactions are local calendar strings ('YYYY-MM-DD'), never timestamps.
 * Timezone conversion on a date-only field is a recurring off-by-one-day bug, so
 * nothing here round-trips through UTC.
 *
 * THE WEEK RUNS MONDAY THROUGH SUNDAY.
 */

/** 'YYYY-MM-DD' for a local Date. */
export function toISODate(d: Date): string {
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Local Date at midnight from 'YYYY-MM-DD'. Avoids Date.parse's UTC interpretation. */
export function fromISODate(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toISODate(new Date());
}

/** 'YYYY-MM' — the key analytics groups a month by. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKey(today());
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const d = fromISODate(iso);
  const offset = (d.getDay() + 6) % 7; // Sunday(0) -> 6, Monday(1) -> 0
  d.setDate(d.getDate() - offset);
  return toISODate(d);
}

export function monthStart(iso: string): string {
  return `${monthKey(iso)}-01`;
}

/**
 * The date a monthly item falls on in a given month, clamped to the month's
 * length: the 31st becomes the 28th in February rather than skipping the month.
 */
export function dayInMonth(key: string, dayOfMonth: number): string {
  const [y = 0, m = 1] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${key}-${`${Math.min(dayOfMonth, last)}`.padStart(2, '0')}`;
}

/** Inclusive last day of the month a key names. */
export function monthEnd(key: string): string {
  const [y = 0, m = 1] = key.split('-').map(Number);
  return `${key}-${new Date(y, m, 0).getDate()}`;
}

/** The month key `n` months before `key` ('2026-08' -> '2026-07'). */
export function shiftMonth(key: string, n: number): string {
  const [y = 0, m = 1] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toISODate(d).slice(0, 7);
}

/** Every 'YYYY-MM-DD' in the month, for zero-filling a daily bar chart. */
export function daysInMonth(key: string): string[] {
  const [y = 0, m = 1] = key.split('-').map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${key}-${`${i + 1}`.padStart(2, '0')}`);
}

/** Inclusive date-string range test. Lexical comparison is safe for 'YYYY-MM-DD'. */
export function inRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

/** 'Aug 8' — list rows. */
export function formatShortDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** 'August 2026' — month pickers and chart titles. */
export function formatMonth(key: string): string {
  return fromISODate(`${key}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
