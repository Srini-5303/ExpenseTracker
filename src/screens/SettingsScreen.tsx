import { useState } from 'react';
import type { Subscription } from '@/types';
import { useSettings, setCreditLimit } from '@/hooks/useSettings';
import { signOutUser, useAuth } from '@/hooks/useAuth';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import SubscriptionSheet from '@/screens/SubscriptionSheet';
import { CATEGORY_COLOR } from '@/lib/categories';
import { formatCents, parseAmount } from '@/lib/money';

/** The account, recurring subscriptions, and the credit limit. */
export default function SettingsScreen() {
  const settings = useSettings();
  const { user } = useAuth();
  const subs = useSubscriptions();
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [limitDraft, setLimitDraft] = useState<string | null>(null);

  function commitLimit() {
    if (limitDraft === null) return;
    const cents = limitDraft.trim() === '' ? null : parseAmount(limitDraft);
    if (limitDraft.trim() !== '' && cents === null) return setLimitDraft(null);
    void setCreditLimit(cents);
    setLimitDraft(null);
  }

  return (
    <div className="scroll-contain safe-top flex-1 px-6 pb-8">
      <h1 className="eyebrow pt-8">Settings</h1>

      <section className="mt-6 border-t border-line pt-5">
        <h2 className="eyebrow">Account</h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-sm text-dim">{user?.email}</span>
          <button
            onClick={() => void signOutUser()}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-sm active:scale-[0.98]"
          >
            Sign out
          </button>
        </div>
      </section>

      {subs.length > 0 && (
        <section className="mt-8 border-t border-line pt-5">
          <h2 className="eyebrow">Recurring subscriptions</h2>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            Each one asks on its billing day before anything is logged.
          </p>
          <ul className="mt-2 divide-y divide-line">
            {subs.map((sub) => (
              <li key={sub.id}>
                <button
                  onClick={() => setEditing(sub)}
                  className="flex w-full items-center gap-3 py-3 text-left active:bg-surface"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR.subscriptions }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{sub.name}</span>
                    <span className="block text-xs text-dim">
                      Day {sub.dayOfMonth} · {sub.method}
                    </span>
                  </span>
                  <span className="num shrink-0">{formatCents(sub.amountCents)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && <SubscriptionSheet sub={editing} onClose={() => setEditing(null)} />}

      <section className="mt-8 border-t border-line pt-5">
        <h2 className="eyebrow">Credit limit</h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          Optional. Setting it shows how much credit is left beside the card balance.
        </p>
        <input
          inputMode="decimal"
          placeholder="Not set"
          value={
            limitDraft ??
            (settings?.creditLimitCents === undefined ? '' : formatCents(settings.creditLimitCents))
          }
          onChange={(e) => setLimitDraft(e.target.value)}
          onBlur={commitLimit}
          className="num mt-4 w-full rounded-md bg-surface px-4 py-3 text-xl outline-none focus:ring-1 focus:ring-line"
        />
      </section>
    </div>
  );
}
