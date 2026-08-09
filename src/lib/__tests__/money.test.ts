import { describe, expect, it } from 'vitest';
import { formatCents, parseAmount, percentChange, splitEven, sumCents } from '@/lib/money';

describe('parseAmount', () => {
  it('parses plain and decorated input to cents', () => {
    expect(parseAmount('12')).toBe(1200);
    expect(parseAmount('12.5')).toBe(1250);
    expect(parseAmount('12.55')).toBe(1255);
    expect(parseAmount('$1,234.56')).toBe(123456);
  });

  it('rejects anything it cannot represent exactly', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('.')).toBeNull();
    expect(parseAmount('12.555')).toBeNull(); // sub-cent precision would be lost
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('never produces a float', () => {
    expect(Number.isInteger(parseAmount('0.07'))).toBe(true);
    expect(parseAmount('0.07')).toBe(7);
    expect(parseAmount('19.99')).toBe(1999);
  });
});

describe('splitEven', () => {
  it('puts the remainder on the user so the total reconciles', () => {
    const own = splitEven(1000, 3);
    expect(own).toBe(334);
    expect(own + 333 + 333).toBe(1000);
  });

  it('divides cleanly when there is no remainder', () => {
    expect(splitEven(15000, 3)).toBe(5000);
  });

  it('returns the full amount when nothing is split', () => {
    expect(splitEven(15000, 1)).toBe(15000);
    expect(splitEven(15000, 0)).toBe(15000);
  });
});

describe('formatCents', () => {
  it('formats at the render layer only', () => {
    expect(formatCents(15000)).toBe('$150.00');
    expect(formatCents(7)).toBe('$0.07');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(-2000)).toBe('-$20.00');
  });
});

describe('sumCents and percentChange', () => {
  it('sums integers without float drift', () => {
    expect(sumCents([10, 20, 7])).toBe(37);
    expect(sumCents([])).toBe(0);
  });

  it('returns null when there is no baseline to compare against', () => {
    expect(percentChange(5000, 0)).toBeNull();
    expect(percentChange(15000, 10000)).toBe(50);
    expect(percentChange(5000, 10000)).toBe(-50);
  });
});
