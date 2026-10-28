import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types';
import {
  accountBalance,
  availableCredit,
  cardBalance,
  categoryTotals,
  dailyTotals,
  methodTotals,
  needsSubscriptionNudge,
  loanPayments,
  netPosition,
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

const chase = (txs: Transaction[]) => accountBalance(txs, 'debit');
const amex = (txs: Transaction[]) => accountBalance(txs, 'amex_acc');

const MONTH: [string, string] = ['2026-08-01', '2026-08-31'];

describe('chase account', () => {
  it('follows the money that actually moved', () => {
    // 3000 income - 40 debit expense + 100 reimbursement - 200 card payment
    expect(chase(fixture)).toBe(300000 - 4000 + 10000 - 20000);
  });

  it('ignores card spending entirely', () => {
    const credit = tx({
      type: 'expense',
      amountCents: 99900,
      category: 'shopping',
      method: 'chase',
    });
    expect(chase([credit])).toBe(0);
  });

  it('uses the full charge on a split, not the own share', () => {
    const split = tx({
      type: 'expense',
      amountCents: 15000,
      ownShareCents: 5000,
      category: 'groceries',
      method: 'debit',
    });
    expect(chase([split])).toBe(-15000);
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
    expect(chase([charge, back])).toBe(10000);
  });

  it('is reduced by a card payment, which also reduces cash', () => {
    const payment = tx({
      type: 'card_payment',
      amountCents: 20000,
      method: 'debit',
      card: 'chase',
    });
    expect(cardBalance([payment])).toBe(-20000);
    expect(chase([payment])).toBe(-20000);
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

  it('is both accounts minus card debt', () => {
    expect(netPosition(fixture)).toBe(
      chase(fixture) + amex(fixture) - cardBalance(fixture),
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
    expect(chase([covered])).toBe(0);
    expect(cardBalance([covered])).toBe(0);
  });

  it('pays back out of cash without counting twice', () => {
    expect(chase([covered, back])).toBe(-3000);
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

describe('chase and amex accounts', () => {
  const moves: Transaction[] = [
    tx({ type: 'income', amountCents: 300000 }),
    tx({ type: 'to_amex', amountCents: 50000 }),
    tx({ type: 'to_chase', amountCents: 20000 }),
  ];

  it('starts amex at zero, with every older entry counted as chase', () => {
    const legacy = tx({ type: 'card_payment', amountCents: 1000, method: 'cash', card: 'chase' });
    expect(amex([...fixture, legacy])).toBe(0);
    expect(chase([legacy])).toBe(-1000);
    const cab = tx({ type: 'expense', amountCents: 700, category: 'cab', method: 'cash' });
    expect(methodTotals([cab], ...MONTH).get('debit')).toBe(700);
  });

  it('moves money between accounts without being spending', () => {
    expect(chase(moves)).toBe(300000 - 50000 + 20000);
    expect(amex(moves)).toBe(50000 - 20000);
    expect(netPosition(moves)).toBe(300000);
    expect(spend(moves, '2026-01-01', '2026-12-31')).toBe(0);
    expect(cardBalance(moves)).toBe(0);
  });

  it('lands in or leaves from the account picked', () => {
    const intoAmex = tx({ type: 'income', amountCents: 5000, method: 'amex_acc' });
    const payFromAmex = tx({ type: 'card_payment', amountCents: 2000, method: 'amex_acc', card: 'amex' });
    expect(amex([intoAmex, payFromAmex])).toBe(3000);
    expect(chase([intoAmex, payFromAmex])).toBe(0);
    expect(cardBalance([payFromAmex], 'amex')).toBe(-2000);
  });

  it('never confuses the amex account with the amex card', () => {
    const charge = tx({ type: 'expense', amountCents: 4000, category: 'cab', method: 'amex' });
    expect(amex([charge])).toBe(0);
    expect(cardBalance([charge], 'amex')).toBe(4000);
  });
});

describe('loanPayments', () => {
  const loans: Transaction[] = [
    tx({ type: 'loan_payment', amountCents: 25000, date: '2026-09-01', method: 'debit' }),
    tx({ type: 'loan_payment', amountCents: 25000, date: '2026-08-01', method: 'amex_acc' }),
  ];

  it('totals every payment, oldest first', () => {
    const { cents, payments } = loanPayments(loans);
    expect(cents).toBe(50000);
    expect(payments.map((t) => t.date)).toEqual(['2026-08-01', '2026-09-01']);
  });

  it('leaves the account it came from, and is never spending', () => {
    expect(accountBalance(loans, 'debit')).toBe(-25000);
    expect(accountBalance(loans, 'amex_acc')).toBe(-25000);
    expect(spend(loans, '2026-01-01', '2026-12-31')).toBe(0);
    expect(cardBalance(loans)).toBe(0);
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
