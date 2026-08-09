import Dexie, { type EntityTable } from 'dexie';
import type { Settings, Transaction } from '@/types';

/**
 * All data stays on device. Safari and the installed home-screen app are separate
 * IndexedDB origins, so anything entered in Safari will not appear once installed.
 * Export/import is the only bridge — see backup.ts.
 */
class ExpenseDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('expense-tracker');
    this.version(1).stores({
      transactions: 'id, date, type, category, method, createdAt',
      settings: 'id',
    });
  }
}

export const db = new ExpenseDB();

export const SETTINGS_ID = 'settings' as const;

export function newId(): string {
  return crypto.randomUUID();
}
