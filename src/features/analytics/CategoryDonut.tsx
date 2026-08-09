import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/types';
import { categoryTotals } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';
import { monthEnd } from '@/lib/dates';

/**
 * Category breakdown for the month. A donut, because the question here is
 * proportional: what share of my spending is rent versus food.
 *
 * The list beneath is not a legend — it is the readable version of the same
 * data, so identity never rests on color alone and the exact figures stay
 * available without a hover.
 */
export default function CategoryDonut({
  txs,
  month,
}: {
  txs: readonly Transaction[];
  month: string;
}) {
  const { slices, total } = useMemo(() => {
    const totals = categoryTotals(txs, `${month}-01`, monthEnd(month));
    const slices = CATEGORY_ORDER.filter((c) => (totals.get(c) ?? 0) > 0)
      .map((c) => ({ category: c, value: totals.get(c) ?? 0 }))
      .sort((a, b) => b.value - a.value);
    return { slices, total: slices.reduce((sum, s) => sum + s.value, 0) };
  }, [txs, month]);

  if (total === 0) {
    return (
      <section className="mt-7">
        <h2 className="eyebrow">By category</h2>
        <p className="mt-3 text-sm text-dim">No spending this month.</p>
      </section>
    );
  }

  return (
    <section className="mt-7">
      <h2 className="eyebrow">By category</h2>

      <div className="relative mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="category"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              // A 2px surface-colored gap keeps adjacent segments legible even
              // when two hues sit close together.
              stroke="var(--color-bg)"
              strokeWidth={2}
            >
              {slices.map((s) => (
                <Cell key={s.category} fill={CATEGORY_COLOR[s.category]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="eyebrow">Spent</span>
          <span className="num text-2xl">{formatCents(total)}</span>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {slices.map((s) => (
          <li key={s.category} className="flex items-center gap-3 py-2.5 text-sm">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLOR[s.category] }}
            />
            <span className="flex-1">{CATEGORY_LABEL[s.category]}</span>
            <span className="num text-dim">{Math.round((s.value / total) * 100)}%</span>
            <span className="num w-20 text-right">{formatCents(s.value)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
