/**
 * Spending over time: a bar chart by day within a month, or by month across a year.
 * Zero-fill empty days via dates.daysInMonth so gaps read as zero, not as missing.
 */
export default function SpendOverTime({ month }: { month: string }) {
  // TODO: derive.dailyTotals -> Recharts BarChart.
  void month;
  return <section className="mt-6" />;
}
