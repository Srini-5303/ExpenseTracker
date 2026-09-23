import { useEffect, useState } from 'react';
import { deleteField, onSnapshot, setDoc } from 'firebase/firestore';
import { requireUid, userDoc, userDocRaw } from '@/lib/db';
import { useUid } from '@/hooks/useAuth';
import { EXPENSE_METHODS } from '@/lib/categories';
import type { CardId, PayMethod, Settings } from '@/types';

/** Settings are fields on the account's own document, not a collection of one. */
export function useSettings(): Settings | undefined {
  const uid = useUid();
  const [settings, setSettings] = useState<Settings | undefined>(undefined);

  useEffect(() => {
    if (!uid) return setSettings(undefined);
    return onSnapshot(userDoc(uid), (snap) => setSettings(snap.data()));
  }, [uid]);

  return settings;
}

export async function saveSettings(changes: Partial<Settings>): Promise<void> {
  await setDoc(userDoc(requireUid()), changes, { merge: true });
}

/**
 * Limits are per card, since one shared ceiling would say nothing about which
 * card is nearly full.
 *
 * Null removes that card's limit entirely rather than storing zero, so its
 * available-credit readout disappears instead of reading "$0.00 available".
 */
export async function setCardLimit(card: CardId, cents: number | null): Promise<void> {
  await setDoc(
    userDocRaw(requireUid()),
    { cardLimitsCents: { [card]: cents === null ? deleteField() : cents } },
    { merge: true },
  );
}

/**
 * The payment toggle defaults to whatever was used last. Kept on the device
 * rather than in the account: it is a habit of this phone, not data worth syncing.
 */
const LAST_METHOD_KEY = 'lastMethod';

export function lastMethod(): PayMethod {
  const stored = localStorage.getItem(LAST_METHOD_KEY);
  // A legacy 'credit' is not in the list, so it falls through to Chase — the
  // same card the migration moved those transactions to.
  return EXPENSE_METHODS.find((m) => m === stored) ?? 'chase';
}

/**
 * "Paid for me" is never remembered. It is the rare case, and defaulting the
 * next expense to it would silently stop deducting real money from cash.
 */
export function rememberMethod(method: PayMethod): void {
  if (method !== 'covered') localStorage.setItem(LAST_METHOD_KEY, method);
}
