import { useState } from 'react';
import type { Category, PayMethod, Transaction } from '@/types';
import { addTransaction, replaceTransaction } from '@/hooks/useTransactions';
import { lastMethod, rememberMethod } from '@/hooks/useSettings';
import { addSubscription } from '@/hooks/useSubscriptions';
import { useTrips } from '@/hooks/useTrips';
import { formatCents, parseAmount, splitEven } from '@/lib/money';
import { fromISODate, today } from '@/lib/dates';
import { CATEGORY_LABEL } from '@/lib/categories';
import Sheet from '@/components/Sheet';
import AmountInput from '@/components/AmountInput';
import CategoryChips from '@/components/CategoryChips';
import MethodToggle from '@/components/MethodToggle';
import SplitControl, { type SplitMode } from '@/components/SplitControl';
import SubscriptionOptions, { type SubKind } from '@/components/SubscriptionOptions';
import TripControl from '@/components/TripControl';
import NoteDateRow from '@/components/NoteDateRow';
import DeleteAction from '@/components/DeleteAction';

/**
 * The primary flow, and it should take under fifteen seconds: amount, category,
 * credit or debit, split, note, date.
 *
 * Subscriptions swap the split control for the recurring options, since a
 * subscription is never shared with anyone.
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
  const [onTrip, setOnTrip] = useState(existing?.trip !== undefined);
  const [trip, setTrip] = useState(existing?.trip ?? '');
  const [subKind, setSubKind] = useState<SubKind>('monthly');
  const trips = useTrips();
  const [dayOfMonth, setDayOfMonth] = useState(fromISODate(today()).getDate());

  const isSubscription = category === 'subscriptions';
  // A trial genuinely cost nothing, so an empty amount reads as $0 rather than
  // blocking the save.
  const amountCents =
    isSubscription && subKind === 'trial' && amountText.trim() === '' ? 0 : parseAmount(amountText);
  const ownShareCents = isSubscription
    ? amountCents
    : computeOwnShare(amountCents, mode, headcount, exactText);
  // A monthly reminder must be named: "Subscription — still active?" tells you
  // nothing when three of them come due in the same week.
  const needsName = isSubscription && subKind === 'monthly' && note.trim() === '';
  const isTrial = isSubscription && subKind === 'trial';

  // A nameless trip cannot be totalled, so the flag is meaningless without one.
  const needsTrip = onTrip && trip.trim() === '';

  const missing = [
    amountCents === null || (amountCents <= 0 && !isTrial) ? 'enter an amount' : null,
    category === null ? 'pick a category' : null,
    needsName ? 'name the subscription' : null,
    needsTrip ? 'name the trip' : null,
  ].filter((m): m is string => m !== null);

  const [attempted, setAttempted] = useState(false);
  const error = attempted && missing.length > 0 ? sentence(missing) : undefined;

  async function save() {
    if (missing.length > 0) return setAttempted(true);
    if (amountCents === null || category === null || ownShareCents === null) return;
    const trimmed = note.trim();
    const fields = {
      date,
      type: 'expense' as const,
      amountCents,
      ownShareCents,
      category,
      method,
      ...(trimmed ? { note: trimmed } : {}),
      ...(onTrip ? { trip: trip.trim() } : {}),
    };
    // ownShareCents is computed once, here, and stored. It is never recomputed on
    // read, so past records survive any later change to split logic.
    if (existing) await replaceTransaction(existing, fields);
    else await addTransaction(fields);

    // The reminder is only ever created alongside a brand new charge, so editing
    // an old subscription row cannot quietly produce a second rule.
    if (!existing && isSubscription && subKind === 'monthly') {
      await addSubscription({
        name: trimmed || CATEGORY_LABEL.subscriptions,
        amountCents,
        dayOfMonth,
        method,
      });
    }

    rememberMethod(method);
    onClose();
  }

  return (
    <Sheet
      title={existing ? 'Edit expense' : 'New expense'}
      onClose={onClose}
      onSave={() => void save()}
      error={error}
      {...(existing ? { extraAction: <DeleteAction onDelete={() => onDelete(existing)} /> } : {})}
    >
      <AmountInput
        value={amountText}
        onChange={setAmountText}
        autoFocus={!existing}
        {...(isSubscription && subKind === 'trial'
          ? { hint: 'Free trial — logged as $0.00' }
          : !isSubscription && mode !== 'none' && ownShareCents !== null
            ? { hint: `Your share ${formatCents(ownShareCents)}` }
            : {})}
      />

      <div className="mt-2 space-y-6 pb-6">
        <CategoryChips value={category} onChange={setCategory} />
        <MethodToggle value={method} onChange={setMethod} />
        {isSubscription ? (
          <SubscriptionOptions
            kind={subKind}
            dayOfMonth={dayOfMonth}
            onKind={setSubKind}
            onDayOfMonth={setDayOfMonth}
          />
        ) : (
          <SplitControl
            mode={mode}
            headcount={headcount}
            exactText={exactText}
            onMode={setMode}
            onHeadcount={setHeadcount}
            onExactText={setExactText}
          />
        )}
        <TripControl
          on={onTrip}
          trip={trip}
          trips={trips}
          invalid={attempted && needsTrip}
          onToggle={setOnTrip}
          onTrip={setTrip}
        />
        <NoteDateRow
          note={note}
          date={date}
          onNote={setNote}
          onDate={setDate}
          {...(isSubscription ? { label: 'Name', placeholder: 'Netflix' } : {})}
          {...(attempted && needsName ? { hint: 'The monthly reminder needs a name.' } : {})}
        />
      </div>
    </Sheet>
  );
}

/** "Enter an amount and pick a category." — one sentence, however many are missing. */
function sentence(parts: string[]): string {
  const joined =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]!;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
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
