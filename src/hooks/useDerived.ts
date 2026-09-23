import { useMemo } from 'react';
import type { CardId } from '@/types';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import * as derive from '@/lib/derive';
import { CARD_IDS } from '@/lib/categories';
import { monthStart, today, weekStart } from '@/lib/dates';

/** One card's two figures. `available` is undefined until that card has a limit. */
export interface CardReadout {
  card: CardId;
  balance: number;
  available: number | undefined;
}

/** Everything the home screen shows, derived in one place. */
export function useBalances() {
  const txs = useTransactions();
  const settings = useSettings();

  return useMemo(() => {
    const now = today();
    return {
      hasTransactions: txs.length > 0,
      cashOnHand: derive.cashOnHand(txs),
      savingsBalance: derive.savingsBalance(txs),
      cards: CARD_IDS.map<CardReadout>((card) => ({
        card,
        balance: derive.cardBalance(txs, card),
        available: derive.availableCredit(txs, card, settings?.cardLimitsCents?.[card]),
      })),
      spentToday: derive.spend(txs, now, now),
      spentThisWeek: derive.spend(txs, weekStart(now), now), // week runs Mon–Sun
      spentThisMonth: derive.spend(txs, monthStart(now), now),
      showSubscriptionNudge: derive.needsSubscriptionNudge(txs, now),
    };
  }, [txs, settings]);
}
