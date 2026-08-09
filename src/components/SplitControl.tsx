/**
 * Defaults to "just me". Splitting captures a headcount INCLUDING the user, or an
 * exact own share. No names, no Person table.
 *
 * The computed share shows live beneath the amount as the headcount changes
 * ("Your share $50.00") — the user should never have to trust unseen arithmetic
 * or do it themselves.
 *
 * Typing an exact own share is the escape hatch for uneven splits. When it is
 * used, HIDE the headcount control rather than leave a stale number showing.
 */
export default function SplitControl() {
  // TODO: mode 'none' | 'headcount' | 'exact'; compute via money.splitEven.
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-dim">Split this?</span>
      <button type="button" className="rounded-xl border border-line px-4 py-2 text-sm">
        Just me
      </button>
    </div>
  );
}
