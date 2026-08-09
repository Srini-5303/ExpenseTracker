/**
 * Deleting gets an undo affordance, never a confirm dialog. No alert()/confirm()
 * anywhere in this app.
 */
export default function UndoToast({
  message,
  onUndo,
}: {
  message: string;
  onUndo: () => void;
}) {
  // TODO: auto-dismiss after ~5s; restoreTransaction() on undo.
  return (
    <div className="safe-bottom absolute inset-x-4 bottom-20 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
      <span className="text-sm">{message}</span>
      <button className="text-sm font-medium text-ink underline underline-offset-4" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
