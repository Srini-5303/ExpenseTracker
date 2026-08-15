import { useState } from 'react';
import type { TxType } from '@/types';

const OTHER: readonly [Exclude<TxType, 'expense'>, string][] = [
  ['income', 'Paycheck'],
  ['reimbursement', 'Money back'],
  ['card_payment', 'Card payment'],
  ['savings_deposit', 'To savings'],
  ['savings_withdrawal', 'From savings'],
];

/**
 * Primary action, lower third, safe-area padded. This screen is tall enough that
 * the top third is genuinely hard to reach one-handed, and a bottom-anchored
 * button without the safe-area inset sits under the home indicator.
 *
 * Paychecks, reimbursements, and card payments are occasional, not daily, so
 * they hide behind the small secondary control instead of competing for space.
 */
export default function AddButton({
  onAddExpense,
  onAddOther,
}: {
  onAddExpense: () => void;
  onAddOther: (type: Exclude<TxType, 'expense'>) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // The tab bar below already carries the safe-area inset, so this clears the
    // tab bar's full height rather than padding for the home indicator twice.
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-10 px-6">
      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="pointer-events-auto fixed inset-0"
          />
          <div className="fade-in pointer-events-auto relative mb-2 ml-auto w-48 overflow-hidden rounded-md border border-line bg-surface">
            {OTHER.map(([type, label]) => (
              <button
                key={type}
                onClick={() => {
                  setMenuOpen(false);
                  onAddOther(type);
                }}
                className="block w-full px-4 py-3 text-left text-sm active:bg-raised"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="pointer-events-auto flex gap-2">
        <button
          onClick={onAddExpense}
          className="flex-1 rounded-full bg-ink py-4 font-medium text-bg active:scale-[0.98]"
        >
          Add expense
        </button>
        <button
          aria-label="Other entry types"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="w-14 rounded-full border border-line bg-bg text-lg text-dim active:scale-[0.98]"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}
