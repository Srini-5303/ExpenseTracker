import { describe, expect, it } from 'vitest';
import {
  daysInMonth,
  fromISODate,
  inRange,
  monthKey,
  monthStart,
  shiftMonth,
  toISODate,
  weekStart,
} from '@/lib/dates';

describe('weekStart', () => {
  // The single most valuable assertion in this file. date-fns and Day.js both
  // treat Sunday as day zero, which would shift every weekly total by a day.
  it('runs Monday through Sunday', () => {
    expect(weekStart('2026-08-10')).toBe('2026-08-10'); // Monday returns itself
    expect(weekStart('2026-08-16')).toBe('2026-08-10'); // Sunday looks back six days
    expect(weekStart('2026-08-13')).toBe('2026-08-10'); // Thursday
  });

  it('crosses a month boundary backwards', () => {
    expect(weekStart('2026-08-02')).toBe('2026-07-27'); // Sunday Aug 2 -> Mon Jul 27
  });
});

describe('ISO date round-trip', () => {
  it('does not drift through UTC', () => {
    for (const iso of ['2026-01-01', '2026-02-28', '2026-03-01', '2026-08-31', '2026-12-31']) {
      expect(toISODate(fromISODate(iso))).toBe(iso);
    }
  });

  it('reads a date string as a local calendar date, not a UTC instant', () => {
    const d = fromISODate('2026-08-08');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(8);
  });
});

describe('month helpers', () => {
  it('derives keys and starts', () => {
    expect(monthKey('2026-08-08')).toBe('2026-08');
    expect(monthStart('2026-08-08')).toBe('2026-08-01');
  });

  it('shifts across a year boundary', () => {
    expect(shiftMonth('2026-08', -1)).toBe('2026-07');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('enumerates every day, including a leap February', () => {
    expect(daysInMonth('2026-02')).toHaveLength(28);
    expect(daysInMonth('2028-02')).toHaveLength(29);
    const august = daysInMonth('2026-08');
    expect(august).toHaveLength(31);
    expect(august[0]).toBe('2026-08-01');
    expect(august.at(-1)).toBe('2026-08-31');
  });
});

describe('inRange', () => {
  it('is inclusive at both ends', () => {
    expect(inRange('2026-08-01', '2026-08-01', '2026-08-31')).toBe(true);
    expect(inRange('2026-08-31', '2026-08-01', '2026-08-31')).toBe(true);
    expect(inRange('2026-07-31', '2026-08-01', '2026-08-31')).toBe(false);
    expect(inRange('2026-09-01', '2026-08-01', '2026-08-31')).toBe(false);
  });
});
