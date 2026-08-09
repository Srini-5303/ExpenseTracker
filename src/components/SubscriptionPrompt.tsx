import type { Subscription } from '@/types';
import { addTransaction } from '@/hooks/useTransactions';
import { markLogged, removeSubscription } from '@/hooks/useSubscriptions';
import { formatCents } from '@/lib/money';
import { currentMonthKey, dayInMonth } from '@/lib/dates';
import { CATEGORY_COLOR } from '@/lib/categories';

/**
 * The whole point of the recurring feature: it asks, it does not assume. A
 * subscription is only written to the ledger once you confirm it is still
 * running, so a cancelled service can never keep charging you on paper.
 *
 * Answering no removes the reminder. Charges already logged in past months stay
 * exactly where they are — they really happened.
 */
export default function SubscriptionPrompt({ sub }: { sub: Subscription }) {
  const month = currentMonthKey();

  async function stillActive() {
    await addTransaction({
      date: dayInMonth(month, sub.dayOfMonth),
      type: 'expense',
      amountCents: sub.amountCents,
      ownShareCents: sub.amountCents,
      category: 'subscriptions',
      method: sub.method,
      note: sub.name,
    });
    await markLogged(sub.id);
  }

  return (
    <div className="mt-5 rounded-md border border-line p-4">
      <div className="flex items-baseline gap-3">
        <span
          className="size-2 shrink-0 translate-y-[-1px] rounded-full"
          style={{ backgroundColor: CATEGORY_COLOR.subscriptions }}
        />
        <span className="flex-1">{sub.name}</span>
        <span className="num">{formatCents(sub.amountCents)}</span>
      </div>
      <p className="mt-1 ml-5 text-sm text-dim">Still active?</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => void stillActive()}
          className="flex-1 rounded-full bg-ink py-2.5 text-sm font-medium text-bg active:scale-[0.98]"
        >
          Yes, log it
        </button>
        <button
          onClick={() => void removeSubscription(sub.id)}
          className="flex-1 rounded-full border border-line py-2.5 text-sm text-dim active:scale-[0.98] active:text-ink"
        >
          No, cancelled
        </button>
      </div>
    </div>
  );
}
