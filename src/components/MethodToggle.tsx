import type { PayMethod } from '@/types';
import { METHOD_LABEL } from '@/lib/categories';

/**
 * Defaults to whichever was used last (see hooks/useSettings). Expenses offer
 * credit, debit, and "paid for me"; a card payment offers debit and cash, since
 * that is where the money comes from.
 */
export default function MethodToggle({
  value,
  onChange,
  options = ['credit', 'debit', 'covered'],
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
          className={`flex-1 whitespace-nowrap rounded-full py-2.5 text-sm active:scale-[0.98] ${
            value === m ? 'bg-ink font-medium text-bg' : 'text-dim'
          }`}
        >
          {METHOD_LABEL[m]}
        </button>
      ))}
    </div>
  );
}
