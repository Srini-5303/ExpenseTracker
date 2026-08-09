import type { Settings, Transaction } from '@/types';

/**
 * Local-only storage is one cleared cache away from gone. Built before any real
 * data entry, not after.
 */

const EXPORT_VERSION = 1;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export interface BackupFile {
  version: number;
  exportedAt: number;
  transactions: Transaction[];
  settings: Settings | undefined;
}

export async function exportAll(): Promise<BackupFile> {
  // TODO: read both tables, stamp lastExportAt on settings, return the payload.
  throw new Error('not implemented');
}

/** Triggers a file download of the export payload. */
export function downloadBackup(_backup: BackupFile): void {
  // TODO: Blob + object URL + anchor click. Filename: expenses-YYYY-MM-DD.json.
  throw new Error('not implemented');
}

export type ImportMode = 'merge' | 'replace';

/**
 * merge  — upsert by id, keeping anything not present in the file.
 * replace — clear both tables first.
 */
export async function importAll(_file: BackupFile, _mode: ImportMode): Promise<number> {
  // TODO: validate version and shape before touching the DB. Return rows written.
  throw new Error('not implemented');
}

export function parseBackup(_json: string): BackupFile {
  // TODO: parse and validate; throw a readable message the UI can show.
  throw new Error('not implemented');
}

/** Drives the "you haven't exported in a while" reminder. */
export function exportIsStale(lastExportAt: number | undefined): boolean {
  return lastExportAt === undefined || Date.now() - lastExportAt > MONTH_MS;
}

export { EXPORT_VERSION };
