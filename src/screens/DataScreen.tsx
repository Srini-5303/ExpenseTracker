/**
 * Export, import, and the credit limit.
 *
 * Local-only storage is one cleared cache away from gone, and Safari and the
 * installed app are separate IndexedDB origins — data entered while testing in
 * Safari will not appear once installed, which looks exactly like data loss.
 * Build and verify this before any real data entry.
 */
export default function DataScreen() {
  // TODO: export button (backup.exportAll + downloadBackup), file input with a
  // merge-or-replace choice, stale-export reminder (backup.exportIsStale),
  // credit limit field (settings.creditLimitCents).
  return <div className="scroll-contain safe-top flex-1 px-5 pt-6" />;
}
