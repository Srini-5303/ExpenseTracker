import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { Transaction } from '@/types';
import { savingsOverTime } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { formatMonth } from '@/lib/dates';

/**
 * The running savings balance, month by month. Cumulative rather than
 * per-month deposits, because the question savings is for is "is this actually
 * growing", and a bar chart of deposits answers a different one.
 *
 * Not scoped to the month picker above it — a savings balance has no month.
 *
 * Ink, not a category hue: saving is not a category, and colour in this app
 * means exactly one thing.
 */
export default function SavingsOverTime({ txs }: { txs: readonly Transaction[] }) {
  const series = useMemo(() => savingsOverTime(txs), [txs]);

  if (series.length === 0) return null;

  const latest = series.at(-1)!.cents;

  return (
    <section className="mt-8">
      <h2 className="eyebrow">Saved</h2>
      <p className="num mt-1 text-2xl">{formatCents(latest)}</p>

      <div className="mt-3 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-ink)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-ink)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => formatMonth(String(m)).slice(0, 3)}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              tick={{ fill: 'var(--color-dim)', fontSize: 11 }}
              minTickGap={24}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-line)' }}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
                borderRadius: 8,
                fontSize: 13,
              }}
              labelFormatter={(m) => formatMonth(String(m))}
              formatter={(cents) => [formatCents(Number(cents)), 'Balance']}
            />
            <Area
              dataKey="cents"
              type="monotone"
              stroke="var(--color-ink)"
              strokeWidth={2}
              fill="url(#savings-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
