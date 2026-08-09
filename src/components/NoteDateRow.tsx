/**
 * Note and date, shared by every entry sheet. Date defaults to today.
 *
 * Subscriptions relabel the note as the name, because for them it is not an
 * aside — it is what the monthly reminder calls itself.
 */
export default function NoteDateRow({
  note,
  date,
  onNote,
  onDate,
  label = 'Note',
  placeholder = 'Optional',
  hint,
}: {
  note: string;
  date: string;
  onNote: (value: string) => void;
  onDate: (value: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5">
      <label className="flex-1">
        <span className="eyebrow">{label}</span>
        <input
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md bg-surface px-3 py-2.5 outline-none placeholder:text-dim/40 focus:ring-1 focus:ring-line"
        />
        {hint && <span className="mt-1.5 block text-xs text-dim">{hint}</span>}
      </label>
      <label>
        <span className="eyebrow">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="num mt-1 w-full rounded-md bg-surface px-3 py-2.5 outline-none focus:ring-1 focus:ring-line"
        />
      </label>
    </div>
  );
}
