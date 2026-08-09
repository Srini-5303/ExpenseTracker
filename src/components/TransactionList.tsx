import type { Transaction } from '@/types';
import { useRecentTransactions } from '@/hooks/useTransactions';
import TransactionRow from '@/components/TransactionRow';

/** Recent transactions, tappable to edit or delete. */
export default function TransactionList({ onSelect }: { onSelect: (tx: Transaction) => void }) {
  const txs = useRecentTransactions();

  return (
    <section className="mt-7">
      <h2 className="eyebrow">Recent</h2>
      {txs.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Nothing logged yet. The first thing you buy today goes here.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {txs.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}
