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
  savingsBalance,
  savingsOverTime,
  spend,
  tripTotals,
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
 *   $150 groceries on the Chase card, split three ways ($50 own share)
 *   $40 restaurant on debit, not split
 *   $3,000 paycheck
 *   $100 back from a roommate
 *   $200 paid off Chase from debit
 */
const fixture: Transaction[] = [
  tx({
    type: 'expense',
    amountCents: 15000,
    ownShareCents: 5000,
    category: 'groceries',
    method: 'chase',
  }),
  tx({ type: 'expense', amountCents: 4000, category: 'restaurant', method: 'debit' }),
  tx({ type: 'income', amountCents: 300000 }),
  tx({ type: 'reimbursement', amountCents: 10000 }),
  tx({ type: 'card_payment', amountCents: 20000, method: 'debit', card: 'chase' }),
];

const MONTH: [string, string] = ['2026-08-01', '2026-08-31'];

describe('cashOnHand', () => {
  it('follows the money that actually moved', () => {
    // 3000 income - 40 debit expense + 100 reimbursement - 200 card payment
    expect(cashOnHand(fixture)).toBe(300000 - 4000 + 10000 - 20000);
  });

  it('ignores card spending entirely', () => {
    const credit = tx({
      type: 'expense',
      amountCents: 99900,
      category: 'shopping',
      method: 'chase',
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
    // 150 Chase charge - 200 Chase payment
    expect(cardBalance(fixture)).toBe(15000 - 20000);
  });

  it('is not reduced by a reimbursement — the bank still wants the full charge', () => {
    const charge = tx({
      type: 'expense',
      amountCents: 15000,
      ownShareCents: 5000,
      category: 'groceries',
      method: 'chase',
    });
    const back = tx({ type: 'reimbursement', amountCents: 10000 });
    expect(cardBalance([charge, back])).toBe(15000);
    expect(cashOnHand([charge, back])).toBe(10000);
  });

  it('is reduced by a card payment, which also reduces cash', () => {
    const payment = tx({
      type: 'card_payment',
      amountCents: 20000,
      method: 'debit',
      card: 'chase',
    });
    expect(cardBalance([payment])).toBe(-20000);
    expect(cashOnHand([payment])).toBe(-20000);
  });
});

describe('two cards', () => {
  // $100 on Amex, and $60 paid off Amex. Chase must not move a cent.
  const twoCards: Transaction[] = [
    ...fixture,
    tx({ type: 'expense', amountCents: 10000, category: 'shopping', method: 'amex' }),
    tx({ type: 'card_payment', amountCents: 6000, method: 'debit', card: 'amex' }),
  ];

  it('keeps each card on its own balance', () => {
    expect(cardBalance(twoCards, 'chase')).toBe(15000 - 20000);
    expect(cardBalance(twoCards, 'amex')).toBe(10000 - 6000);
  });

  it('sums both when no card is named', () => {
    expect(cardBalance(twoCards)).toBe(
      cardBalance(twoCards, 'chase') + cardBalance(twoCards, 'amex'),
    );
  });

  it('never lets one card pay down the other', () => {
    // The Amex payment is the only difference, and Chase is unchanged by it.
    expect(cardBalance(twoCards, 'chase')).toBe(cardBalance(fixture, 'chase'));
  });

  it('gives each card its own limit', () => {
    expect(availableCredit(twoCards, 'amex', 500000)).toBe(500000 - 4000);
    // A Chase limit says nothing about Amex, and vice versa.
    expect(availableCredit(twoCards, 'chase', undefined)).toBeUndefined();
  });

  it('is spending either way — a card is not a category', () => {
    expect(spend(twoCards, ...MONTH)).toBe(spend(fixture, ...MONTH) + 10000);
  });
});

describe('availableCredit and netPosition', () => {
  it('stays undefined until a limit is set', () => {
    expect(availableCredit(fixture, 'chase', undefined)).toBeUndefined();
    expect(availableCredit(fixture, 'chase', 500000)).toBe(500000 - cardBalance(fixture, 'chase'));
  });

  it('is cash plus savings minus card debt', () => {
    expect(netPosition(fixture)).toBe(
      cashOnHand(fixture) + savingsBalance(fixture) - cardBalance(fixture),
    );
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
    const card = tx({ type: 'expense', amountCents: 2500, category: 'cab', method: 'chase' });
    const cash = tx({ type: 'expense', amountCents: 2500, category: 'cab', method: 'cash' });
    expect(spend([card], ...MONTH)).toBe(spend([cash], ...MONTH));
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
    expect(totals.get('chase')).toBe(5000); // own share, not the 15000 charge
    expect(totals.get('debit')).toBe(4000); // the 20000 card payment is not spending
  });
});

describe('covered expenses and paybacks', () => {
  // A $60 dinner a friend paid for, split two ways, then $30 handed back later.
  const covered = tx({
    type: 'expense',
    amountCents: 6000,
    ownShareCents: 3000,
    category: 'restaurant',
    method: 'covered',
  });
  const back = tx({ type: 'payback', amountCents: 3000, date: '2026-08-20' });

  it('is spending, but no money of yours moved', () => {
    expect(spend([covered], ...MONTH)).toBe(3000);
    expect(categoryTotals([covered], ...MONTH).get('restaurant')).toBe(3000);
    expect(cashOnHand([covered])).toBe(0);
    expect(cardBalance([covered])).toBe(0);
  });

  it('pays back out of cash without counting twice', () => {
    expect(cashOnHand([covered, back])).toBe(-3000);
    expect(spend([covered, back], ...MONTH)).toBe(3000); // still just the dinner
    expect(cardBalance([covered, back])).toBe(0);
  });

  it('leaves the method bar summing to the month total', () => {
    const totals = methodTotals([...fixture, covered], ...MONTH);
    expect(totals.get('covered')).toBe(3000);
    expect([...totals.values()].reduce((a, b) => a + b, 0)).toBe(
      spend([...fixture, covered], ...MONTH),
    );
  });
});

describe('savings', () => {
  const saving: Transaction[] = [
    tx({ type: 'income', amountCents: 300000, date: '2026-06-01' }),
    tx({ type: 'savings_deposit', amountCents: 50000, date: '2026-06-05', method: 'debit' }),
    tx({ type: 'savings_deposit', amountCents: 50000, date: '2026-08-05', method: 'debit' }),
    tx({ type: 'savings_withdrawal', amountCents: 20000, date: '2026-08-20', method: 'debit' }),
  ];

  it('moves money out of cash without being spending', () => {
    expect(savingsBalance(saving)).toBe(50000 + 50000 - 20000);
    expect(cashOnHand(saving)).toBe(300000 - 50000 - 50000 + 20000);
    // The whole point: a month of diligent saving is not a month of overspending.
    expect(spend(saving, '2026-01-01', '2026-12-31')).toBe(0);
    expect(categoryTotals(saving, '2026-01-01', '2026-12-31').size).toBe(0);
  });

  it('never touches the card balance', () => {
    expect(cardBalance(saving)).toBe(0);
  });

  it('runs the balance forward through months with no activity', () => {
    const series = savingsOverTime(saving);
    // June, then a flat July, then August. Skipping July would make the line
    // claim the balance climbed faster than it did.
    expect(series.slice(0, 3)).toEqual([
      { month: '2026-06', cents: 50000 },
      { month: '2026-07', cents: 50000 },
      { month: '2026-08', cents: 80000 },
    ]);
  });

  it('is empty until something is saved', () => {
    expect(savingsOverTime(fixture)).toEqual([]);
    expect(savingsBalance(fixture)).toBe(0);
  });
});

describe('tripTotals', () => {
  const lisbon: Transaction[] = [
    tx({
      type: 'expense',
      amountCents: 60000,
      date: '2026-03-02',
      category: 'travel',
      method: 'chase',
      trip: 'Lisbon',
    }),
    tx({
      type: 'expense',
      amountCents: 8000,
      ownShareCents: 4000,
      date: '2026-03-05',
      category: 'restaurant',
      method: 'chase',
      trip: 'Lisbon',
    }),
    tx({ type: 'expense', amountCents: 3000, category: 'restaurant', method: 'debit' }),
  ];

  it('totals a trip by own share across categories and dates', () => {
    const [trip] = tripTotals(lisbon);
    expect(trip).toEqual({
      trip: 'Lisbon',
      cents: 64000, // 600 flight + 40 own share of the split dinner
      count: 2,
      from: '2026-03-02',
      to: '2026-03-05',
    });
  });

  it('does not double count — a trip is a dimension, not a second category', () => {
    // The dinner belongs to the trip AND to restaurant. Category totals must
    // still sum to exactly the period's spending.
    const categories = categoryTotals(lisbon, '2026-01-01', '2026-12-31');
    const summed = [...categories.values()].reduce((a, b) => a + b, 0);
    expect(summed).toBe(spend(lisbon, '2026-01-01', '2026-12-31'));
    expect(categories.get('restaurant')).toBe(4000 + 3000);
    expect(categories.get('travel')).toBe(60000);
  });

  it('ignores untagged expenses and non-expenses', () => {
    expect(tripTotals([tx({ type: 'income', amountCents: 100, trip: 'Lisbon' })])).toEqual([]);
  });
});

describe('needsSubscriptionNudge', () => {
  const sub = tx({
    type: 'expense',
    amountCents: 1099,
    date: '2026-08-26',
    category: 'subscriptions',
    method: 'chase',
  });

  it('stays quiet until the 25th', () => {
    expect(needsSubscriptionNudge(fixture, '2026-08-01')).toBe(false);
    expect(needsSubscriptionNudge(fixture, '2026-08-24')).toBe(false);
    expect(needsSubscriptionNudge(fixture, '2026-08-25')).toBe(true);
    expect(needsSubscriptionNudge(fixture, '2026-08-31')).toBe(true);
  });

  it('goes away once the month has a subscription entry', () => {
    expect(needsSubscriptionNudge([...fixture, sub], '2026-08-27')).toBe(false);
  });

  it('returns the following month, which is empty again', () => {
    expect(needsSubscriptionNudge([...fixture, sub], '2026-09-25')).toBe(true);
  });
});
