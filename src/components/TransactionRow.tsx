import type { Transaction, TxType } from '@/types';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';

const TYPE_LABEL: Record<TxType, string> = {
  expense: 'Expense', // unreachable in practice: every expense carries a category
  income: 'Paycheck',
  reimbursement: 'Money back',
  card_payment: 'Card payment',
  savings_deposit: 'To savings',
  savings_withdrawal: 'From savings',
};

/**
 * The one place the two-amount model is visible. A split row shows the full
 * charge with "$50.00 yours" beneath it, and seeing that here is what makes the
 * analytics believable later.
 *
 * Payment method is a small dim mark. It must not carry the weight of the amount
 * or the category.
 */
export default function TransactionRow({
  tx,
  onSelect,
}: {
  tx: Transaction;
  onSelect: (tx: Transaction) => void;
}) {
  const isSplit = tx.ownShareCents !== tx.amountCents;
  const title = tx.note || (tx.category ? CATEGORY_LABEL[tx.category] : TYPE_LABEL[tx.type]);

  return (
    <li>
      <button
        onClick={() => onSelect(tx)}
        className="flex w-full items-center gap-3 py-3.5 text-left active:bg-surface"
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{
            backgroundColor: tx.category ? CATEGORY_COLOR[tx.category] : 'var(--color-line)',
          }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{title}</span>
          <span className="block text-xs text-dim">
            {formatShortDate(tx.date)}
            {tx.category && tx.note ? ` · ${CATEGORY_LABEL[tx.category]}` : ''}
            {tx.trip ? ` · ${tx.trip}` : ''}
            {tx.method ? ` · ${tx.method}` : ''}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="num block">{formatCents(tx.amountCents)}</span>
          {isSplit && (
            <span className="num block text-xs text-dim">{formatCents(tx.ownShareCents)} yours</span>
          )}
        </span>
      </button>
    </li>
  );
}
