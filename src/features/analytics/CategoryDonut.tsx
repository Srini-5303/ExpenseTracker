import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { Category, Transaction } from '@/types';
import { categoryTotals, expensesIn } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';
import { monthEnd } from '@/lib/dates';

/**
 * Category breakdown for the month. A donut, because the question here is
 * proportional: what share of my spending is rent versus food.
 *
 * Tapping a segment — or its row — puts that category's exact figures in the
 * middle of the ring and dims the rest. The row list is not a legend: it is the
 * readable version of the same data, so identity never rests on color alone and
 * the numbers stay available without tapping anything.
 */
export default function CategoryDonut({
  txs,
  month,
}: {
  txs: readonly Transaction[];
  month: string;
}) {
  const [selected, setSelected] = useState<Category | null>(null);

  const { slices, total } = useMemo(() => {
    const start = `${month}-01`;
    const end = monthEnd(month);
    const totals = categoryTotals(txs, start, end);
    const counts = new Map<Category, number>();
    for (const t of expensesIn(txs, start, end)) {
      if (t.category) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    }
    const slices = CATEGORY_ORDER.filter((c) => (totals.get(c) ?? 0) > 0)
      .map((c) => ({ category: c, value: totals.get(c) ?? 0, count: counts.get(c) ?? 0 }))
      .sort((a, b) => b.value - a.value);
    return { slices, total: slices.reduce((sum, s) => sum + s.value, 0) };
  }, [txs, month]);

  // A category can disappear when the month changes; drop a stale selection.
  const active = slices.find((s) => s.category === selected) ?? null;

  if (total === 0) {
    return (
      <section className="mt-7">
        <h2 className="eyebrow">By category</h2>
        <p className="mt-3 text-sm text-dim">No spending this month.</p>
      </section>
    );
  }

  const toggle = (category: Category) =>
    setSelected((current) => (current === category ? null : category));

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
              onClick={(_, index) => {
                const slice = slices[index];
                if (slice) toggle(slice.category);
              }}
              // A 2px surface-colored gap keeps adjacent segments legible even
              // when two hues sit close together.
              stroke="var(--color-bg)"
              strokeWidth={2}
              className="cursor-pointer outline-none"
            >
              {slices.map((s) => (
                <Cell
                  key={s.category}
                  fill={CATEGORY_COLOR[s.category]}
                  fillOpacity={active && active.category !== s.category ? 0.28 : 1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-14 text-center">
          {active ? (
            <>
              <span className="eyebrow" style={{ color: CATEGORY_COLOR[active.category] }}>
                {CATEGORY_LABEL[active.category]}
              </span>
              <span className="num text-2xl">{formatCents(active.value)}</span>
              <span className="num mt-0.5 text-xs text-dim">
                {Math.round((active.value / total) * 100)}% ·{' '}
                {active.count === 1 ? '1 charge' : `${active.count} charges`}
              </span>
            </>
          ) : (
            <>
              <span className="eyebrow">Spent</span>
              <span className="num text-2xl">{formatCents(total)}</span>
            </>
          )}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {slices.map((s) => (
          <li key={s.category}>
            <button
              onClick={() => toggle(s.category)}
              aria-pressed={active?.category === s.category}
              className={`flex w-full items-center gap-3 py-2.5 text-left text-sm ${
                active && active.category !== s.category ? 'text-dim' : ''
              }`}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: CATEGORY_COLOR[s.category],
                  opacity: active && active.category !== s.category ? 0.35 : 1,
                }}
              />
              <span className="flex-1">{CATEGORY_LABEL[s.category]}</span>
              <span className="num text-dim">{Math.round((s.value / total) * 100)}%</span>
              <span className="num w-20 text-right">{formatCents(s.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
