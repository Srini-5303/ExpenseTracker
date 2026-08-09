/**
 * Category breakdown for the selected month. A donut, because the question is
 * proportional: what share of my spending is rent vs. food.
 * Segment colors come from CATEGORY_COLOR — same mapping as chips and rows.
 */
export default function CategoryDonut({ month }: { month: string }) {
  // TODO: derive.categoryTotals -> Recharts PieChart with innerRadius.
  void month;
  return <section className="mt-6" />;
}
