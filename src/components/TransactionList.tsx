import { useRecentTransactions } from '@/hooks/useTransactions';
import TransactionRow from '@/components/TransactionRow';

/** Recent transactions, tappable to edit or delete. */
export default function TransactionList() {
  const txs = useRecentTransactions();

  // TODO: wire onEdit to the entry sheet, onDelete to deleteTransaction + UndoToast.
  return (
    <section className="mt-6">
      <h2 className="text-sm text-dim">Recent</h2>
      <ul className="mt-2 divide-y divide-line">
        {txs.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </ul>
    </section>
  );
}
