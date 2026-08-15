import { formatCents } from '@/lib/money';

/**
 * Cash on hand is the headline. Card balance and available credit sit beneath a
 * hairline, sharing the same right edge so the figures read as one aligned stack.
 *
 * Both card figures use the full charge, never the own share — card balance is
 * the credit-limit number.
 */
export default function BalanceHeader({
  cashOnHand,
  cardBalance,
  availableCredit,
  savingsBalance,
}: {
  cashOnHand: number;
  cardBalance: number;
  availableCredit: number | undefined;
  savingsBalance: number;
}) {
  return (
    <header className="pt-8">
      <p className="eyebrow">Cash on hand</p>
      <p className="num mt-1 text-[2.75rem] leading-none font-semibold">
        {formatCents(cashOnHand)}
      </p>

      <div className="mt-5 border-t border-line pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-dim">Card balance</span>
          <span className="num text-lg">{formatCents(cardBalance)}</span>
        </div>
        {availableCredit !== undefined && (
          <div className="mt-1 flex items-baseline justify-between text-xs text-dim">
            <span>Available credit</span>
            <span className="num">{formatCents(availableCredit)}</span>
          </div>
        )}
        {/* Only once there is something in it — an empty row reads as a nag. */}
        {savingsBalance !== 0 && (
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm text-dim">Savings</span>
            <span className="num text-lg">{formatCents(savingsBalance)}</span>
          </div>
        )}
      </div>
    </header>
  );
}
