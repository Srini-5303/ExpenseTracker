import { useState } from 'react';
import type { AccountId, CardId, Transaction, TxType } from '@/types';
import { addTransaction, replaceTransaction } from '@/hooks/useTransactions';
import { ACCOUNT_IDS, CARD_IDS } from '@/lib/categories';
import { parseAmount } from '@/lib/money';
import { today } from '@/lib/dates';
import Sheet from '@/components/Sheet';
import AmountInput from '@/components/AmountInput';
import MethodToggle from '@/components/MethodToggle';
import NoteDateRow from '@/components/NoteDateRow';
import DeleteAction from '@/components/DeleteAction';

type OtherType = Exclude<TxType, 'expense'>;

/**
 * Paychecks, reimbursements, card payments, paybacks, and transfers. Every one
 * but a transfer names the bank account the money lands in or leaves from.
 *
 *  income        — increases the account, has no category
 *  reimbursement — increases the account, is NOT income, and does NOT reduce the card
 *                  balance, because the bank still wants the full charge until
 *                  the bill is paid. Nothing is matched to an original
 *                  transaction and nothing is ever marked settled.
 *  card_payment  — moves money from an account to ONE card's balance. It is not an
 *                  expense and must never reach analytics: the purchases behind
 *                  it were already recorded when they happened.
 *  payback       — the mirror of a reimbursement: money goes out to someone who
 *                  covered you. The expense itself was already logged as "paid
 *                  for me", so this is only the money moving, never spending.
 *  loan_payment  — money leaving an account towards the loan. Not spending; its
 *                  running total is shown on its own in analytics.
 *  to_amex/chase — a transfer between the two accounts. Also not spending: the
 *                  money is still yours, it just moved.
 *
 * All of them set ownShareCents equal to amountCents.
 */
const COPY: Record<OtherType, { title: string; label: string; help: string }> = {
  income: {
    title: 'Paycheck',
    label: 'Amount received',
    help: 'Money coming in. Adds to the account it lands in.',
  },
  reimbursement: {
    title: 'Money back',
    label: 'Amount received',
    help: 'Someone paid you back. Adds to the account, and never counts as spending or income.',
  },
  card_payment: {
    title: 'Card payment',
    label: 'Amount paid',
    help: 'Pays down one card from an account. Never counts as spending — those purchases were logged when you made them.',
  },
  payback: {
    title: 'Pay back',
    label: 'Amount paid',
    help: 'You paid someone back. Comes out of the account, and never counts as spending — the expense was logged when they covered you.',
  },
  loan_payment: {
    title: 'Loan payment',
    label: 'Amount paid',
    help: 'Comes out of the account and adds to your loan payments total. Never counts as spending.',
  },
  to_amex: {
    title: 'To Amex',
    label: 'Amount moved',
    help: 'Moves money from the Chase account to the Amex account. Not spending — the money is still yours, it just moved.',
  },
  to_chase: {
    title: 'To Chase',
    label: 'Amount moved',
    help: 'Moves money from the Amex account to the Chase account. Not spending — the money is still yours, it just moved.',
  },
};

/** Which way the account toggle reads: money landing in it, or leaving it. */
const ACCOUNT_LABEL: Partial<Record<OtherType, string>> = {
  income: 'Into',
  reimbursement: 'Into',
  card_payment: 'Paid from',
  payback: 'Paid from',
  loan_payment: 'Paid from',
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
  // An old 'cash' or method-less entry opens as Chase, which is what it counts as.
  const [account, setAccount] = useState<AccountId>(
    existing?.method === 'amex_acc' ? 'amex_acc' : 'debit',
  );
  const accountLabel = ACCOUNT_LABEL[type];
  const [card, setCard] = useState<CardId>(existing?.card ?? 'chase');
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
      ...(accountLabel ? { method: account } : {}),
      ...(type === 'card_payment' ? { card } : {}),
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
        {/* Which card is paid down, and which account the money leaves. Both are
            needed on a card payment, and they are never the same choice. */}
        {type === 'card_payment' && (
          <MethodToggle label="Card paid" value={card} onChange={setCard} options={CARD_IDS} />
        )}
        {accountLabel && (
          <MethodToggle
            label={accountLabel}
            value={account}
            onChange={setAccount}
            options={ACCOUNT_IDS}
          />
        )}
        <NoteDateRow note={note} date={date} onNote={setNote} onDate={setDate} />
      </div>
    </Sheet>
  );
}
