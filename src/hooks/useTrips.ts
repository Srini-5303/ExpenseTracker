import { useTransactions } from '@/hooks/useTransactions';

/**
 * Trip names are not a collection. They exist because a transaction carries one,
 * so the list is derived and a trip cannot outlive its last expense — nothing to
 * keep in sync, nothing to clean up.
 *
 * Most recently used first, since the trip you are on is the one you are logging
 * against.
 */
export function useTrips(): string[] {
  const txs = useTransactions();
  const byNewest = [...txs].sort((a, b) => b.createdAt - a.createdAt);
  return [...new Set(byNewest.flatMap((tx) => (tx.trip ? [tx.trip] : [])))];
}
