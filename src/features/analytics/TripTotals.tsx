import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { tripTotals } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';

/**
 * What each trip cost, own share only.
 *
 * Deliberately not scoped to the month above it — a trip runs across whatever
 * dates it ran across — so every row states its own date range rather than
 * inheriting the month picker.
 */
export default function TripTotals({ txs }: { txs: readonly Transaction[] }) {
  const trips = useMemo(() => tripTotals(txs), [txs]);

  if (trips.length === 0) return null;

  return (
    <section className="mt-8 pb-4">
      <h2 className="eyebrow">Trips, all time</h2>
      <ul className="mt-2 divide-y divide-line">
        {trips.map((t) => (
          <li key={t.trip} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate">{t.trip}</span>
              <span className="block text-xs text-dim">
                {formatShortDate(t.from)}
                {t.from === t.to ? '' : ` – ${formatShortDate(t.to)}`} ·{' '}
                {t.count === 1 ? '1 charge' : `${t.count} charges`}
              </span>
            </span>
            <span className="num shrink-0">{formatCents(t.cents)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
