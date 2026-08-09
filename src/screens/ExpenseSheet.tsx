import { useState } from 'react';
import type { Category, PayMethod, Transaction } from '@/types';
import { addTransaction, updateTransaction } from '@/hooks/useTransactions';
import { lastMethod, rememberMethod } from '@/hooks/useSettings';
import { formatCents, parseAmount, splitEven } from '@/lib/money';
import { today } from '@/lib/dates';
import Sheet from '@/components/Sheet';
import AmountInput from '@/components/AmountInput';
import CategoryChips from '@/components/CategoryChips';
import MethodToggle from '@/components/MethodToggle';
import SplitControl, { type SplitMode } from '@/components/SplitControl';
import NoteDateRow from '@/components/NoteDateRow';
import DeleteAction from '@/components/DeleteAction';

/**
 * The primary flow, and it should take under fifteen seconds: amount, category,
 * credit or debit, split, note, date.
 *
 * Also the edit surface. An existing transaction opens here with both figures
 * editable, so a split entered wrong is corrected without deleting and re-adding.
 */
export default function ExpenseSheet({
  existing,
  initialCategory,
  onDelete,
  onClose,
}: {
  existing?: Transaction;
  initialCategory?: Category;
  onDelete: (tx: Transaction) => void;
  onClose: () => void;
}) {
  const [amountText, setAmountText] = useState(
    existing ? (existing.amountCents / 100).toFixed(2) : '',
  );
  const [category, setCategory] = useState<Category | null>(
    existing?.category ?? initialCategory ?? null,
  );
  const [method, setMethod] = useState<PayMethod>(existing?.method ?? lastMethod());
  // A stored transaction keeps only the amounts, never the headcount, so an
  // existing split reopens as an exact share rather than guessing a number.
  const [mode, setMode] = useState<SplitMode>(
    existing && existing.ownShareCents !== existing.amountCents ? 'exact' : 'none',
  );
  const [headcount, setHeadcount] = useState(2);
  const [exactText, setExactText] = useState(
    existing ? (existing.ownShareCents / 100).toFixed(2) : '',
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? today());

  const amountCents = parseAmount(amountText);
  const ownShareCents = computeOwnShare(amountCents, mode, headcount, exactText);
  const canSave = amountCents !== null && amountCents > 0 && category !== null;

  async function save() {
    if (amountCents === null || category === null || ownShareCents === null) return;
    const fields = {
      date,
      type: 'expense' as const,
      amountCents,
      ownShareCents,
      category,
      method,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    // ownShareCents is computed once, here, and stored. It is never recomputed on
    // read, so past records survive any later change to split logic.
    if (existing) await updateTransaction(existing.id, fields);
    else await addTransaction(fields);
    rememberMethod(method);
    onClose();
  }

  return (
    <Sheet
      title={existing ? 'Edit expense' : 'New expense'}
      onClose={onClose}
      onSave={() => void save()}
      canSave={canSave}
      {...(existing ? { extraAction: <DeleteAction onDelete={() => onDelete(existing)} /> } : {})}
    >
      <AmountInput
        value={amountText}
        onChange={setAmountText}
        autoFocus={!existing}
        {...(mode !== 'none' && ownShareCents !== null
          ? { hint: `Your share ${formatCents(ownShareCents)}` }
          : {})}
      />

      <div className="mt-2 space-y-6 pb-6">
        <CategoryChips value={category} onChange={setCategory} />
        <MethodToggle value={method} onChange={setMethod} />
        <SplitControl
          mode={mode}
          headcount={headcount}
          exactText={exactText}
          onMode={setMode}
          onHeadcount={setHeadcount}
          onExactText={setExactText}
        />
        <NoteDateRow note={note} date={date} onNote={setNote} onDate={setDate} />
      </div>
    </Sheet>
  );
}

/**
 * The own share never exceeds the full charge — a typo in the exact field would
 * otherwise put more personal spending in the analytics than the bank ever saw.
 */
function computeOwnShare(
  amountCents: number | null,
  mode: SplitMode,
  headcount: number,
  exactText: string,
): number | null {
  if (amountCents === null) return null;
  if (mode === 'none') return amountCents;
  if (mode === 'even') return splitEven(amountCents, headcount);
  const exact = parseAmount(exactText);
  return exact === null ? amountCents : Math.min(exact, amountCents);
}
