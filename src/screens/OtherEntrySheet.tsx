import type { TxType } from '@/types';

/**
 * Paychecks, reimbursements, and card payments. Occasional, not daily, so they
 * live behind a secondary control.
 *
 *  income        — no category, no method, ownShareCents === amountCents
 *  reimbursement — same shape; increases cash, is NOT income, never in analytics,
 *                  and does NOT reduce the card balance
 *  card_payment  — method is 'debit' or 'cash' (where the money comes from);
 *                  moves cash to card balance, is NOT an expense, never in analytics
 */
export default function OtherEntrySheet({ type }: { type: Exclude<TxType, 'expense'> }) {
  // TODO: amount, date, note. Method picker only for card_payment.
  void type;
  return <form className="safe-bottom flex flex-col gap-6 p-5" />;
}
