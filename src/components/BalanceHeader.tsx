import type { CardReadout } from '@/hooks/useDerived';
import { METHOD_LABEL } from '@/lib/categories';
import { formatCents } from '@/lib/money';

/**
 * Cash on hand is the headline. Each card's balance, with its available credit
 * beneath, sits under a hairline — all sharing the same right edge so the figures
 * read as one aligned stack.
 *
 * Cards are listed separately rather than summed: one total would hide which
 * limit is close to being hit, which is the only reason to watch these numbers.
 *
 * Every card figure uses the full charge, never the own share — a card balance is
 * the credit-limit number.
 */
export default function BalanceHeader({
  cashOnHand,
  cards,
  savingsBalance,
}: {
  cashOnHand: number;
  cards: readonly CardReadout[];
  savingsBalance: number;
}) {
  return (
    <header className="pt-8">
      <p className="eyebrow">Cash on hand</p>
      <p className="num mt-1 text-[2.75rem] leading-none font-semibold">
        {formatCents(cashOnHand)}
      </p>

      <div className="mt-5 border-t border-line pt-3">
        {cards.map((c) => (
          <div key={c.card} className="mt-2 first:mt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-dim">{METHOD_LABEL[c.card]}</span>
              <span className="num text-lg">{formatCents(c.balance)}</span>
            </div>
            {c.available !== undefined && (
              <div className="mt-0.5 flex items-baseline justify-between text-xs text-dim">
                <span>Available</span>
                <span className="num">{formatCents(c.available)}</span>
              </div>
            )}
          </div>
        ))}
        {/* Only once there is something in it — an empty row reads as a nag. */}
        {savingsBalance !== 0 && (
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm text-dim">Savings</span>
            <span className="num text-lg">{formatCents(savingsBalance)}</span>
          </div>
        )}
      </div>
    </header>
  );
}
