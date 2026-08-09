import { db, SETTINGS_ID } from '@/lib/db';
import { today } from '@/lib/dates';
import type { Category, PayMethod, Settings, Transaction, TxType } from '@/types';

/**
 * Local-only storage is one cleared cache away from gone, and Safari and the
 * installed home-screen app are separate IndexedDB origins — data entered while
 * testing in Safari will not appear once installed, which looks exactly like
 * data loss. This file is the only bridge, so it ships before real data entry.
 */

export const EXPORT_VERSION = 1;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export interface BackupFile {
  version: number;
  exportedAt: number;
  transactions: Transaction[];
  settings: Settings | undefined;
}

export async function exportAll(): Promise<BackupFile> {
  const [transactions, settings] = await Promise.all([
    db.transactions.orderBy('date').toArray(),
    db.settings.get(SETTINGS_ID),
  ]);
  const exportedAt = Date.now();
  await db.settings.put({ ...settings, id: SETTINGS_ID, lastExportAt: exportedAt });
  return { version: EXPORT_VERSION, exportedAt, transactions, settings };
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `expenses-${today()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type ImportMode = 'merge' | 'replace';

/**
 * merge   — upsert by id, keeping anything the file does not mention.
 * replace — clear both tables first.
 *
 * Both run in one transaction so a failure part way through cannot leave the
 * database half-wiped.
 */
export async function importAll(file: BackupFile, mode: ImportMode): Promise<number> {
  await db.transaction('rw', db.transactions, db.settings, async () => {
    if (mode === 'replace') {
      await db.transactions.clear();
      await db.settings.clear();
    }
    await db.transactions.bulkPut(file.transactions);
    if (file.settings) await db.settings.put({ ...file.settings, id: SETTINGS_ID });
  });
  return file.transactions.length;
}

const TX_TYPES: readonly TxType[] = ['expense', 'income', 'reimbursement', 'card_payment'];
const METHODS: readonly PayMethod[] = ['credit', 'debit', 'cash'];
const CATEGORIES: readonly Category[] = [
  'groceries',
  'restaurant',
  'cab',
  'utilities',
  'rent',
  'subscriptions',
  'shopping',
  'other',
];

/**
 * Validates before anything touches the database. A `replace` import of a bad
 * file would otherwise destroy good data, so every row is checked first and the
 * message is written to be shown directly to the user.
 */
export function parseBackup(json: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (typeof raw !== 'object' || raw === null) throw new Error('That file is not a backup.');
  const data = raw as Record<string, unknown>;

  if (data['version'] !== EXPORT_VERSION) {
    throw new Error(`Backup version ${String(data['version'])} cannot be read by this version.`);
  }
  if (!Array.isArray(data['transactions'])) {
    throw new Error('That backup has no transactions in it.');
  }

  const transactions = data['transactions'].map(readTransaction);
  return {
    version: EXPORT_VERSION,
    exportedAt: typeof data['exportedAt'] === 'number' ? data['exportedAt'] : Date.now(),
    transactions,
    settings: readSettings(data['settings']),
  };
}

function readTransaction(row: unknown, index: number): Transaction {
  const fail = (why: string): never => {
    throw new Error(`Transaction ${index + 1} ${why}.`);
  };
  if (typeof row !== 'object' || row === null) return fail('is not a record');
  const r = row as Record<string, unknown>;

  const id = r['id'];
  const date = r['date'];
  const type = r['type'];
  const amountCents = r['amountCents'];
  const ownShareCents = r['ownShareCents'];

  if (typeof id !== 'string' || id === '') return fail('has no id');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('has a bad date');
  if (!TX_TYPES.includes(type as TxType)) return fail(`has an unknown type "${String(type)}"`);
  if (!Number.isInteger(amountCents) || (amountCents as number) < 0) return fail('has a bad amount');
  if (!Number.isInteger(ownShareCents) || (ownShareCents as number) < 0) {
    return fail('has a bad own share');
  }

  const tx: Transaction = {
    id,
    date,
    type: type as TxType,
    amountCents: amountCents as number,
    ownShareCents: ownShareCents as number,
    createdAt: typeof r['createdAt'] === 'number' ? r['createdAt'] : Date.now(),
  };
  if (CATEGORIES.includes(r['category'] as Category)) tx.category = r['category'] as Category;
  if (METHODS.includes(r['method'] as PayMethod)) tx.method = r['method'] as PayMethod;
  if (typeof r['note'] === 'string' && r['note'] !== '') tx.note = r['note'];
  return tx;
}

function readSettings(raw: unknown): Settings | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const settings: Settings = { id: SETTINGS_ID };
  if (Number.isInteger(r['creditLimitCents'])) {
    settings.creditLimitCents = r['creditLimitCents'] as number;
  }
  if (typeof r['lastExportAt'] === 'number') settings.lastExportAt = r['lastExportAt'];
  return settings;
}

/** Drives the "you haven't exported in a while" reminder. */
export function exportIsStale(lastExportAt: number | undefined): boolean {
  return lastExportAt === undefined || Date.now() - lastExportAt > MONTH_MS;
}
