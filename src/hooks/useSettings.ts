import { useEffect, useState } from 'react';
import { deleteField, onSnapshot, setDoc } from 'firebase/firestore';
import { requireUid, userDoc, userDocRaw } from '@/lib/db';
import { useUid } from '@/hooks/useAuth';
import type { PayMethod, Settings } from '@/types';

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
 * Null removes the limit entirely rather than storing zero, so the
 * available-credit readout disappears instead of reading "$0.00 available".
 */
export async function setCreditLimit(cents: number | null): Promise<void> {
  await setDoc(
    userDocRaw(requireUid()),
    { creditLimitCents: cents === null ? deleteField() : cents },
    { merge: true },
  );
}

/**
 * The credit/debit toggle defaults to whatever was used last. Kept on the device
 * rather than in the account: it is a habit of this phone, not data worth syncing.
 */
const LAST_METHOD_KEY = 'lastMethod';

export function lastMethod(): PayMethod {
  const stored = localStorage.getItem(LAST_METHOD_KEY);
  return stored === 'credit' || stored === 'debit' || stored === 'cash' ? stored : 'credit';
}

export function rememberMethod(method: PayMethod): void {
  localStorage.setItem(LAST_METHOD_KEY, method);
}
