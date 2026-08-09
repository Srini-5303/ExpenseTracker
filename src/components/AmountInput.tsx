/**
 * Labeled "Total charged", never "Amount", split or not. Getting this wrong
 * corrupts the card balance silently and nothing downstream would surface it.
 *
 * inputmode="decimal" opens the numeric keypad without a custom one.
 * Font size must stay >= 16px or iOS zooms on focus and never zooms back.
 */
export default function AmountInput() {
  // TODO: controlled value parsed through money.parseAmount; autofocus on mount.
  return (
    <label className="block">
      <span className="text-sm text-dim">Total charged</span>
      <input
        inputMode="decimal"
        autoFocus
        placeholder="0.00"
        className="w-full bg-transparent text-5xl outline-none"
      />
    </label>
  );
}
