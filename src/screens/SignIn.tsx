import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';

/**
 * Every account is a separate ledger. Firestore rules refuse any read or write
 * outside the signed-in account's own documents, so two people using this app
 * never see each other's spending.
 */
export default function SignIn() {
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const go = creating ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await go(auth, email.trim(), password);
    } catch (caught) {
      setError(readable(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scroll-contain safe-top safe-bottom flex flex-1 flex-col justify-center px-6">
      <h1 className="text-2xl">Expenses</h1>
      <p className="mt-1 text-sm text-dim">
        {creating ? 'Your ledger, private to this account.' : 'Sign in to reach your ledger.'}
      </p>

      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-3">
        <label className="block">
          <span className="eyebrow">Email</span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md bg-surface px-4 py-3 outline-none focus:ring-1 focus:ring-line"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Password</span>
          <input
            type="password"
            autoComplete={creating ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-md bg-surface px-4 py-3 outline-none focus:ring-1 focus:ring-line"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-md bg-raised px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink py-3.5 font-medium text-bg active:scale-[0.98] disabled:opacity-50"
        >
          {creating ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button
        onClick={() => {
          setCreating(!creating);
          setError(null);
        }}
        className="mt-6 text-sm text-dim underline underline-offset-4"
      >
        {creating ? 'I already have an account' : 'Create an account'}
      </button>
    </div>
  );
}

/** Firebase error codes are not sentences. These are. */
function readable(caught: unknown): string {
  if (!(caught instanceof FirebaseError)) return 'Something went wrong. Try again.';
  switch (caught.code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password do not match an account.';
    case 'auth/email-already-in-use':
      return 'An account already exists for that email. Sign in instead.';
    case 'auth/weak-password':
      return 'Passwords need at least six characters.';
    case 'auth/network-request-failed':
      return 'No connection. Signing in for the first time needs one.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    default:
      return 'Something went wrong. Try again.';
  }
}
