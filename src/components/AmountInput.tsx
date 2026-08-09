/**
 * Labeled "Total charged", never "Amount", whether or not the transaction is
 * split. Getting this wrong corrupts the card balance silently, and nothing
 * downstream would ever surface the error.
 *
 * inputmode="decimal" opens the numeric keypad without a custom one, and the
 * font size must stay >= 16px or iOS zooms the page on focus and never zooms back.
 */
export default function AmountInput({
  label = 'Total charged',
  value,
  onChange,
  hint,
  autoFocus = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block px-5 pt-6">
      <span className="eyebrow">{label}</span>
      <div className="num mt-1 flex items-baseline gap-1 text-[2.75rem] leading-none">
        <span className={value === '' ? 'text-dim/40' : 'text-dim'}>$</span>
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="num w-full bg-transparent text-[2.75rem] leading-none outline-none placeholder:text-dim/40"
        />
      </div>
      {/* The live share. The user should never have to trust that arithmetic
          happened, or do it themselves. */}
      <span className="mt-2 block h-4 text-sm text-dim">{hint}</span>
    </label>
  );
}
