/** Two options, defaults to whichever was used last (see hooks/useSettings). */
export default function MethodToggle() {
  // TODO: controlled value; rememberMethod() on save. Cash is available on the
  // card-payment form, which needs debit or cash.
  return (
    <div className="flex gap-2">
      {(['credit', 'debit'] as const).map((m) => (
        <button
          key={m}
          type="button"
          className="flex-1 rounded-xl border border-line py-3 capitalize active:scale-95"
        >
          {m}
        </button>
      ))}
    </div>
  );
}
