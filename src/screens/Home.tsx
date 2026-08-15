import { useState } from 'react';
import type { Category, Transaction, TxType } from '@/types';
import { useBalances } from '@/hooks/useDerived';
import { deleteTransaction, restoreTransaction } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { useDueSubscriptions } from '@/hooks/useSubscriptions';
import { exportIsStale } from '@/lib/backup';
import BalanceHeader from '@/components/BalanceHeader';
import SpendSummary from '@/components/SpendSummary';
import SubscriptionNudge from '@/components/SubscriptionNudge';
import SubscriptionPrompt from '@/components/SubscriptionPrompt';
import TransactionList from '@/components/TransactionList';
import AddButton from '@/components/AddButton';
import UndoToast from '@/components/UndoToast';
import ExpenseSheet from '@/screens/ExpenseSheet';
import OtherEntrySheet from '@/screens/OtherEntrySheet';

type OtherType = Exclude<TxType, 'expense'>;

type SheetState =
  | { kind: 'expense'; existing?: Transaction; initialCategory?: Category }
  | { kind: 'other'; type: OtherType; existing?: Transaction }
  | null;

export default function Home({ onGoToData }: { onGoToData: () => void }) {
  const b = useBalances();
  const settings = useSettings();
  const due = useDueSubscriptions();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [deleted, setDeleted] = useState<Transaction | null>(null);

  async function remove(tx: Transaction) {
    setSheet(null);
    setDeleted(await deleteTransaction(tx));
  }

  function select(tx: Transaction) {
    setSheet(
      tx.type === 'expense' ? { kind: 'expense', existing: tx } : { kind: 'other', type: tx.type, existing: tx },
    );
  }

  return (
    <>
      <div className="scroll-contain safe-top flex-1 px-6 pb-44">
        <BalanceHeader
          cashOnHand={b.cashOnHand}
          cardBalance={b.cardBalance}
          availableCredit={b.availableCredit}
          savingsBalance={b.savingsBalance}
        />
        <SpendSummary today={b.spentToday} week={b.spentThisWeek} month={b.spentThisMonth} />
        {/* Due reminders come first, and while any is pending the generic nudge
            stays quiet — answering the prompt is what logs the subscription. */}
        {due.map((sub) => (
          <SubscriptionPrompt key={sub.id} sub={sub} />
        ))}
        {due.length === 0 && b.hasTransactions && b.showSubscriptionNudge && (
          <SubscriptionNudge
            onLog={() => setSheet({ kind: 'expense', initialCategory: 'subscriptions' })}
          />
        )}
        {/* Local-only data is one cleared cache away from gone, so the reminder
            lives on the screen the user actually opens. */}
        {b.hasTransactions && exportIsStale(settings?.lastExportAt) && (
          <button
            onClick={onGoToData}
            className="mt-3 flex w-full items-center gap-3 rounded-md border border-line px-4 py-3 text-left active:bg-surface"
          >
            <span className="flex-1 text-sm text-dim">
              {settings?.lastExportAt ? 'Last export was over a month ago.' : 'Never exported.'}
            </span>
            <span className="text-sm">Export</span>
          </button>
        )}
        <TransactionList onSelect={select} />
      </div>

      {deleted && (
        <UndoToast
          message="Transaction deleted"
          onUndo={() => {
            void restoreTransaction(deleted);
            setDeleted(null);
          }}
          onDismiss={() => setDeleted(null)}
        />
      )}

      <AddButton
        onAddExpense={() => setSheet({ kind: 'expense' })}
        onAddOther={(type) => setSheet({ kind: 'other', type })}
      />

      {sheet?.kind === 'expense' && (
        <ExpenseSheet
          {...(sheet.existing ? { existing: sheet.existing } : {})}
          {...(sheet.initialCategory ? { initialCategory: sheet.initialCategory } : {})}
          onDelete={remove}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'other' && (
        <OtherEntrySheet
          type={sheet.type}
          {...(sheet.existing ? { existing: sheet.existing } : {})}
          onDelete={remove}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
