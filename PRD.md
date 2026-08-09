# PRD — Personal Finance Tracker (PWA)

Status: draft v1 · Owner: sole user/developer · Date: 2026-08-08

---

## 1. Summary

A single-user, offline-first personal finance tracker installed to an iPhone home screen. It logs daily transactions in under fifteen seconds, keeps cash and card balances honest, and answers "where did my money go" by category and by period.

Not a product. No accounts, no login, no server, no sync.

## 2. Goals

| # | Goal | Measure of success |
|---|------|--------------------|
| G1 | Logging an expense is faster than the checkout line | Amount → save in ≤ 15s, ≤ 5 taps |
| G2 | Balances are always correct | Cash and card balances match reality without manual reconciliation |
| G3 | Split purchases never inflate personal spending | Analytics totals equal own-share sums, always |
| G4 | Data survives | Export/import works before any real data is entered |
| G5 | Feels native on iPhone | No zoom-on-focus, no clipped safe areas, installs with a real icon |

## 3. Non-goals

Do not build unless explicitly requested:

- AI categorization, receipt scanning, or any LLM call. Categories are a fixed list of eight.
- Bank/card syncing (Plaid and similar).
- Multi-user accounts, auth, or a server-side database.
- Debt tracking in any form — no owed totals, no aging, no settle-up nags.
- Budget targets, alerts, or goal tracking.
- Currency conversion. USD only.
- Recurring-transaction automation.

## 4. Users and context

One person, one iPhone 16 Pro Max, one hand, often standing. The specifier and the user are the same person, so ambiguity is resolved by asking, not guessing.

## 5. Core domain rules

These two distinctions are the source of nearly every plausible bug in this app.

### 5.1 Two amounts per transaction

A $150 Costco run split three ways is two true numbers:

- `amountCents` = 150.00 — what the bank saw, what counts against the credit limit.
- `ownShareCents` = 50.00 — the personal expense, the only figure analytics uses.

> **Rule (absolute):** Balances and card totals use `amountCents`. Every chart, category total, and period total uses `ownShareCents`.

There is no receivable and no per-person ledger. The other $100 is simply not the user's spending.

### 5.2 Credit vs. debit

- Debit and cash leave immediately → reduce **cash on hand**.
- Credit does not touch cash now → increases **card balance** by the full `amountCents`.
- A card payment moves cash → card balance. It is **not an expense** and must never appear in analytics. The underlying purchases were already recorded when they happened; counting the payment again is the single most likely bug in the model.

### 5.3 Reimbursements

Money coming back is recorded when it actually arrives, so cash on hand does not drift permanently low. A reimbursement increases cash, is not income, never appears in analytics, and does **not** reduce the card balance — the bank still wants the full charge until the bill is paid. Nothing is matched to an original transaction; nothing is ever marked settled.

## 6. Data model

```ts
type TxType = 'expense' | 'income' | 'reimbursement' | 'card_payment';
type PayMethod = 'credit' | 'debit' | 'cash';
type Category =
  | 'groceries' | 'restaurant' | 'cab' | 'utilities'
  | 'rent' | 'subscriptions' | 'shopping' | 'other';

interface Transaction {
  id: string;
  date: string;          // 'YYYY-MM-DD', local calendar date, never a UTC timestamp
  type: TxType;
  amountCents: number;   // full charge or full amount received, always positive
  ownShareCents: number; // equals amountCents when nothing was split
  category?: Category;   // required for expenses only
  method?: PayMethod;    // required for expenses and card payments
  note?: string;
  createdAt: number;
}

interface Settings {
  creditLimitCents?: number; // optional, enables the available-credit readout
}
```

Constraints:

- Money is integer cents everywhere. Never floats. Format only at the render layer.
- `ownShareCents` is computed at save time and stored. Never recomputed on read — past records stay as entered if split logic changes.
- Splitting captures a headcount or an exact own-share amount only. No names, no `Person` table.
- Even splits divide across the total headcount **including the user**; remainder cents go to the user's own share so the total reconciles.
- Income and reimbursements: no category, no method, `ownShareCents === amountCents`.
- `card_payment` has method `debit` or `cash` (where the money comes from).
- Dates are local date strings. Timezone conversion on a date-only field is a recurring off-by-one-day bug.

