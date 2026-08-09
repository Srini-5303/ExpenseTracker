import type { ReactNode } from 'react';

/**
 * Bottom-anchored entry surface, shared by every add and edit flow.
 *
 * Cancel and Save sit in the sheet's own header rather than at the bottom: with
 * the numeric keypad open, iOS overlays the lower third of the screen and a
 * bottom-anchored save button disappears under it.
 */
export default function Sheet({
  title,
  onClose,
  onSave,
  saveLabel = 'Save',
  canSave = true,
  extraAction,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  canSave?: boolean;
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
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-5 py-3.5">
          <button onClick={onClose} className="text-sm text-dim active:text-ink">
            Cancel
          </button>
          <span className="eyebrow">{title}</span>
          <button
            onClick={onSave}
            disabled={!canSave}
            className="text-sm font-medium text-ink disabled:text-dim/40"
          >
            {saveLabel}
          </button>
        </header>
        {children}
        {extraAction && <div className="border-t border-line px-5 py-4">{extraAction}</div>}
      </div>
    </div>
  );
}
