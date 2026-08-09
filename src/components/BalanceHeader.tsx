import { formatCents } from '@/lib/money';

/** Cash on hand is large; card balance and available credit are secondary. */
export default function BalanceHeader({
  cashOnHand,
  cardBalance,
  availableCredit,
}: {
  cashOnHand: number;
  cardBalance: number;
  availableCredit: number | undefined;
}) {
  return (
    <header className="pt-6">
      <p className="text-sm text-dim">Cash on hand</p>
      <p className="text-5xl">{formatCents(cashOnHand)}</p>
      <p className="mt-2 text-sm text-dim">
        Card {formatCents(cardBalance)}
        {availableCredit !== undefined && ` · ${formatCents(availableCredit)} available`}
      </p>
    </header>
  );
}