## 7. Derived values (single source of truth: `derive.ts`)

```
cashOnHand      = sum(income)
                - sum(expense.amountCents where method != 'credit')
                + sum(reimbursement.amountCents)
                - sum(card_payment.amountCents)

cardBalance     = sum(expense.amountCents where method == 'credit')
                - sum(card_payment.amountCents)

availableCredit = creditLimitCents - cardBalance      // only if a limit is set
netPosition     = cashOnHand - cardBalance
spend(period)   = sum(expense.ownShareCents in period)
```

`spend()` ignores payment method entirely. A meal is spending on the day it happened regardless of which card was tapped.

## 8. Features

### F1 — Daily entry (primary flow)

Ask in this order:

1. **Amount** — labeled **"Total charged"**, never "Amount", split or not. Numeric keypad opens immediately, autofocused, `inputmode="decimal"`.
2. **Category** — fixed chips, single tap, no dropdown.
3. **Credit or debit** — two-option toggle, defaults to last used.
4. **Just you, or split?** — defaults to just you. Split asks total headcount, or accepts an exact own share.
5. **Note** — optional free text.
6. **Date** — defaults to today.

Details:

- When split is on, show the computed share live beneath the amount: `Your share $50.00`. The user should never do or trust unseen arithmetic.
- Typing an exact own share is the escape hatch for uneven splits. When used, hide the headcount control rather than leave a stale number showing.
- Editing an existing transaction shows both figures with the same controls, so a bad split is corrected without delete-and-re-add.
- Chip order by tap frequency, not alphabetical: `restaurant, groceries, cab, shopping, rent, utilities, subscriptions, other`. `other` is last and visually quieter — a prominent catch-all hollows out the analytics.
- **Subscription nudge:** if the current month has no `subscriptions` entry, show a small home-screen prompt. No recurring-transaction automation.
- Paychecks, reimbursements, and card payments are separate, less prominent actions. Occasional, not daily — they must not compete with expense entry for space.

**Acceptance:** Adding a $150 groceries expense split 3 ways stores `amountCents: 15000`, `ownShareCents: 5000`; card balance rises $150; the month's groceries total rises $50.

### F2 — Home screen

- Cash on hand, large.
- Card balance, secondary, with available credit beside it when a limit is set.
- Spent today / this week / this month. **Week runs Monday–Sunday.**
- Recent transactions, tappable to edit or delete.
- Split rows show both numbers: `$150.00` with `$50.00 yours` beneath. This is the one place the two-amount model is visible, and it is what makes the analytics believable.

### F3 — Analytics

All four use `ownShareCents` and all four exclude income, reimbursements, and card payments.

| View | Chart | Question it answers |
|------|-------|---------------------|
| Category breakdown, selected month | Donut | What share went to rent vs. food |
| Spending over time | Bar, by day within a month or by month across a year | When did I spend |
| This month vs. last, per category | Grouped horizontal bars + percent change | What changed |
| Credit vs. debit for the month | Single stacked bar (not its own screen) | How much is deferred |

**Acceptance:** A month containing a $2,000 card payment and a $3,000 paycheck shows neither in any chart.

### F4 — Data safety (build early, not last)

- Export all data to a JSON file.
- Import from that file with a **merge or replace** choice.
- Visible reminder to export when the last export was over a month ago.

Rationale: local-only storage is one cleared cache away from gone. iOS evicts IndexedDB for sites unused seven days, but not once installed to the home screen — installation is load-bearing, not cosmetic. Safari and the installed app are separate IndexedDB origins, so data entered while testing in Safari will not appear in the installed app and will look exactly like data loss.

## 9. Design direction

Read `/mnt/skills/public/frontend-design/SKILL.md` before building any UI.

