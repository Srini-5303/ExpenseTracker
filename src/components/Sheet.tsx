import type { ReactNode } from 'react';

/**
 * Bottom-anchored entry surface, shared by every add and edit flow.
 *
 * Cancel and Save sit in the sheet's own header rather than at the bottom: with
 * the numeric keypad open, iOS overlays the lower third of the screen and a
 * bottom-anchored save button disappears under it.
 *
 * Save is always tappable. A greyed-out button tells you that something is
 * wrong but never what, so the sheet takes the tap and answers with `error`
 * instead. It clears itself the moment the missing field is filled in.
 */
export default function Sheet({
  title,
  onClose,
  onSave,
  saveLabel = 'Save',
  error,
  extraAction,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  error?: string | undefined;
  extraAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="fade-in absolute inset-0 bg-field/70 backdrop-blur-sm"
      />
      <div className="sheet-in safe-bottom scroll-contain relative max-h-[94%] rounded-t-2xl border-t border-line bg-bg">
        <header className="sticky top-0 z-10 border-b border-line bg-bg">
          <div className="flex items-center justify-between px-5 py-3.5">
            <button onClick={onClose} className="text-sm text-dim active:text-ink">
              Cancel
            </button>
            <span className="eyebrow">{title}</span>
            <button onClick={onSave} className="text-sm font-medium text-ink">
              {saveLabel}
            </button>
          </div>
          {error && (
            <p role="alert" className="fade-in bg-raised px-5 py-3 text-sm">
              {error}
            </p>
          )}
        </header>
        {children}
        {extraAction && <div className="border-t border-line px-5 py-4">{extraAction}</div>}
      </div>
    </div>
  );
}
