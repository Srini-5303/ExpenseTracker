/** Note and date, shared by every entry sheet. Date defaults to today. */
export default function NoteDateRow({
  note,
  date,
  onNote,
  onDate,
}: {
  note: string;
  date: string;
  onNote: (value: string) => void;
  onDate: (value: string) => void;
}) {
  return (
    <div className="flex gap-3 px-5">
      <label className="flex-1">
        <span className="eyebrow">Note</span>
        <input
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Optional"
          className="mt-1 w-full rounded-md bg-surface px-3 py-2.5 outline-none placeholder:text-dim/40 focus:ring-1 focus:ring-line"
        />
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