Quick, legible, calm — not dashboard-dense. Minimalistic and futuristic. No purple-and-black gradient, no AI slop.

- **Target viewport 440 × 956 CSS px** (iPhone 16 Pro Max logical size). Design to that and nothing else.
- Wider viewports: constrain to `max-width: 440px`, center, neutral field behind. Laptop review then shows the real phone layout; no separate desktop design is ever needed.
- Primary action is thumb-reachable — add button in the lower third. Frequently tapped things stay out of the top corners.
- Numbers are the content: real typographic presence, tabular figures so money columns align, everything else recedes.
- One category→color mapping used everywhere: chips, list rows, chart segments.
- Payment method is secondary — a small mark on a row, never the weight of the amount or category.
- No `alert()` or `confirm()`. Deleting a transaction gets an undo affordance.

## 10. iOS PWA requirements

**Layout**

- Fluid within 440 × 956; no hardcoded pixel positions.
- `100dvh`, never `100vh` — Safari's `vh` includes the collapsing toolbar.
- `viewport-fit=cover` plus `env(safe-area-inset-top/bottom)` on fixed headers, footers, and the add button. Without it the add button sits under the home indicator.

**Input and touch**

- Every input ≥ `16px` font-size, or iOS zooms on focus and never zooms back. The amount keypad bites first.
- `inputmode="decimal"` on the amount field.
- `-webkit-tap-highlight-color: transparent` plus real active states — the grey flash reads as a rendering bug.
- `overscroll-behavior-y: contain` on scroll containers.
- `user-select: none` on buttons and chips.

**Install metadata**

- `apple-touch-icon` `<link>` at 180×180 — iOS does not reliably read manifest icons, and without it the home screen shows a blurry page screenshot.
- `"display": "standalone"`, plus `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style`.
- `theme-color` matching the app background so the status bar is not a seam.

**Testing**

- Chrome DevTools has no iPhone 16 Pro Max preset — add a custom device, 440 × 956, DPR 3.
- Service workers need HTTPS; `localhost` qualifies, `192.168.x.x` does not. Use `cloudflared`/`ngrok` or a preview deploy. Do not debug a service worker that is only failing on an insecure origin.
- After install, a new deploy is fetched by the service worker but not shown until the app is fully closed and reopened.

## 11. Technical constraints

- React + TypeScript, Vite. Tailwind CSS. Recharts. Dexie (IndexedDB). `vite-plugin-pwa`.
- Static deploy (Vercel / Netlify / Cloudflare Pages), installed via Safari's "Add to Home Screen".
- **No backend, no API routes.** If a feature seems to need a server, raise it before building.
- TypeScript strict, no `any`.
- All money math in `money.ts`. Money math elsewhere is a bug.
- All date logic in `dates.ts`. **Week starts Monday** — `date-fns` and Day.js default to Sunday and would silently shift every weekly total.
- All balances and totals in `derive.ts`, so the `amountCents` vs `ownShareCents` rule lives in exactly one place.
- Components presentational; Dexie queries live in hooks.
- No state management library. React state + Dexie live queries suffice.
- No unnecessary lines of code.

## 12. Working agreements

- Ask before adding a dependency.
- Ask before changing the `Transaction` shape once real data exists; write a migration when the answer is yes.
- Prefer editing files over creating new ones.
- When a requirement is ambiguous, ask rather than assume.

## 13. Build order

1. Types, `money.ts`, `dates.ts`, `derive.ts`, Dexie schema.
2. **Export / import** (F4) — before any real data entry.
3. App shell, iOS layout and safe areas, install metadata.
4. Expense entry (F1) including split.
5. Home screen (F2).
6. Income, reimbursement, card payment entry.
7. Analytics (F3).
8. Subscription nudge, stale-export reminder, undo-delete.

## 14. Open questions

- Starting cash on hand: seed via an initial `income` entry, or a settings field? (Assumed: an income entry, so nothing new enters the model.)
- Should the credit limit be set at first run or left unset until needed? (Assumed: unset; the available-credit readout stays hidden.)
