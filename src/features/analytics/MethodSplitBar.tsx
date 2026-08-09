import { useMemo } from 'react';
import type { PayMethod, Transaction } from '@/types';
import { methodTotals } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { monthEnd } from '@/lib/dates';

const LABEL: Record<PayMethod, string> = {
  credit: 'Credit',
  debit: 'Debit',
  cash: 'Cash',
};

// Payment method is not a category, so it never borrows a category hue. These
// are steps of ink, which is also the honest encoding: one whole, split in two.
const SHADE: Record<PayMethod, string> = {
  credit: 'var(--color-ink)',
  debit: 'var(--color-dim)',
  cash: 'var(--color-line)',
};

/**
 * How much of the month was deferred to the card. One stacked bar is enough;
 * this does not need a screen of its own.
 */
export default function MethodSplitBar({
  txs,
  month,
}: {
  txs: readonly Transaction[];
  month: string;
}) {
  const { parts, total } = useMemo(() => {
    const totals = methodTotals(txs, `${month}-01`, monthEnd(month));
    const parts = (['credit', 'debit', 'cash'] as const)
      .map((method) => ({ method, cents: totals.get(method) ?? 0 }))
      .filter((p) => p.cents > 0);
    return { parts, total: parts.reduce((sum, p) => sum + p.cents, 0) };
  }, [txs, month]);

  if (total === 0) return null;

  return (
    <section className="mt-8 pb-4">
      <h2 className="eyebrow">Credit vs debit</h2>

      {/* gap-0.5 is the 2px surface gap between segments. */}
      <div className="mt-3 flex h-3 gap-0.5">
        {parts.map((p) => (
          <div
            key={p.method}
            className="rounded-full"
            style={{ width: `${(p.cents / total) * 100}%`, backgroundColor: SHADE[p.method] }}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.method} className="flex items-center gap-2">
            <span
              className="h-2 w-3 rounded-xs"
              style={{ backgroundColor: SHADE[p.method] }}
            />
            <span className="text-dim">{LABEL[p.method]}</span>
            <span className="num">{formatCents(p.cents)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
