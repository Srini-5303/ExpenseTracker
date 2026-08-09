import { useLiveQuery } from 'dexie-react-hooks';
import { db, SETTINGS_ID } from '@/lib/db';
import type { PayMethod, Settings } from '@/types';

export function useSettings(): Settings | undefined {
  return useLiveQuery(() => db.settings.get(SETTINGS_ID), []);
}

export async function saveSettings(changes: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await db.settings.get(SETTINGS_ID);
  await db.settings.put({ ...current, ...changes, id: SETTINGS_ID });
}

/**
 * The credit/debit toggle defaults to whatever was used last. Kept in
 * localStorage rather than Dexie: it is a UI preference, not data worth exporting.
 */
const LAST_METHOD_KEY = 'lastMethod';

export function lastMethod(): PayMethod {
  const stored = localStorage.getItem(LAST_METHOD_KEY);
  return stored === 'credit' || stored === 'debit' || stored === 'cash' ? stored : 'credit';
}

export function rememberMethod(method: PayMethod): void {
  localStorage.setItem(LAST_METHOD_KEY, method);
}
