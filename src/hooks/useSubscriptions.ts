import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '@/lib/db';
import { currentMonthKey, dayInMonth, today } from '@/lib/dates';
import type { Subscription } from '@/types';

export function useSubscriptions(): Subscription[] {
  return useLiveQuery(() => db.subscriptions.orderBy('dayOfMonth').toArray(), [], []);
}

/**
 * Due means: this month has not been logged yet, and the billing day has arrived.
 * Opening the app late still surfaces the prompt — a missed day is not a skipped
 * month.
 */
export function useDueSubscriptions(): Subscription[] {
  const subs = useSubscriptions();
  const month = currentMonthKey();
  const now = today();
  return subs.filter((s) => s.lastLoggedMonth !== month && dayInMonth(month, s.dayOfMonth) <= now);
}

export async function addSubscription(
  fields: Omit<Subscription, 'id' | 'lastLoggedMonth'>,
): Promise<void> {
  // Logged for the current month at creation, because the transaction that
  // created it is this month's charge.
  await db.subscriptions.add({ ...fields, id: newId(), lastLoggedMonth: currentMonthKey() });
}

export async function updateSubscription(
  id: string,
  changes: Partial<Omit<Subscription, 'id'>>,
): Promise<void> {
  await db.subscriptions.update(id, changes);
}

/** Answering "no longer active" removes the rule only. Past charges are history. */
export async function removeSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

export async function markLogged(id: string): Promise<void> {
  await db.subscriptions.update(id, { lastLoggedMonth: currentMonthKey() });
}
