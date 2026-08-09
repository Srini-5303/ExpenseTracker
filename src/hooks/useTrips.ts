import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

/**
 * Trip names are not a table. They exist because a transaction carries one, so
 * the list is derived and a trip cannot outlive its last expense — nothing to
 * keep in sync, nothing to clean up.
 *
 * Most recently used first, since the trip you are on is the one you are logging
 * against.
 */
export function useTrips(): string[] {
  return useLiveQuery(
    async () => {
      const txs = await db.transactions.orderBy('createdAt').reverse().toArray();
      const seen: string[] = [];
      for (const tx of txs) {
        if (tx.trip && !seen.includes(tx.trip)) seen.push(tx.trip);
      }
      return seen;
    },
    [],
    [],
  );
}
