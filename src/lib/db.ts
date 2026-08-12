import { collection, doc } from 'firebase/firestore';
import type { CollectionReference, DocumentReference } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import type { Settings, Subscription, Transaction } from '@/types';

/**
 * Every ledger lives under users/{uid}, and firestore.rules refuses any read or
 * write where the uid does not match the signed-in account. Accounts never see
 * each other's data — that isolation is enforced on the server, not here.
 *
 * Firestore's persistent cache means this is still offline-first: reads come
 * from disk and writes queue until there is signal.
 */

export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in.');
  return uid;
}

export const userDoc = (uid: string): DocumentReference<Settings> =>
  doc(firestore, 'users', uid) as DocumentReference<Settings>;

/** Untyped view of the same document, for writes that use deleteField(). */
export const userDocRaw = (uid: string) => doc(firestore, 'users', uid);

export const transactionsRef = (uid: string): CollectionReference<Transaction> =>
  collection(firestore, 'users', uid, 'transactions') as CollectionReference<Transaction>;

export const subscriptionsRef = (uid: string): CollectionReference<Subscription> =>
  collection(firestore, 'users', uid, 'subscriptions') as CollectionReference<Subscription>;

export function newId(): string {
  return crypto.randomUUID();
}
