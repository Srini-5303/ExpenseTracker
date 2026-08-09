import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '@/lib/db';
import type { Transaction } from '@/types';

/** Dexie queries live in hooks; components stay presentational. */

export function useTransactions(): Transaction[] {
  return useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [], []);
}

export function useRecentTransactions(limit = 20): Transaction[] {
  return useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().limit(limit).toArray(),
    [limit],
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

export async function updateTransaction(
  id: string,
  changes: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.transactions.update(id, changes);
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
