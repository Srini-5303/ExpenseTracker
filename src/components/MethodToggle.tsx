import type { PayMethod } from '@/types';

/**
 * Defaults to whichever was used last (see hooks/useSettings). Expenses offer
 * credit and debit; a card payment offers debit and cash, since that is where
 * the money comes from.
 */
export default function MethodToggle({
  value,
  onChange,
  options = ['credit', 'debit'],
}: {
  value: PayMethod;
  onChange: (method: PayMethod) => void;
  options?: readonly PayMethod[];
}) {
  return (
    <div className="mx-5 flex gap-1 rounded-full bg-surface p-1">
      {options.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={value === m}
          className={`flex-1 rounded-full py-2.5 text-sm capitalize active:scale-[0.98] ${
            value === m ? 'bg-ink font-medium text-bg' : 'text-dim'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
