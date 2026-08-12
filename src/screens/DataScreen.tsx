import { useRef, useState } from 'react';
import type { Subscription } from '@/types';
import { useSettings, setCreditLimit } from '@/hooks/useSettings';
import { signOutUser, useAuth } from '@/hooks/useAuth';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import SubscriptionSheet from '@/screens/SubscriptionSheet';
import { CATEGORY_COLOR } from '@/lib/categories';
import { downloadBackup, exportAll, exportIsStale, importAll, parseBackup } from '@/lib/backup';
import type { BackupFile } from '@/lib/backup';
import { formatCents, parseAmount } from '@/lib/money';

/**
 * Export, import, and the credit limit.
 *
 * Import is destructive in `replace` mode, so the mode choice is presented in
 * the page itself with the row count visible. That choice IS the confirmation —
 * there is no confirm() anywhere in this app.
 */
export default function DataScreen() {
  const settings = useSettings();
  const { user } = useAuth();
  const subs = useSubscriptions();
  const [editing, setEditing] = useState<Subscription | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [limitDraft, setLimitDraft] = useState<string | null>(null);

  const stale = exportIsStale(settings?.lastExportAt);

  async function onExport() {
    downloadBackup(await exportAll());
    setMessage('Exported.');
  }

  async function onFile(file: File) {
    setMessage(null);
    try {
      setPending(parseBackup(await file.text()));
    } catch (error) {
      setPending(null);
      setMessage(error instanceof Error ? error.message : 'That file could not be read.');
    }
  }

  async function onImport(mode: 'merge' | 'replace') {
    if (!pending) return;
    const count = await importAll(pending, mode);
    setPending(null);
    setMessage(`${mode === 'replace' ? 'Replaced with' : 'Merged'} ${count} transactions.`);
  }

  function commitLimit() {
    if (limitDraft === null) return;
    const cents = limitDraft.trim() === '' ? null : parseAmount(limitDraft);
    if (limitDraft.trim() !== '' && cents === null) return setLimitDraft(null);
    void setCreditLimit(cents);
    setLimitDraft(null);
  }

  return (
    <div className="scroll-contain safe-top flex-1 px-6 pb-8">
      <h1 className="eyebrow pt-8">Data</h1>

      {stale && (
        <p className="mt-4 border-l-2 border-ink pl-3 text-sm leading-relaxed text-dim">
          {settings?.lastExportAt
            ? 'Your last export was over a month ago.'
            : 'You have never exported. Clearing this browser would take everything with it.'}
        </p>
      )}

      <section className="mt-6 border-t border-line pt-5">
        <h2 className="eyebrow">Account</h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-sm text-dim">{user?.email}</span>
          <button
            onClick={() => void signOutUser()}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-sm active:scale-[0.98]"
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="mt-8 border-t border-line pt-5">
        <h2 className="eyebrow">Export</h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          Writes every transaction and setting to a JSON file. Do this before reinstalling or
          clearing site data.
        </p>
        <button
          onClick={onExport}
          className="mt-4 w-full rounded-full bg-ink py-3.5 font-medium text-bg active:scale-[0.98]"
        >
          Export to file
        </button>
      </section>

      <section className="mt-8 border-t border-line pt-5">
        <h2 className="eyebrow">Import</h2>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          className="mt-3 w-full rounded-full border border-line py-3.5 active:scale-[0.98]"
        >
          Choose a backup file
        </button>

        {pending && (
          <div className="mt-4 rounded-md bg-surface p-4">
            <p className="text-sm text-dim">
              {pending.transactions.length} transactions in this file.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => void onImport('merge')}
                className="flex-1 rounded-full bg-ink py-3 text-sm font-medium text-bg active:scale-[0.98]"
              >
                Merge
              </button>
              <button
                onClick={() => void onImport('replace')}
                className="flex-1 rounded-full border border-line py-3 text-sm active:scale-[0.98]"
              >
                Replace everything
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Merge keeps what is already here and updates anything the file also has. Replace
              deletes everything first.
            </p>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-dim">{message}</p>}
      </section>

      {subs.length > 0 && (
        <section className="mt-8 border-t border-line pt-5">
          <h2 className="eyebrow">Recurring subscriptions</h2>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            Each one asks on its billing day before anything is logged.
          </p>
          <ul className="mt-2 divide-y divide-line">
            {subs.map((sub) => (
              <li key={sub.id}>
                <button
                  onClick={() => setEditing(sub)}
                  className="flex w-full items-center gap-3 py-3 text-left active:bg-surface"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR.subscriptions }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{sub.name}</span>
                    <span className="block text-xs text-dim">
                      Day {sub.dayOfMonth} · {sub.method}
                    </span>
                  </span>
                  <span className="num shrink-0">{formatCents(sub.amountCents)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && <SubscriptionSheet sub={editing} onClose={() => setEditing(null)} />}

      <section className="mt-8 border-t border-line pt-5">
        <h2 className="eyebrow">Credit limit</h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          Optional. Setting it shows how much credit is left beside the card balance.
        </p>
        <input
          inputMode="decimal"
          placeholder="Not set"
          value={
            limitDraft ??
            (settings?.creditLimitCents === undefined
              ? ''
              : formatCents(settings.creditLimitCents))
          }
          onChange={(e) => setLimitDraft(e.target.value)}
          onBlur={commitLimit}
          className="num mt-4 w-full rounded-md bg-surface px-4 py-3 text-xl outline-none focus:ring-1 focus:ring-line"
        />
      </section>
    </div>
  );
}
