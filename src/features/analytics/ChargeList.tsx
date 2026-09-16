import type { Transaction } from '@/types';
import { formatCents } from '@/lib/money';
import { formatShortDate } from '@/lib/dates';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';

/**
 * The charges behind an analytics total, indented under the row that opened it.
 * A total you cannot break down is a number you have to take on faith.
 *
 * Amounts are the own share, matching the total above and every other figure on
 * this screen. A split charge also shows what actually hit the card, so the two
 * numbers are never confused.
 */
export default function ChargeList({
  charges,
  showCategory = true,
}: {
  charges: readonly Transaction[];
  showCategory?: boolean;
}) {
  return (
    <ul className="mb-3 ml-3 border-l border-line pl-3">
      {charges.map((tx) => (
        <li key={tx.id} className="flex items-center gap-2.5 py-2 text-sm">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: tx.category ? CATEGORY_COLOR[tx.category] : 'var(--color-line)',
            }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              {tx.note || (tx.category ? CATEGORY_LABEL[tx.category] : 'Expense')}
            </span>
            <span className="block text-xs text-dim">
              {formatShortDate(tx.date)}
              {showCategory && tx.category && tx.note ? ` · ${CATEGORY_LABEL[tx.category]}` : ''}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="num block">{formatCents(tx.ownShareCents)}</span>
            {tx.ownShareCents !== tx.amountCents && (
              <span className="num block text-xs text-dim">of {formatCents(tx.amountCents)}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
