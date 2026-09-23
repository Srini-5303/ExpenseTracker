import type { CardId, Category, PayMethod, Transaction } from '@/types';
import { sumCents } from '@/lib/money';
import { CARD_IDS } from '@/lib/categories';
import { inRange, monthKey, shiftMonth, today } from '@/lib/dates';

/**
 * Every balance and total in the UI reads from here, so the amountCents vs
 * ownShareCents rule lives in exactly one place and cannot drift between screens.
 *
 *   Balances and card totals use `amountCents`.
 *   Every chart, category total, and period total uses `ownShareCents`.
 *
 * Analytics see EXPENSES ONLY. Income, reimbursements, card payments, paybacks,
 * and savings transfers are excluded without exception — a card payment or a
 * payback counted as spending double-counts purchases that were already
 * recorded when they happened.
 */

const isExpense = (t: Transaction) => t.type === 'expense';

/** A card charge defers payment; every other method moves money now. */
export const isCard = (method: PayMethod | undefined): method is CardId =>
  CARD_IDS.some((card) => card === method);

/** The only entry point analytics may use to select transactions. */
export function expensesIn(txs: readonly Transaction[], start: string, end: string): Transaction[] {
  return txs.filter((t) => isExpense(t) && inRange(t.date, start, end));
}

export function cashOnHand(txs: readonly Transaction[]): number {
  return sumCents(
    txs.map((t) => {
      switch (t.type) {
        case 'income':
        case 'reimbursement':
          return t.amountCents;
        // A card is paid later; covered was never your money to begin with.
        case 'expense':
          return isCard(t.method) || t.method === 'covered' ? 0 : -t.amountCents;
        case 'card_payment':
        case 'payback':
        case 'savings_deposit':
          return -t.amountCents;
        case 'savings_withdrawal':
          return t.amountCents;
      }
    }),
  );
}

/**
 * What is sitting in savings. Like a card payment, a deposit is a TRANSFER, not
 * an expense: the money is still yours, it just moved. Counting it as spending
 * would make a month of diligent saving look like a month of overspending.
 */
export function savingsBalance(txs: readonly Transaction[]): number {
  return sumCents(
    txs.map((t) => {
      if (t.type === 'savings_deposit') return t.amountCents;
      if (t.type === 'savings_withdrawal') return -t.amountCents;
      return 0;
    }),
  );
}

/**
 * The running savings balance at the end of each month that has any activity,
 * plus every month in between — a flat stretch is information, and skipping it
 * would make the line lie about how fast the balance grew.
 */
export function savingsOverTime(txs: readonly Transaction[]): { month: string; cents: number }[] {
  const moves = txs.filter(
    (t) => t.type === 'savings_deposit' || t.type === 'savings_withdrawal',
  );
  if (moves.length === 0) return [];

  const byMonth = new Map<string, number>();
  for (const t of moves) {
    const key = monthKey(t.date);
    const delta = t.type === 'savings_deposit' ? t.amountCents : -t.amountCents;
    byMonth.set(key, (byMonth.get(key) ?? 0) + delta);
  }

  const months = [...byMonth.keys()].sort();
  const first = months[0]!;
  const last = monthKey(today());
  const series: { month: string; cents: number }[] = [];
  let running = 0;
  for (let key = first; key <= last; key = shiftMonth(key, 1)) {
    running += byMonth.get(key) ?? 0;
    series.push({ month: key, cents: running });
  }
  return series;
}

/**
 * What a card's issuer is owed — or every card together when no card is named.
 *
 * Always the full charge, never the own share: this is the credit-limit number,
 * so a split dinner counts against the limit at its full value.
 */
export function cardBalance(txs: readonly Transaction[], card?: CardId): number {
  return sumCents(
    txs.map((t) => {
      if (t.type === 'expense' && isCard(t.method) && (card === undefined || t.method === card))
        return t.amountCents;
      // A payment reduces the one card it was made against, not the pair.
      if (t.type === 'card_payment' && (card === undefined || t.card === card))
        return -t.amountCents;
      return 0;
    }),
  );
}

