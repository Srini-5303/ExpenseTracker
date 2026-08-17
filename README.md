# Expense Tracker

A personal finance tracker built as an installable PWA for iPhone. Logs daily transactions in under fifteen seconds, keeps cash and card balances honest, and answers "where did my money go" by category, month, and trip.

Each account is a private ledger. Several people can use the same deployment; nobody sees anyone else's data.

---

## Setup

You need your own Firebase project. The app will not start without one.

### 1. Install

```bash
npm install
```

### 2. Create a Firebase project

At [console.firebase.google.com](https://console.firebase.google.com):

1. **Create a project.** Analytics is not used — turn it off.
2. **Build → Authentication** → Get started → enable **Email/Password**. Leave passwordless off.
3. **Build → Firestore Database** → Create database → **production mode** → pick your nearest region. *The region is permanent.*
4. **Project settings → General → Your apps → `</>`** → register a web app → copy the `firebaseConfig` values.

The free Spark plan is enough. It has hard quota caps rather than overage billing, so it cannot produce a surprise bill.

### 3. Configure

```bash
cp .env.example .env.local
```

Fill in the six values from `firebaseConfig`. No quotes, no spaces around `=`.

These are not secrets — Firebase keys identify the project, they do not authorise anything. `.env.local` is gitignored anyway.

### 4. Publish the security rules

Copy `firestore.rules` into **Firestore Database → Rules** and publish.

**Do not skip this.** Production mode denies everything by default, so every read fails until the rules are live — and the wrong rules here are what would let one account read another's ledger.

### 5. Run

```bash
npm run dev
```

Create an account on the sign-in screen.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |

---

## Two rules the whole app rests on

Nearly every plausible bug in this codebase comes from getting one of these wrong.

### Every transaction has two amounts

A $150 dinner split three ways is two true numbers:

- `amountCents` — $150, what the bank saw and what counts against the credit limit.
- `ownShareCents` — $50, the personal expense.

> **Balances and card totals use `amountCents`. Every chart, category total, and period total uses `ownShareCents`.**

There is no receivable and no per-person ledger. The other $100 is simply not your spending.

### Transfers are not spending

Card payments and savings deposits move money that was already recorded, or that is still yours. They change balances and never appear in analytics. Counting a card payment as spending double-counts purchases logged when they happened; counting a savings deposit as spending makes a month of diligent saving read as a month of overspending.

Reimbursements work the same way: money coming back raises cash, is not income, never reaches analytics, and does **not** reduce the card balance — the bank still wants the full charge until the bill is paid.

---

## Features

- **Daily entry** — amount, category, credit/debit, split, note, date. Splitting takes a headcount or an exact own share.
- **Ten categories**, fixed. Colours are validated for colourblind separation and contrast, not chosen by eye.
- **Trips** — an orthogonal flag on any expense, so a holiday dinner is still `restaurant` and trip totals do not double-count.
- **Subscriptions** — a monthly prompt asks whether a service is still active before anything is logged. Nothing is auto-entered.
- **Savings** — deposits and withdrawals, with a running balance charted over time.
- **Analytics** — category donut, daily bars, month-over-month comparison, credit vs debit split, savings curve, trip breakdowns.

---

## Layout

```
src/
  lib/        money.ts, dates.ts, derive.ts — the rules live here, and are tested
  hooks/      Firestore subscriptions and mutations
  components/ presentational only
  screens/    Home, Analytics, Settings, and the entry sheets
  features/analytics/  the charts
firestore.rules   deploy this, or the app cannot read anything
```

Three modules own the arithmetic, and money or date logic written anywhere else is a bug:

- **`money.ts`** — parsing, arithmetic, splitting, formatting. Integer cents, never floats.
- **`dates.ts`** — period boundaries, month keys. **The week runs Monday to Sunday.**
- **`derive.ts`** — every balance and total, so the two-amount rule exists in exactly one place.

---

## Deploying

Firebase Hosting is the path of least resistance: `your-project.web.app` is already on Firebase Auth's allowlist, and one command ships the site and the rules together.

```bash
npm i -g firebase-tools
firebase login
firebase init hosting     # public dir: dist, single-page app: yes, do not overwrite index.html
npm run build && firebase deploy
```

Any static host works, but **add the domain to Firebase Auth → Settings → Authorized domains** first or sign-in fails with an unhelpful error.

HTTPS is required either way — the service worker will not register without it, and no service worker means no home-screen install.

---

## Data safety

Firestore is the only copy. There is no export, by design.

The Spark plan has no point-in-time recovery, so a mistaken delete syncs to every device in about a second and Google has no copy to restore from. The undo toast is the only safety net. Treat anything that deletes or overwrites transactions in bulk as irreversible.

---

## iPhone notes

Built for 440 × 956 CSS pixels, the logical size of an iPhone 16 Pro Max. On wider viewports the app stays 440px wide and centred, so a laptop shows the real phone layout.

- Chrome DevTools has no iPhone 16 Pro Max preset — add a custom device, 440 × 956, DPR 3.
- A LAN address like `192.168.x.x` will not register a service worker. Use a tunnel or a preview deploy to test install behaviour.
- Sign-in does not carry from Safari to the installed app; they are separate origins. Sign in again and everything syncs down.
- After install, a new deploy is fetched but not shown until the app is fully closed and reopened.
