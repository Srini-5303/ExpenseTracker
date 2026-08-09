/**
 * Subscriptions are the category most likely to go unlogged — there is no checkout
 * moment to remind anyone. Shown only when the current month has no subscription
 * entry yet. Deliberately not recurring-transaction automation.
 */
export default function SubscriptionNudge() {
  return (
    <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-dim">
      No subscriptions logged this month.
    </p>
  );
}
