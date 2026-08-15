import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import * as derive from '@/lib/derive';
import { currentMonthKey, monthStart, today, weekStart } from '@/lib/dates';

/** Everything the home screen shows, derived in one place. */
export function useBalances() {
  const txs = useTransactions();
  const settings = useSettings();

  return useMemo(() => {
    const now = today();
    return {
      hasTransactions: txs.length > 0,
      cashOnHand: derive.cashOnHand(txs),
      cardBalance: derive.cardBalance(txs),
      savingsBalance: derive.savingsBalance(txs),
      availableCredit: derive.availableCredit(txs, settings?.creditLimitCents),
      spentToday: derive.spend(txs, now, now),
      spentThisWeek: derive.spend(txs, weekStart(now), now), // week runs Mon–Sun
      spentThisMonth: derive.spend(txs, monthStart(now), now),
      showSubscriptionNudge: derive.needsSubscriptionNudge(txs, currentMonthKey()),
    };
  }, [txs, settings]);
}
