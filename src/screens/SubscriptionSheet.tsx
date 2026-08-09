import { useState } from 'react';
import type { Subscription } from '@/types';
import { removeSubscription, updateSubscription } from '@/hooks/useSubscriptions';
import { parseAmount } from '@/lib/money';
import Sheet from '@/components/Sheet';
import AmountInput from '@/components/AmountInput';
import SubscriptionOptions from '@/components/SubscriptionOptions';

/** Edit a recurring reminder: rename it, re-price it, move the billing day, or stop it. */
export default function SubscriptionSheet({
  sub,
  onClose,
}: {
  sub: Subscription;
  onClose: () => void;
}) {
  const [amountText, setAmountText] = useState((sub.amountCents / 100).toFixed(2));
  const [name, setName] = useState(sub.name);
  const [dayOfMonth, setDayOfMonth] = useState(sub.dayOfMonth);

  const amountCents = parseAmount(amountText);

  async function save() {
    if (amountCents === null || amountCents <= 0) return;
    await updateSubscription(sub.id, { name: name.trim() || sub.name, amountCents, dayOfMonth });
    onClose();
  }

  async function stop() {
    await removeSubscription(sub.id);
    onClose();
  }

  return (
    <Sheet
      title="Subscription"
      onClose={onClose}
      onSave={() => void save()}
      canSave={amountCents !== null && amountCents > 0}
      extraAction={
        <button
          onClick={() => void stop()}
          className="w-full rounded-full border border-line py-3 text-sm text-dim active:scale-[0.98] active:text-ink"
        >
          Stop reminding me
        </button>
      }
    >
      <AmountInput label="Monthly charge" value={amountText} onChange={setAmountText} />

      <div className="space-y-6 pb-6">
        <label className="block px-5">
          <span className="eyebrow">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md bg-surface px-3 py-2.5 outline-none focus:ring-1 focus:ring-line"
          />
        </label>
        {/* kind=null hides the monthly/trial choice: this rule is already monthly. */}
        <SubscriptionOptions
          kind={null}
          dayOfMonth={dayOfMonth}
          onKind={() => {}}
          onDayOfMonth={setDayOfMonth}
        />
      </div>
    </Sheet>
  );
}
