import type { Transaction } from '@/types';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';

/**
 * The one place the two-amount model is visible. A split row shows the full charge
 * with "$50.00 yours" beneath it — seeing that here is what makes the analytics
 * believable later. Payment method is a small mark, never the weight of the amount.
 */
export default function TransactionRow({ tx }: { tx: Transaction }) {
  const isSplit = tx.ownShareCents !== tx.amountCents;

  return (
    <li className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {tx.category && (
          <span
            className="size-2 rounded-full"
            style={{ background: CATEGORY_COLOR[tx.category] }}
          />
        )}
        <div>
          <p>{tx.note || (tx.category ? CATEGORY_LABEL[tx.category] : tx.type)}</p>
          <p className="text-xs text-dim">
            {formatShortDate(tx.date)}
            {tx.method && ` · ${tx.method}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p>{formatCents(tx.amountCents)}</p>
        {isSplit && <p className="text-xs text-dim">{formatCents(tx.ownShareCents)} yours</p>}
      </div>
    </li>
  );
}
