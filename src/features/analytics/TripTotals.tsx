import { useMemo, useState } from 'react';
import type { Transaction } from '@/types';
import { tripTotals } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import ChargeList from './ChargeList';

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

              {expanded && (
                <ChargeList
                  charges={txs
                    .filter((x) => x.type === 'expense' && x.trip === t.trip)
                    .sort((a, b) => a.date.localeCompare(b.date))}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
