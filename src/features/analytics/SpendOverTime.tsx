import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { Transaction } from '@/types';
import { dailyTotals } from '@/lib/derive';
import { formatCents } from '@/lib/money';
import { daysInMonth, formatShortDate, monthEnd } from '@/lib/dates';

/**
 * Spending by day across the month. Every day is present even when nothing was
 * spent, so a gap reads as a zero rather than as missing data.
 *
 * One series, so no legend: the heading names it.
 */
export default function SpendOverTime({
  txs,
  month,
}: {
  txs: readonly Transaction[];
  month: string;
}) {
  const days = useMemo(() => {
    const totals = dailyTotals(txs, `${month}-01`, monthEnd(month));
    return daysInMonth(month).map((date) => ({ date, cents: totals.get(date) ?? 0 }));
  }, [txs, month]);

  const busiest = Math.max(...days.map((d) => d.cents));

  return (
    <section className="mt-8">
      <h2 className="eyebrow">By day</h2>
      {busiest === 0 ? (
        <p className="mt-3 text-sm text-dim">No spending this month.</p>
      ) : (
        <div className="mt-3 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d.slice(-2).replace(/^0/, '')}
                interval={6}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-line)' }}
                tick={{ fill: 'var(--color-dim)', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-surface)' }}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelFormatter={(d) => formatShortDate(String(d))}
                formatter={(cents) => [formatCents(Number(cents)), 'Spent']}
              />
              <Bar
                dataKey="cents"
                fill="var(--color-ink)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
