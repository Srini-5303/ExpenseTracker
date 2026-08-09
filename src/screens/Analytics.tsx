import { useState } from 'react';
import { currentMonthKey, formatMonth } from '@/lib/dates';
import CategoryDonut from '@/features/analytics/CategoryDonut';
import SpendOverTime from '@/features/analytics/SpendOverTime';
import MonthComparison from '@/features/analytics/MonthComparison';
import MethodSplitBar from '@/features/analytics/MethodSplitBar';

/**
 * Every chart on this screen uses ownShareCents and excludes income,
 * reimbursements, and card payments. There are no exceptions.
 */
export default function Analytics() {
  const [month, setMonth] = useState(currentMonthKey());

  return (
    <div className="scroll-contain safe-top flex-1 px-5 pt-6">
      {/* TODO: month stepper */}
      <h1 className="text-sm text-dim" onClick={() => setMonth(month)}>
        {formatMonth(month)}
      </h1>
      <CategoryDonut month={month} />
      <SpendOverTime month={month} />
      <MonthComparison month={month} />
      <MethodSplitBar month={month} />
    </div>
  );
}
