import type { PayMethod } from '@/types';
import { METHOD_LABEL } from '@/lib/categories';

/**
 * Defaults to whichever was used last (see hooks/useSettings). An expense offers
 * both cards, debit, and "paid for me" — four options, so the grid wraps to two
 * rows of two. Two options still lay out as one row, and keep the pill shape.
 *
 * The label is only worn when a screen shows two of these at once, as the card
 * payment does: which card is being paid, and where the money comes from.
 */
export default function MethodToggle<T extends PayMethod>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (method: T) => void;
  options: readonly T[];
  label?: string;
}) {
  return (
    <div className="px-5">
      {label && <span className="eyebrow">{label}</span>}
      <div
        className={`grid grid-cols-2 gap-1 bg-surface p-1 ${label ? 'mt-2 ' : ''}${
          options.length > 2 ? 'rounded-2xl' : 'rounded-full'
        }`}
      >
        {options.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={value === m}
            className={`whitespace-nowrap rounded-full py-2.5 text-sm active:scale-[0.98] ${
              value === m ? 'bg-ink font-medium text-bg' : 'text-dim'
            }`}
          >
            {METHOD_LABEL[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
