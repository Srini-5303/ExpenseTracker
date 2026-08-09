import { useBalances } from '@/hooks/useDerived';
import BalanceHeader from '@/components/BalanceHeader';
import SpendSummary from '@/components/SpendSummary';
import SubscriptionNudge from '@/components/SubscriptionNudge';
import TransactionList from '@/components/TransactionList';
import AddButton from '@/components/AddButton';

export default function Home() {
  const b = useBalances();

  return (
    <>
      <div className="scroll-contain safe-top flex-1 px-5">
        <BalanceHeader
          cashOnHand={b.cashOnHand}
          cardBalance={b.cardBalance}
          availableCredit={b.availableCredit}
        />
        <SpendSummary today={b.spentToday} week={b.spentThisWeek} month={b.spentThisMonth} />
        {b.showSubscriptionNudge && <SubscriptionNudge />}
        <TransactionList />
      </div>
      {/* Lower third: this screen is tall and the top is unreachable one-handed. */}
      <AddButton />
    </>
  );
}
