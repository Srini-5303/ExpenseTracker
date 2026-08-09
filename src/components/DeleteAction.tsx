/** Delete lives at the bottom of an edit sheet, and undo is the safety net. */
export default function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      onClick={onDelete}
      className="w-full rounded-full border border-line py-3 text-sm text-dim active:scale-[0.98] active:text-ink"
    >
      Delete transaction
    </button>
  );
}
