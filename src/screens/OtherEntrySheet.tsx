import { useState } from 'react';
import type { PayMethod, Transaction, TxType } from '@/types';
import { addTransaction, replaceTransaction } from '@/hooks/useTransactions';
import { parseAmount } from '@/lib/money';
import { today } from '@/lib/dates';
import Sheet from '@/components/Sheet';
import AmountInput from '@/components/AmountInput';
import MethodToggle from '@/components/MethodToggle';
import NoteDateRow from '@/components/NoteDateRow';
import DeleteAction from '@/components/DeleteAction';

type OtherType = Exclude<TxType, 'expense'>;

/**
 * Paychecks, reimbursements, and card payments.
 *
 *  income        — increases cash, has no category and no method
 *  reimbursement — increases cash, is NOT income, and does NOT reduce the card
 *                  balance, because the bank still wants the full charge until
 *                  the bill is paid. Nothing is matched to an original
 *                  transaction and nothing is ever marked settled.
 *  card_payment  — moves money from cash to the card balance. It is not an
 *                  expense and must never reach analytics: the purchases behind
 *                  it were already recorded when they happened.
 *  savings       — a transfer in either direction. Also not spending: a month of
 *                  diligent saving must not read as a month of overspending.
 *
 * All of them set ownShareCents equal to amountCents.
 */
const COPY: Record<OtherType, { title: string; label: string; help: string }> = {
  income: {
    title: 'Paycheck',
    label: 'Amount received',
    help: 'Money coming in. Adds to cash on hand.',
  },
  reimbursement: {
    title: 'Money back',
    label: 'Amount received',
    help: 'Someone paid you back. Adds to cash, and never counts as spending or income.',
  },
  card_payment: {
    title: 'Card payment',
    label: 'Amount paid',
    help: 'Pays down the card from cash. Never counts as spending — those purchases were logged when you made them.',
  },
  savings_deposit: {
    title: 'To savings',
    label: 'Amount saved',
    help: 'Moves cash into savings. Not spending — the money is still yours, it just moved.',
  },
  savings_withdrawal: {
    title: 'From savings',
    label: 'Amount taken out',
    help: 'Moves savings back into cash. Whatever you then spend it on gets logged as its own expense.',
  },
};

export default function OtherEntrySheet({
  type,
  existing,
  onDelete,
  onClose,
}: {
  type: OtherType;
  existing?: Transaction;
  onDelete: (tx: Transaction) => void;
  onClose: () => void;
}) {
  const copy = COPY[type];
  const [amountText, setAmountText] = useState(
    existing ? (existing.amountCents / 100).toFixed(2) : '',
  );
  const [method, setMethod] = useState<PayMethod>(existing?.method ?? 'debit');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? today());

  const amountCents = parseAmount(amountText);
  const [attempted, setAttempted] = useState(false);
  const valid = amountCents !== null && amountCents > 0;

  async function save() {
    if (!valid) return setAttempted(true);
    if (amountCents === null) return;
    const fields = {
      date,
      type,
      amountCents,
      ownShareCents: amountCents,
      ...(type === 'card_payment' ? { method } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    if (existing) await replaceTransaction(existing, fields);
    else await addTransaction(fields);
    onClose();
  }

  return (
    <Sheet
      title={copy.title}
      onClose={onClose}
      onSave={() => void save()}
      error={attempted && !valid ? 'Enter an amount.' : undefined}
      {...(existing ? { extraAction: <DeleteAction onDelete={() => onDelete(existing)} /> } : {})}
    >
      <AmountInput
        label={copy.label}
        value={amountText}
        onChange={setAmountText}
        autoFocus={!existing}
      />

      <div className="space-y-6 pb-6">
        <p className="px-5 text-sm leading-relaxed text-dim">{copy.help}</p>
        {/* A card payment comes out of debit or cash — that is where the money is. */}
        {type === 'card_payment' && (
          <MethodToggle value={method} onChange={setMethod} options={['debit', 'cash']} />
        )}
        <NoteDateRow note={note} date={date} onNote={setNote} onDate={setDate} />
      </div>
    </Sheet>
  );
}
