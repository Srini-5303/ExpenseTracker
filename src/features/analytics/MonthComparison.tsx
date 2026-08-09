import { useMemo } from 'react';
import type { Transaction } from '@/types';
import { categoryTotals } from '@/lib/derive';
import { formatCents, percentChange } from '@/lib/money';
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';
import { monthEnd, shiftMonth } from '@/lib/dates';

/**
 * This month against last, per category. Grouped horizontal bars read better on
 * a narrow phone than two pies side by side, and they make the delta directly
 * legible.
 *
 * Built from plain elements rather than a chart library: at 440px the exact
 * placement of the label, the two bars, and the percent change matters more than
 * anything an axis would give, and every row is already directly labeled.
 */
export default function MonthComparison({
  txs,
  month,
}: {
  txs: readonly Transaction[];
  month: string;
}) {
  const previous = shiftMonth(month, -1);

  const rows = useMemo(() => {
    const now = categoryTotals(txs, `${month}-01`, monthEnd(month));
    const then = categoryTotals(txs, `${previous}-01`, monthEnd(previous));
    return CATEGORY_ORDER.map((category) => ({
      category,
      now: now.get(category) ?? 0,
      then: then.get(category) ?? 0,
    }))
      .filter((r) => r.now > 0 || r.then > 0)
      .sort((a, b) => b.now - a.now);
  }, [txs, month, previous]);

  const widest = Math.max(1, ...rows.flatMap((r) => [r.now, r.then]));

  if (rows.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="eyebrow">This month vs last</h2>

      <div className="mt-2 flex gap-4 text-xs text-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-xs bg-ink" />
          This month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-xs bg-line" />
          Last month
        </span>
      </div>

      <ul className="mt-3 space-y-3.5">
        {rows.map((r) => {
          const change = percentChange(r.now, r.then);
          return (
            <li key={r.category}>
              <div className="flex items-baseline gap-2 text-sm">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[r.category] }}
                />
                <span className="flex-1">{CATEGORY_LABEL[r.category]}</span>
                <span className="num text-dim">
                  {change === null ? 'new' : `${change > 0 ? '+' : ''}${Math.round(change)}%`}
                </span>
                <span className="num w-20 text-right">{formatCents(r.now)}</span>
              </div>
              {/* Two bars on one scale, with a 2px surface gap between them. */}
              <div className="mt-1.5 ml-4 space-y-0.5">
                <div
                  className="h-1.5 rounded-full bg-ink"
                  style={{ width: `${Math.max(1, (r.now / widest) * 100)}%` }}
                />
                <div
                  className="h-1.5 rounded-full bg-line"
                  style={{ width: `${Math.max(1, (r.then / widest) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
