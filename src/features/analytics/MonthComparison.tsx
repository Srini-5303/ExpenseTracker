/**
 * This month vs. last, per category. Grouped HORIZONTAL bars — they read better on
 * a narrow phone than side-by-side pies and make the delta directly legible.
 * Show the percent change (money.percentChange) next to each category.
 */
export default function MonthComparison({ month }: { month: string }) {
  // TODO: derive.categoryTotals for month and dates.shiftMonth(month, -1).
  void month;
  return <section className="mt-6" />;
}
