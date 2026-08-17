import { useMemo, useState } from 'react';
import type { Transaction } from '@/types';
import { tripTotals } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';

/**
 * What each trip cost, own share only.
 *
 * Deliberately not scoped to the month picker above it — a trip runs across
 * whatever dates it ran across — so every row states its own date range.
 *
 * Tapping a trip opens the charges behind the total. A trip figure you cannot
 * break down is a number you have to take on faith.
 */
export default function TripTotals({ txs }: { txs: readonly Transaction[] }) {
  const trips = useMemo(() => tripTotals(txs), [txs]);
  const [open, setOpen] = useState<string | null>(null);

  if (trips.length === 0) return null;

  return (
    <section className="mt-8 pb-4">
      <h2 className="eyebrow">Trips, all time</h2>
      <ul className="mt-2 divide-y divide-line">
        {trips.map((t) => {
          const expanded = open === t.trip;
          return (
            <li key={t.trip}>
              <button
                onClick={() => setOpen(expanded ? null : t.trip)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 py-3 text-left active:bg-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{t.trip}</span>
                  <span className="block text-xs text-dim">
                    {formatShortDate(t.from)}
                    {t.from === t.to ? '' : ` – ${formatShortDate(t.to)}`} ·{' '}
                    {t.count === 1 ? '1 charge' : `${t.count} charges`}
                  </span>
                </span>
                <span className="num shrink-0">{formatCents(t.cents)}</span>
                <span className="shrink-0 text-dim">{expanded ? '⌃' : '⌄'}</span>
              </button>

              {expanded && <Charges txs={txs} trip={t.trip} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Amounts are the own share, matching the trip total above and every other
 * figure on this screen. A split charge also shows what actually hit the card,
 * so the two numbers are never confused.
 */
function Charges({ txs, trip }: { txs: readonly Transaction[]; trip: string }) {
  const charges = txs
    .filter((t) => t.type === 'expense' && t.trip === trip)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ul className="mb-3 ml-3 border-l border-line pl-3">
      {charges.map((tx) => (
        <li key={tx.id} className="flex items-center gap-2.5 py-2 text-sm">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: tx.category ? CATEGORY_COLOR[tx.category] : 'var(--color-line)',
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              {tx.note || (tx.category ? CATEGORY_LABEL[tx.category] : 'Expense')}
            </span>
            <span className="block text-xs text-dim">
              {formatShortDate(tx.date)}
              {tx.category && tx.note ? ` · ${CATEGORY_LABEL[tx.category]}` : ''}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="num block">{formatCents(tx.ownShareCents)}</span>
            {tx.ownShareCents !== tx.amountCents && (
              <span className="num block text-xs text-dim">of {formatCents(tx.amountCents)}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
