import { useEffect, useState } from 'react';
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { newId, requireUid, transactionsRef } from '@/lib/db';
import { useUid } from '@/hooks/useAuth';
import type { Transaction } from '@/types';

/** Firestore subscriptions live in hooks; components stay presentational. */

/**
 * Newest first, and entry order breaks a tie within a day — otherwise the
 * transaction you just added can land anywhere among the others dated today.
 *
 * Sorted here rather than by query, because the whole ledger is small enough to
 * hold and every screen wants the same order.
 */
export function useTransactions(): Transaction[] {
  const uid = useUid();
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!uid) return setTxs([]);
    return onSnapshot(transactionsRef(uid), (snap) =>
      setTxs(
        snap.docs
          .map((d) => d.data())
          .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
      ),
    );
  }, [uid]);

  return txs;
}

/**
 * ownShareCents is computed by the caller at save time and stored as given.
 * It is never recomputed on read, so past records survive a change to split logic.
 */
export async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
  const uid = requireUid();
  const id = newId();
  await setDoc(doc(transactionsRef(uid), id), { ...tx, id, createdAt: Date.now() });
  return id;
}

/**
 * Writes the whole record rather than merging fields into it. Optional fields —
 * a note, a trip — must be able to go away, and a merge would keep the old value
 * for any key the edit simply no longer has.
 */
export async function replaceTransaction(
  existing: Transaction,
  fields: Omit<Transaction, 'id' | 'createdAt'>,
): Promise<void> {
  const uid = requireUid();
  await setDoc(doc(transactionsRef(uid), existing.id), {
    ...fields,
    id: existing.id,
    createdAt: existing.createdAt,
  });
}

/** Takes the row it is given back so the undo affordance can put it straight back. */
export async function deleteTransaction(tx: Transaction): Promise<Transaction> {
  const uid = requireUid();
  await deleteDoc(doc(transactionsRef(uid), tx.id));
  return tx;
}

export async function restoreTransaction(tx: Transaction): Promise<void> {
  const uid = requireUid();
  await setDoc(doc(transactionsRef(uid), tx.id), tx);
}
