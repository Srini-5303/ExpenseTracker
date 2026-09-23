import { useEffect, useState } from 'react';
import { deleteField, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { subscriptionsRef, transactionsRef, userDoc, userDocRaw } from '@/lib/db';
import type { PayMethod, Subscription, Transaction } from '@/types';

/**
 * A record as it still looks on disk. 'credit' is gone from PayMethod, so the
 * field has to be widened on read — an intersection would not do it, since that
 * narrows the property back to the union that no longer has 'credit' in it.
 */
type Legacy<T> = Omit<T, 'method'> & { method?: PayMethod | 'credit' };

/**
 * One credit card became two. Everything logged before that stored
 * `method: 'credit'` with no record of which card it was, and a card payment
 * stored only where the money came from, never which balance it paid down — so
 * every legacy row is backfilled to Chase, the card that existed at the time.
 * The single `creditLimitCents` moves to Chase's limit for the same reason.
 *
 * Firestore is the only copy and the Spark plan has no point-in-time recovery,
 * so this is written to be safe rather than clever: it touches only the `method`
 * and `card` fields, never an amount, date, or own share, and every edit is a
 * no-op once applied. The version flag is written last, so an interrupted run
 * simply repeats on the next launch.
 */
const SCHEMA_VERSION = 2;

/** The card that existed before there were two, so it is what legacy rows meant. */
const LEGACY_CARD = 'chase';

async function migrate(uid: string): Promise<void> {
  const settings = (await getDoc(userDoc(uid))).data();
  if (settings?.schemaVersion === SCHEMA_VERSION) return;

  const [txs, subs] = await Promise.all([
    getDocs(transactionsRef(uid)),
    getDocs(subscriptionsRef(uid)),
  ]);

  const writes: Promise<void>[] = [];

  for (const d of txs.docs) {
    const t: Legacy<Transaction> = d.data();
    const changes = {
      ...(t.method === 'credit' ? { method: LEGACY_CARD } : {}),
      ...(t.type === 'card_payment' && t.card === undefined ? { card: LEGACY_CARD } : {}),
    };
    if (Object.keys(changes).length > 0) writes.push(updateDoc(d.ref, changes));
  }

  // Recurring reminders carry a method too, and would otherwise log next month's
  // charge against a card that no longer exists.
  for (const d of subs.docs) {
    const s: Legacy<Subscription> = d.data();
    if (s.method === 'credit') writes.push(updateDoc(d.ref, { method: LEGACY_CARD }));
  }

  await Promise.all(writes);

  await setDoc(
    userDocRaw(uid),
    {
      schemaVersion: SCHEMA_VERSION,
      ...(settings?.creditLimitCents === undefined
        ? {}
        : {
            cardLimitsCents: { [LEGACY_CARD]: settings.creditLimitCents },
            creditLimitCents: deleteField(),
          }),
    },
    { merge: true },
  );
}

/**
 * False until the ledger is known to be on the current shape. The app waits on
 * it, because a screen rendered mid-migration would show legacy rows with a
 * payment method the UI has no label for.
 *
 * A failure resolves true anyway: being offline with a cold cache must never
 * lock someone out of their own ledger, and the next launch tries again.
 */
export function useMigration(uid: string | null): boolean {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setDone(false);
    void migrate(uid)
      .catch(() => undefined)
      .then(() => setDone(true));
  }, [uid]);

  return done;
}
