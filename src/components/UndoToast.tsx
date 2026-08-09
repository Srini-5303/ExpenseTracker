import { useEffect } from 'react';

/**
 * Deleting gets an undo affordance, never a confirmation dialog. There is no
 * alert() or confirm() anywhere in this app.
 */
export default function UndoToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fade-in pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+9.5rem)] z-10 px-6">
      <div className="pointer-events-auto flex items-center justify-between rounded-full border border-line bg-surface py-3 pr-3 pl-5">
        <span className="text-sm text-dim">{message}</span>
        <button
          onClick={onUndo}
          className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-bg active:scale-95"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
