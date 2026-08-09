export type SubKind = 'monthly' | 'trial';

/**
 * Replaces the split control when the category is Subscriptions, because a
 * subscription is never split — it is always just you.
 *
 * A free trial creates no recurring rule: it is logged once, at whatever it
 * actually cost, and forgotten. Only "Monthly" sets up the reminder.
 */
export default function SubscriptionOptions({
  kind,
  dayOfMonth,
  onKind,
  onDayOfMonth,
}: {
  /** Null when editing an existing rule: the choice was already made. */
  kind: SubKind | null;
  dayOfMonth: number;
  onKind: (kind: SubKind) => void;
  onDayOfMonth: (day: number) => void;
}) {
  return (
    <div className="px-5">
      <span className="eyebrow">Subscription</span>

      {kind !== null && (
      <div className="mt-2 flex gap-1 rounded-full bg-surface p-1">
        {(
          [
            ['monthly', 'Monthly'],
            ['trial', 'Free trial'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => onKind(k)}
            aria-pressed={kind === k}
            className={`flex-1 rounded-full py-2.5 text-sm active:scale-[0.98] ${
              kind === k ? 'bg-ink font-medium text-bg' : 'text-dim'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {kind !== 'trial' ? (
        <label className="mt-4 flex items-center justify-between">
          <span className="text-sm text-dim">Bills on day</span>
          <select
            value={dayOfMonth}
            onChange={(e) => onDayOfMonth(Number(e.target.value))}
            className="num rounded-md bg-surface px-3 py-2.5 outline-none focus:ring-1 focus:ring-line"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Logged once and not tracked. Add it again as monthly when it starts charging.
        </p>
      )}

      {kind !== 'trial' && (
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Each month on that day the home screen asks whether it is still active. Nothing is
          logged unless you say yes.
        </p>
      )}
    </div>
  );
}
