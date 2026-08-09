export type SplitMode = 'none' | 'even' | 'exact';

/**
 * Defaults to "just me". Splitting captures a headcount or an exact own share —
 * no names, no Person table, no debt.
 *
 * Typing an exact own share is the escape hatch for uneven splits, and when it is
 * used the headcount control is HIDDEN rather than left showing a stale number.
 */
export default function SplitControl({
  mode,
  headcount,
  exactText,
  onMode,
  onHeadcount,
  onExactText,
}: {
  mode: SplitMode;
  headcount: number;
  exactText: string;
  onMode: (mode: SplitMode) => void;
  onHeadcount: (headcount: number) => void;
  onExactText: (value: string) => void;
}) {
  const splitting = mode !== 'none';

  return (
    <div className="px-5">
      <span className="eyebrow">Split</span>

      <div className="mt-2 flex gap-1 rounded-full bg-surface p-1">
        {(
          [
            ['none', 'Just me'],
            ['even', 'Split'],
          ] as const
        ).map(([m, label]) => {
          const on = m === 'none' ? !splitting : splitting;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onMode(m)}
              aria-pressed={on}
              className={`flex-1 rounded-full py-2.5 text-sm active:scale-[0.98] ${
                on ? 'bg-ink font-medium text-bg' : 'text-dim'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {mode === 'even' && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-dim">People, including you</span>
          <div className="flex items-center gap-1 rounded-full bg-surface p-1">
            <Step label="−" onClick={() => onHeadcount(Math.max(2, headcount - 1))} />
            <span className="num w-8 text-center text-lg">{headcount}</span>
            <Step label="+" onClick={() => onHeadcount(Math.min(20, headcount + 1))} />
          </div>
        </div>
      )}

      {mode === 'exact' && (
        <label className="mt-4 block">
          <span className="text-sm text-dim">Your share</span>
          <input
            inputMode="decimal"
            value={exactText}
            onChange={(e) => onExactText(e.target.value)}
            placeholder="0.00"
            className="num mt-1 w-full rounded-md bg-surface px-4 py-3 text-xl outline-none placeholder:text-dim/40 focus:ring-1 focus:ring-line"
          />
        </label>
      )}

      {splitting && (
        <button
          type="button"
          onClick={() => onMode(mode === 'exact' ? 'even' : 'exact')}
          className="mt-3 text-sm text-dim underline underline-offset-4"
        >
          {mode === 'exact' ? 'Split evenly instead' : 'Enter an exact share instead'}
        </button>
      )}
    </div>
  );
}

function Step({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-9 rounded-full text-lg text-ink active:bg-raised"
    >
      {label}
    </button>
  );
}
