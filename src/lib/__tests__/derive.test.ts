import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types';
import {
  availableCredit,
  cardBalance,
  cashOnHand,
  categoryTotals,
  dailyTotals,
  methodTotals,
  needsSubscriptionNudge,
  netPosition,
  spend,
} from '@/lib/derive';

const tx = (t: Partial<Transaction> & Pick<Transaction, 'type' | 'amountCents'>): Transaction => ({
  id: Math.random().toString(36),
  date: '2026-08-08',
  ownShareCents: t.amountCents,
  createdAt: 0,
  ...t,
});

/**
 * One of each type, so every branch of the two rules is exercised at once:
 *   $150 groceries on credit, split three ways ($50 own share)
 *   $40 restaurant on debit, not split
 *   $3,000 paycheck
 *   $100 back from a roommate
 *   $200 paid off the card from cash
 */
const fixture: Transaction[] = [
  tx({
    type: 'expense',
    amountCents: 15000,
    ownShareCents: 5000,
    category: 'groceries',
    method: 'credit',
  }),
  tx({ type: 'expense', amountCents: 4000, category: 'restaurant', method: 'debit' }),
  tx({ type: 'income', amountCents: 300000 }),
  tx({ type: 'reimbursement', amountCents: 10000 }),
  tx({ type: 'card_payment', amountCents: 20000, method: 'debit' }),
];

const MONTH: [string, string] = ['2026-08-01', '2026-08-31'];

describe('cashOnHand', () => {
  it('follows the money that actually moved', () => {
    // 3000 income - 40 debit expense + 100 reimbursement - 200 card payment
    expect(cashOnHand(fixture)).toBe(300000 - 4000 + 10000 - 20000);
  });

  it('ignores credit spending entirely', () => {
    const credit = tx({
      type: 'expense',
      amountCents: 99900,
      category: 'shopping',
      method: 'credit',
    });
    expect(cashOnHand([credit])).toBe(0);
  });

  it('uses the full charge on a split, not the own share', () => {
    const split = tx({
      type: 'expense',
      amountCents: 15000,
      ownShareCents: 5000,
      category: 'groceries',
      method: 'debit',
    });
    expect(cashOnHand([split])).toBe(-15000);
  });
});

describe('cardBalance', () => {
  it('is the credit-limit number, so it uses the full charge on a split', () => {
    // 150 credit charge - 200 card payment
    expect(cardBalance(fixture)).toBe(15000 - 20000);
  });

  it('is not reduced by a reimbursement — the bank still wants the full charge', () => {
    const charge = tx({
      type: 'expense',
      amountCents: 15000,
      ownShareCents: 5000,
      category: 'groceries',
      method: 'credit',
    });
    const back = tx({ type: 'reimbursement', amountCents: 10000 });
    expect(cardBalance([charge, back])).toBe(15000);
    expect(cashOnHand([charge, back])).toBe(10000);
  });

  it('is reduced by a card payment, which also reduces cash', () => {
    const payment = tx({ type: 'card_payment', amountCents: 20000, method: 'debit' });
    expect(cardBalance([payment])).toBe(-20000);
    expect(cashOnHand([payment])).toBe(-20000);
  });
});

describe('availableCredit and netPosition', () => {
  it('stays undefined until a limit is set', () => {
    expect(availableCredit(fixture, undefined)).toBeUndefined();
    expect(availableCredit(fixture, 500000)).toBe(500000 - cardBalance(fixture));
  });

  it('is cash minus card debt', () => {
    expect(netPosition(fixture)).toBe(cashOnHand(fixture) - cardBalance(fixture));
  });
});

describe('spend', () => {
  it('counts own share only, never the full charge', () => {
    // 50 own share of the split groceries + 40 restaurant. Not 150 + 40.
    expect(spend(fixture, ...MONTH)).toBe(5000 + 4000);
  });

  it('excludes income, reimbursements, and card payments', () => {
    const nonExpenses = fixture.filter((t) => t.type !== 'expense');
    expect(spend(nonExpenses, ...MONTH)).toBe(0);
  });

  it('ignores payment method — a meal is spending on the day it happened', () => {
    const credit = tx({ type: 'expense', amountCents: 2500, category: 'cab', method: 'credit' });
    const cash = tx({ type: 'expense', amountCents: 2500, category: 'cab', method: 'cash' });
    expect(spend([credit], ...MONTH)).toBe(spend([cash], ...MONTH));
  });

  it('respects the period boundary', () => {
    const july = tx({
      type: 'expense',
      amountCents: 5000,
      date: '2026-07-31',
      category: 'rent',
      method: 'debit',
    });
    expect(spend([july], ...MONTH)).toBe(0);
    expect(spend([july], '2026-07-01', '2026-07-31')).toBe(5000);
  });
});

describe('breakdowns', () => {
  it('totals categories by own share', () => {
    const totals = categoryTotals(fixture, ...MONTH);
    expect(totals.get('groceries')).toBe(5000);
    expect(totals.get('restaurant')).toBe(4000);
    expect(totals.size).toBe(2); // income, reimbursement, card payment contribute nothing
  });

  it('totals days by own share', () => {
    expect(dailyTotals(fixture, ...MONTH).get('2026-08-08')).toBe(9000);
  });

  it('totals methods by own share, excluding the card payment', () => {
    const totals = methodTotals(fixture, ...MONTH);
    expect(totals.get('credit')).toBe(5000); // own share, not the 15000 charge
    expect(totals.get('debit')).toBe(4000); // the 20000 card payment is not spending
  });
});

describe('needsSubscriptionNudge', () => {
  it('shows until the month has a subscription entry', () => {
    expect(needsSubscriptionNudge(fixture, '2026-08')).toBe(true);
    const sub = tx({
      type: 'expense',
      amountCents: 1099,
      category: 'subscriptions',
      method: 'credit',
    });
    expect(needsSubscriptionNudge([...fixture, sub], '2026-08')).toBe(false);
    expect(needsSubscriptionNudge([...fixture, sub], '2026-09')).toBe(true);
  });
});