/** Undefined until that card has a limit set. Limits are per card, not shared. */
export function availableCredit(
  txs: readonly Transaction[],
  card: CardId,
  limitCents: number | undefined,
): number | undefined {
  return limitCents === undefined ? undefined : limitCents - cardBalance(txs, card);
}

/** Everything you have, minus what you owe. Savings counts — it is still yours. */
export function netPosition(txs: readonly Transaction[]): number {
  return cashOnHand(txs) + savingsBalance(txs) - cardBalance(txs);
}

/** Own-share spending in an inclusive date range. Payment method is irrelevant. */
export function spend(txs: readonly Transaction[], start: string, end: string): number {
  return sumCents(expensesIn(txs, start, end).map((t) => t.ownShareCents));
}

/** Own-share totals per category, for the donut and the month comparison. */
export function categoryTotals(
  txs: readonly Transaction[],
  start: string,
  end: string,
): Map<Category, number> {
  const totals = new Map<Category, number>();
  for (const t of expensesIn(txs, start, end)) {
    if (!t.category) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.ownShareCents);
  }
  return totals;
}

/** Own-share totals per 'YYYY-MM-DD', for the daily bar chart. */
export function dailyTotals(
  txs: readonly Transaction[],
  start: string,
  end: string,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const t of expensesIn(txs, start, end)) {
    totals.set(t.date, (totals.get(t.date) ?? 0) + t.ownShareCents);
  }
  return totals;
}

/** Own-share totals per payment method, for the credit-vs-debit stacked bar. */
export function methodTotals(
  txs: readonly Transaction[],
  start: string,
  end: string,
): Map<PayMethod, number> {
  const totals = new Map<PayMethod, number>();
  for (const t of expensesIn(txs, start, end)) {
    if (!t.method) continue;
    totals.set(t.method, (totals.get(t.method) ?? 0) + t.ownShareCents);
  }
  return totals;
}

export interface TripTotal {
  trip: string;
  cents: number;
  count: number;
  from: string;
  to: string;
}

/**
 * Own-share spending per trip, across all time rather than a month, because a
 * trip is not bounded by the calendar.
 *
 * A trip is an orthogonal dimension, not a category: the same $40 dinner counts
 * once towards `restaurant` and once towards the Lisbon trip, and neither total
 * inflates the other because they are different questions.
 */
export function tripTotals(txs: readonly Transaction[]): TripTotal[] {
  const totals = new Map<string, TripTotal>();
  for (const t of txs) {
    if (!isExpense(t) || !t.trip) continue;
    const found = totals.get(t.trip);
    if (!found) {
      totals.set(t.trip, {
        trip: t.trip,
        cents: t.ownShareCents,
        count: 1,
        from: t.date,
        to: t.date,
      });
      continue;
    }
    found.cents += t.ownShareCents;
    found.count += 1;
    if (t.date < found.from) found.from = t.date;
    if (t.date > found.to) found.to = t.date;
  }
  return [...totals.values()].sort((a, b) => b.to.localeCompare(a.to));
}

/**
 * Held back until late in the month rather than appearing on the 1st. Most
 * subscriptions have not billed yet at the start of a month, so an early nudge
 * is asking about something that has not happened — and a reminder that is
 * usually premature stops being read.
 */
export const SUBSCRIPTION_NUDGE_DAY = 25;

/** True from the nudge day onward, while the month still has no subscription expense. */
export function needsSubscriptionNudge(txs: readonly Transaction[], todayISO: string): boolean {
  if (Number(todayISO.slice(-2)) < SUBSCRIPTION_NUDGE_DAY) return false;
  const month = monthKey(todayISO);
  return !txs.some(
    (t) => isExpense(t) && t.category === 'subscriptions' && monthKey(t.date) === month,
  );
}
