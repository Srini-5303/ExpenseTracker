import { formatCents } from '@/lib/money';

/** Own-share spending only. Week runs Monday–Sunday. */
export default function SpendSummary({
  today,
  week,
  month,
}: {
  today: number;
  week: number;
  month: number;
}) {
  const cells: readonly [string, number][] = [
    ['Today', today],
    ['This week', week],
    ['This month', month],
  ];

  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      {cells.map(([label, cents]) => (
        <div key={label} className="rounded-xl bg-surface p-3">
          <p className="text-xs text-dim">{label}</p>
          <p className="text-lg">{formatCents(cents)}</p>
        </div>
      ))}
    </div>
  );
}
