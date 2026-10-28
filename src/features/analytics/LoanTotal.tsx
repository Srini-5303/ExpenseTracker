import { useMemo, useState } from 'react';
import type { Transaction } from '@/types';
import { loanPayments } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import ChargeList from './ChargeList';

/**
 * Everything paid towards the loan, all time — laid out like a trip row, and
 * likewise not scoped to the month picker. Tapping it lists the payments behind
 * the total, each with the account it came from.
 */
export default function LoanTotal({ txs }: { txs: readonly Transaction[] }) {
  const { cents, payments } = useMemo(() => loanPayments(txs), [txs]);
  const [open, setOpen] = useState(false);

  const first = payments[0];
  const last = payments.at(-1);
  if (!first || !last) return null;

  return (
    <section className="mt-8 pb-4">
      <h2 className="eyebrow">Loan payments, all time</h2>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-2 flex w-full items-center gap-3 py-3 text-left active:bg-surface"
      >
        <span className="min-w-0 flex-1">
          <span className="block">Loan</span>
          <span className="block text-xs text-dim">
            {formatShortDate(first.date)}
            {first.date === last.date ? '' : ` – ${formatShortDate(last.date)}`} ·{' '}
            {payments.length === 1 ? '1 payment' : `${payments.length} payments`}
          </span>
        </span>
        <span className="num shrink-0">{formatCents(cents)}</span>
        <span className="shrink-0 text-dim">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && <ChargeList charges={payments} />}
    </section>
  );
}
