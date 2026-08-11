import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '@/lib/db';
import type { Transaction } from '@/types';

/** Dexie queries live in hooks; components stay presentational. */

/**
 * Newest first, and entry order breaks a tie within a day — otherwise the
 * transaction you just added can land anywhere among the others dated today.
 */
export function useTransactions(): Transaction[] {
  return useLiveQuery(
    async () => {
      const txs = await db.transactions.toArray();
      return txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    },
    [],
    [],
  );
}

/**
 * ownShareCents is computed by the caller at save time and stored as given.
 * It is never recomputed on read, so past records survive a change to split logic.
 */
export async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
  const id = newId();
  await db.transactions.add({ ...tx, id, createdAt: Date.now() });
  return id;
}

/**
 * Replaces the whole record rather than merging changes into it. Optional fields
 * — a note, a trip — must be able to go away: an update would keep the old value
 * for any key the edit simply no longer has.
 */
export async function replaceTransaction(
  existing: Transaction,
  fields: Omit<Transaction, 'id' | 'createdAt'>,
): Promise<void> {
  await db.transactions.put({ ...fields, id: existing.id, createdAt: existing.createdAt });
}

/** Returns the deleted row so the undo affordance can put it straight back. */
export async function deleteTransaction(id: string): Promise<Transaction | undefined> {
  const tx = await db.transactions.get(id);
  if (tx) await db.transactions.delete(id);
  return tx;
}

export async function restoreTransaction(tx: Transaction): Promise<void> {
  await db.transactions.put(tx);
}
