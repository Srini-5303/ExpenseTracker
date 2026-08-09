import { CATEGORY_COLOR } from '@/lib/categories';

/**
 * Subscriptions are the category most likely to go unlogged, because there is no
 * checkout moment to remind anyone. Shown only while the current month has no
 * subscription entry. Deliberately not recurring-transaction automation.
 */
export default function SubscriptionNudge({ onLog }: { onLog: () => void }) {
  return (
    <button
      onClick={onLog}
      className="mt-5 flex w-full items-center gap-3 rounded-md border border-line px-4 py-3 text-left active:bg-surface"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_COLOR.subscriptions }}
      />
      <span className="flex-1 text-sm text-dim">No subscriptions logged this month.</span>
      <span className="text-sm">Log one</span>
    </button>
  );
}
