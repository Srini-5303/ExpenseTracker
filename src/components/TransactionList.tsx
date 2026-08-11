import { useState } from 'react';
import type { Transaction } from '@/types';
import { useTransactions } from '@/hooks/useTransactions';
import { currentMonthKey, formatMonth, monthKey } from '@/lib/dates';
import TransactionRow from '@/components/TransactionRow';

const PREVIEW = 5;

/**
 * Five rows by default. The home screen answers "where am I right now", and a
 * long ledger buries the balances above it — the rest of the month is one tap
 * away for when the question is actually "what did I spend it on".
 */
export default function TransactionList({ onSelect }: { onSelect: (tx: Transaction) => void }) {
  const txs = useTransactions();
  const [expanded, setExpanded] = useState(false);

  const month = currentMonthKey();
  const thisMonth = txs.filter((tx) => monthKey(tx.date) === month);
  const shown = expanded ? thisMonth : txs.slice(0, PREVIEW);
  const hasMore = thisMonth.length > shown.length;

  return (
    <section className="mt-7">
      <h2 className="eyebrow">{expanded ? formatMonth(month) : 'Recent'}</h2>

      {txs.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Nothing logged yet. The first thing you buy today goes here.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {shown.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} onSelect={onSelect} />
          ))}
        </ul>
      )}

      {expanded && shown.length === 0 && (
        <p className="mt-3 text-sm text-dim">Nothing logged in {formatMonth(month)} yet.</p>
      )}

      {(hasMore || expanded) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-full border border-line py-3 text-sm text-dim active:scale-[0.98] active:text-ink"
        >
          {expanded ? 'Show less' : 'More transactions'}
        </button>
      )}
    </section>
  );
}
