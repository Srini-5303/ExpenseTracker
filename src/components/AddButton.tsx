/**
 * Primary action, lower third, safe-area padded. Paychecks, reimbursements, and
 * card payments are occasional and live behind the smaller secondary control —
 * they must not compete with expense entry for space.
 */
export default function AddButton() {
  // TODO: open ExpenseSheet; long-press or a small "…" opens the other entry types.
  return (
    <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
      <button className="pointer-events-auto rounded-full bg-ink px-8 py-4 font-medium text-bg active:scale-95">
        Add expense
      </button>
    </div>
  );
}
