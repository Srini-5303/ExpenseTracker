import { useEffect, useState } from 'react';
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { newId, requireUid, subscriptionsRef } from '@/lib/db';
import { useUid } from '@/hooks/useAuth';
import { currentMonthKey, dayInMonth, today } from '@/lib/dates';
import type { Subscription } from '@/types';

export function useSubscriptions(): Subscription[] {
  const uid = useUid();
  const [subs, setSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    if (!uid) return setSubs([]);
    return onSnapshot(subscriptionsRef(uid), (snap) =>
      setSubs(snap.docs.map((d) => d.data()).sort((a, b) => a.dayOfMonth - b.dayOfMonth)),
    );
  }, [uid]);

  return subs;
}

/**
 * Due means: this month has not been logged yet, and the billing day has arrived.
 * Opening the app late still surfaces the prompt — a missed day is not a skipped
 * month.
 *
 * A plain function rather than a hook so a caller that already has the list does
 * not open a second listener on the same collection.
 */
export function dueSubscriptions(subs: readonly Subscription[]): Subscription[] {
  const month = currentMonthKey();
  const now = today();
  return subs.filter((s) => s.lastLoggedMonth !== month && dayInMonth(month, s.dayOfMonth) <= now);
}

export async function addSubscription(
  fields: Omit<Subscription, 'id' | 'lastLoggedMonth'>,
): Promise<void> {
  const uid = requireUid();
  const id = newId();
  // Logged for the current month at creation, because the transaction that
  // created it is this month's charge.
  await setDoc(doc(subscriptionsRef(uid), id), {
    ...fields,
    id,
    lastLoggedMonth: currentMonthKey(),
  });
}

export async function updateSubscription(
  id: string,
  changes: Partial<Omit<Subscription, 'id'>>,
): Promise<void> {
  await setDoc(doc(subscriptionsRef(requireUid()), id), changes, { merge: true });
}

/** Answering "no longer active" removes the rule only. Past charges are history. */
export async function removeSubscription(id: string): Promise<void> {
  await deleteDoc(doc(subscriptionsRef(requireUid()), id));
}

export async function markLogged(id: string): Promise<void> {
  await updateSubscription(id, { lastLoggedMonth: currentMonthKey() });
}
