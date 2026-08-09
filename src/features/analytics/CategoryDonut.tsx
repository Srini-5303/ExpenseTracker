import { useMemo, useRef, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { Category, Transaction } from '@/types';
import { categoryTotals, expensesIn } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';
import { monthEnd } from '@/lib/dates';

const INNER_RATIO = 0.62;

/**
 * Category breakdown for the month. A donut, because the question here is
 * proportional: what share of my spending is rent versus food.
 *
 * Holding a finger on a segment — or hovering it — puts that category's exact
 * figures in the middle of the ring and dims the rest. Nothing persists: lift
 * the finger and the total comes back.
 *
 * Touch is hit-tested geometrically rather than through Recharts' mouse events,
 * because a sustained touch on iOS never fires mouseleave, so a tap would stick.
 * Doing the arithmetic here also means sliding a finger around the ring updates
 * live instead of only registering where it landed.
 *
 * The row list is not a legend: it is the readable version of the same data, so
 * the numbers stay available without touching anything.
 */
export default function CategoryDonut({
  txs,
  month,
}: {
  txs: readonly Transaction[];
  month: string;
}) {
  const ring = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Category | null>(null);

  const { slices, total } = useMemo(() => {
    const start = `${month}-01`;
    const end = monthEnd(month);
    const totals = categoryTotals(txs, start, end);
    const counts = new Map<Category, number>();
    for (const t of expensesIn(txs, start, end)) {
      if (t.category) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    }
    const ordered = CATEGORY_ORDER.filter((c) => (totals.get(c) ?? 0) > 0)
      .map((c) => ({ category: c, value: totals.get(c) ?? 0, count: counts.get(c) ?? 0 }))
      .sort((a, b) => b.value - a.value);
    const sum = ordered.reduce((acc, s) => acc + s.value, 0);

    // Cumulative sweep in degrees, clockwise from twelve o'clock, so a touch
    // point can be mapped straight back to a segment.
    let sweep = 0;
    const slices = ordered.map((s) => {
      const from = sweep;
      sweep += (s.value / sum) * 360;
      return { ...s, from, to: sweep };
    });
    return { slices, total: sum };
  }, [txs, month]);

  // A category can vanish when the month changes; never keep a stale selection.
  const active = slices.find((s) => s.category === selected) ?? null;

  function hitTest(clientX: number, clientY: number): Category | null {
    const rect = ring.current?.getBoundingClientRect();
    if (!rect) return null;
    const outer = Math.min(rect.width, rect.height) / 2;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const radius = Math.hypot(dx, dy);
    if (radius < outer * INNER_RATIO || radius > outer) return null;

    // Screen y grows downward, so negate it to get a standard math angle.
    const angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
    const clockwiseFromTop = (90 - angle + 360) % 360;
    return slices.find((s) => clockwiseFromTop >= s.from && clockwiseFromTop < s.to)?.category ?? null;
  }

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

      <div
        ref={ring}
        // pan-y keeps vertical scrolling over the chart working while a
        // sideways drag around the ring stays with us.
        className="relative mt-3 h-52 touch-pan-y"
        onTouchStart={(e) => setSelected(hitTest(e.touches[0]!.clientX, e.touches[0]!.clientY))}
        onTouchMove={(e) => setSelected(hitTest(e.touches[0]!.clientX, e.touches[0]!.clientY))}
        onTouchEnd={() => setSelected(null)}
        onTouchCancel={() => setSelected(null)}
        onMouseMove={(e) => setSelected(hitTest(e.clientX, e.clientY))}
        onMouseLeave={() => setSelected(null)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="category"
              innerRadius={`${INNER_RATIO * 100}%`}
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              // A 2px surface-colored gap keeps adjacent segments legible even
              // when two hues sit close together.
              stroke="var(--color-bg)"
              strokeWidth={2}
              className="outline-none"
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
          <li
            key={s.category}
            className={`flex items-center gap-3 py-2.5 text-sm ${
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
          </li>
        ))}
      </ul>
    </section>
  );
}
