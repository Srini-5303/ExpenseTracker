import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { currentMonthKey, formatMonth, shiftMonth } from '@/lib/dates';
import CategoryDonut from '@/features/analytics/CategoryDonut';
import SpendOverTime from '@/features/analytics/SpendOverTime';
import MonthComparison from '@/features/analytics/MonthComparison';
import MethodSplitBar from '@/features/analytics/MethodSplitBar';
import TripTotals from '@/features/analytics/TripTotals';

/**
 * Every figure on this screen uses ownShareCents, and every one excludes income,
 * reimbursements, and card payments. That exclusion lives in derive.expensesIn,
 * which all four charts read through, so no screen can drift from the rule.
 */
export default function Analytics() {
  const txs = useTransactions();
  const [month, setMonth] = useState(currentMonthKey());
  const atCurrentMonth = month === currentMonthKey();

  return (
    <div className="scroll-contain safe-top flex-1 px-6 pb-24">
      <header className="flex items-center justify-between pt-8">
        <button
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="Previous month"
          className="size-9 rounded-full text-dim active:bg-surface"
        >
          ‹
        </button>
        <h1 className="text-base">{formatMonth(month)}</h1>
        <button
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={atCurrentMonth}
          aria-label="Next month"
          className="size-9 rounded-full text-dim active:bg-surface disabled:opacity-25"
        >
          ›
        </button>
      </header>

      <CategoryDonut txs={txs} month={month} />
      <SpendOverTime txs={txs} month={month} />
      <MonthComparison txs={txs} month={month} />
      <MethodSplitBar txs={txs} month={month} />
      <TripTotals txs={txs} />
    </div>
  );
}
