import { formatCents } from '@/lib/money';

/**
 * Own-share spending only, and the week runs Monday through Sunday.
 * Hairline dividers instead of cards: three boxed tiles would read as a
 * dashboard, and this screen is meant to be glanced at, not studied.
 */
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
    ['Week', week],
    ['Month', month],
  ];

  return (
    <div className="mt-7 grid grid-cols-3 divide-x divide-line border-y border-line">
      {cells.map(([label, cents]) => (
        <div key={label} className="py-3 pr-3 pl-3 first:pl-0">
          <p className="eyebrow">{label}</p>
          <p className="num mt-1 text-base">{formatCents(cents)}</p>
        </div>
      ))}
    </div>
  );
}
