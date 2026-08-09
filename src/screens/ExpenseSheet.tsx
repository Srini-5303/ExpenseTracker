import AmountInput from '@/components/AmountInput';
import CategoryChips from '@/components/CategoryChips';
import MethodToggle from '@/components/MethodToggle';
import SplitControl from '@/components/SplitControl';

/**
 * The primary flow. Under fifteen seconds, in this order:
 * amount → category → credit/debit → split → note → date.
 *
 * Also the edit surface: editing shows both amounts with the same controls, so a
 * split entered wrong is corrected without delete-and-re-add.
 */
export default function ExpenseSheet({ id }: { id?: string }) {
  // TODO: local form state; on save compute ownShareCents via money.splitEven and
  // store it. Never recompute on read. Defaults: method = lastMethod(), date = today().
  void id;

  return (
    <form className="safe-bottom flex flex-col gap-6 p-5">
      <AmountInput />
      <CategoryChips />
      <MethodToggle />
      <SplitControl />
      {/* TODO: note (optional) and date (defaults to today) */}
    </form>
  );
}
