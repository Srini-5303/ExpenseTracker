# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

A personal finance tracker, built as an installable PWA, used on an iPhone. It records daily transactions, tracks income, tracks whether each purchase went on credit or debit, and shows spending analytics by category and by time period.

Accounts exist, but there is no sharing: each account is a private ledger, and nobody ever sees anyone else's spending. Optimize for fast daily entry and clear answers to "where did my money go."

## Non-goals

Do not build these unless explicitly asked:

- AI categorization, receipt scanning, or LLM calls of any kind. Categories are a fixed list.
- Bank or card syncing (Plaid and similar).
- **Shared or household ledgers.** Accounts exist so several people can use the app; they never see each other's data, and no feature should let them.
- Debt tracking of any form. The app never shows what roommates owe, never ages a balance, never nags about settling up.
- Budgeting targets, alerts, or goal tracking.
- Currency conversion. Everything is USD.

## Stack

- React + TypeScript, built with Vite
- Tailwind CSS for styling
- Recharts for charts
- Firebase Auth (email and password) and Cloud Firestore for storage
- `vite-plugin-pwa` for the manifest and service worker
- Deployed as a static site (Vercel, Netlify, or Cloudflare Pages), installed via Safari's "Add to Home Screen"

Still no backend of our own and no API routes: the Firebase SDK talks to Firestore straight from the browser, and `firestore.rules` is the only thing enforcing privacy. Firestore's persistent cache keeps the app working offline, so entry never waits on a network.

Every ledger lives under `users/{uid}`. Config comes from `.env.local` — see `.env.example`.

## Two concepts that matter

Most bugs in this app will come from getting these two distinctions wrong.

### 1. Every transaction has two amounts

A $150 Costco run split three ways is two different numbers, and both are true:

- **$150 hit the card.** That is what the bank sees and what counts against the credit limit.
- **$50 is the personal expense.** That is the only figure analytics ever uses.

So every transaction stores `amountCents` (the full charge) and `ownShareCents` (the user's portion). The rule is absolute and has no exceptions:

> **Balances and card totals use `amountCents`. Every chart, category total, and period total uses `ownShareCents`.**

There is no receivable, no owed total, no per-person ledger. The remaining $100 is simply not the user's spending, and the app has nothing further to say about it.

### 2. Credit vs. debit

Debit and cash leave immediately. Credit does not touch cash now, it adds to a card balance paid later. Treating them identically makes the balance wrong on both sides.

So there are two running figures:

- **Cash on hand**, reduced by debit and cash spending
- **Card balance**, increased by the full `amountCents` of credit spending

Card balance is the credit-limit number, so it must always use the full charge. A split dinner put on the card counts against the limit at its full value even though only a third of it was the user's expense.

Paying the card bill is its own transaction type. It moves money from cash to the card balance and is not an expense, so it must never appear in analytics. Double counting a card payment as spending is the most likely bug in this model, since the underlying purchases were already recorded when they happened.

## Data model

```ts
type TxType = 'expense' | 'income' | 'reimbursement' | 'card_payment';

type PayMethod = 'credit' | 'debit' | 'cash';

type Category =
  | 'groceries'
  | 'restaurant'
  | 'cab'
  | 'utilities'
  | 'rent'
  | 'subscriptions'
  | 'shopping'        // personal shopping: clothes, electronics, household goods
  | 'other';

interface Transaction {
  id: string;
  date: string;            // 'YYYY-MM-DD', local date, never a UTC timestamp
  type: TxType;
  amountCents: number;     // full charge or full amount received, always positive
  ownShareCents: number;   // equals amountCents when nothing was split
  category?: Category;     // required for expenses, absent for all other types
  method?: PayMethod;      // required for expenses and card payments
  note?: string;           // 'Costco run', 'Uber to airport'
  createdAt: number;
}

interface Settings {
  creditLimitCents?: number;  // optional, enables the available-credit readout
}
```

Notes on the model:

- **Store money as integer cents.** Never floats. Format only at the render layer.
- **Compute `ownShareCents` at save time and store it.** Do not recompute on read. If split logic changes later, past records must stay as entered.
- Splitting captures only a headcount or an exact own-share amount. No names, no `Person` table.
- Even splits divide across the total headcount including the user. Put any remainder cents on the user's own share so the total reconciles.
- Income and reimbursements have no category and no method, and their `ownShareCents` equals `amountCents`.
- `card_payment` has a method of `debit` or `cash`, since that is where the money comes from.
- Dates are local calendar date strings. Timezone conversion on a date-only field is a recurring source of off-by-one-day bugs.

### On reimbursements

Roommates paying money back is not tracked as a debt, but it does need to be recordable, otherwise cash on hand drifts permanently low: $150 goes out, $100 comes back, and the app would keep believing the user is down the full $150.

So `reimbursement` exists as a plain "money came back in" entry, logged when the money actually arrives. It increases cash, is not income, and never appears in analytics. It does **not** reduce the card balance, since the bank still wants the full $150 until the bill is paid.

This is deliberately not a settlement feature. Nothing is matched to an original transaction and nothing is ever marked as settled.

## Derived values

```
cashOnHand   = sum(income)
             - sum(expense.amountCents where method != 'credit')
             + sum(reimbursement.amountCents)
             - sum(card_payment.amountCents)

cardBalance  = sum(expense.amountCents where method == 'credit')
             - sum(card_payment.amountCents)

availableCredit = creditLimitCents - cardBalance      // only if a limit is set

netPosition  = cashOnHand - cardBalance

spend(period) = sum(expense.ownShareCents in period)
```

`spend()` ignores payment method entirely. A restaurant meal is spending on the day it happened regardless of which card was tapped.

## Features

### Daily entry

The primary flow, and it should take under fifteen seconds. Adding an expense asks, in this order:

1. Amount, meaning the full amount charged (numeric keypad opens immediately, autofocused)
2. Category (fixed chips, single tap, no dropdown)
3. Credit or debit (two-option toggle, defaults to whichever was used last)
4. Was this just for you, or split? Default to just yourself. Splitting asks how many people total, or lets an exact own-share be typed.
5. Note (optional, free text)
6. Date (defaults to today)

The amount field is labeled "Total charged," not "Amount," and it stays labeled that way whether or not the transaction is split. Getting this wrong corrupts the card balance silently, and nothing downstream would ever surface the error.

When splitting is on, show the computed own share live beneath the amount as the headcount changes, in the form `Your share $50.00`. The user should never have to trust that the arithmetic happened correctly, and they should never have to do it themselves. Typing an exact own share is the escape hatch for uneven splits, and when it is used, the headcount control is hidden rather than left showing a stale number.

Editing an existing transaction shows both figures with the same controls, so a split entered wrong can be corrected without deleting and re-adding.

Eight categories will not fit comfortably in one row of chips. Order them by how often they are actually tapped, not alphabetically: restaurant, groceries, cab, and shopping are daily or weekly, while rent, utilities, and subscriptions are monthly and belong at the end. Keep `other` last and make it visually quieter than the rest, since a prominent catch-all gets used as the path of least resistance and hollows out the analytics.

Subscriptions are the category most likely to go unlogged, because there is no checkout moment to remind anyone. Do not build recurring-transaction automation for this, but a monthly nudge on the home screen, shown only when the current month has no subscription entries yet, would close most of that gap for very little code.

Paychecks, reimbursements, and card payments are separate, less prominent actions. They are occasional, not daily, so they should not compete for space with expense entry.

### Home screen

- Cash on hand, large
- Card balance, secondary, with available credit beside it when a limit is set
- Spent today, this week, this month
- Recent transactions, tappable to edit or delete

Show split transactions in the list with both numbers, something like `$150.00` with `$50.00 yours` beneath it. This is the one place the two-amount model is visible, and seeing it in the list is what makes the analytics believable later.

### Analytics

- Category breakdown for a selected month. A pie or donut works here since the question is proportional: what share of my spending is rent vs. food.
- Spending over time. A bar chart by day within a month, or by month across a year.
- Category comparison, this month vs. last month. A grouped horizontal bar chart per category reads better on a narrow phone than side-by-side pies, and makes the delta directly legible. Show the percent change next to each category.
- Credit vs. debit split for the month. A single stacked bar is enough. This does not need its own screen.

Every one of these uses `ownShareCents`, and every one excludes income, reimbursements, and card payments.

### Data safety

Firestore is the only copy. Export and import were removed deliberately — do not reintroduce them without being asked.

Know what that means: the Spark plan has no point-in-time recovery, so a mistaken delete syncs to every device in under a second and Google has no copy to restore from. The undo toast is the only safety net there is. Treat any change that deletes or overwrites transactions in bulk as irreversible.

## Design direction

Read `/mnt/skills/public/frontend-design/SKILL.md` before building any UI.

This is a tool the user opens while standing in a checkout line, so the visual language should be quick, legible, and calm rather than dashboard-dense. A few constraints:

- **Target viewport is 440 x 956 CSS pixels**, the logical size of an iPhone 16 Pro Max. Design to that and nothing else. See the iOS section below for how this behaves on a laptop.
- Thumb-reachable primary action. This screen is tall, so the top third is genuinely hard to reach one-handed. The add button belongs in the lower third, and anything the user taps often should stay out of the top corners.
- Numbers are the content. Give balances and amounts a typeface with real presence, use tabular figures so columns of money align, and let everything else recede.
- Categories should be distinguishable at a glance by color, and that mapping must be consistent everywhere: chips, list rows, chart segments.
- Payment method is secondary information. A small mark on a transaction row is enough, it should not carry the same weight as the amount or category.
- No `alert()` or `confirm()`. Deleting a transaction gets an undo affordance rather than a confirmation dialog.
- No AI slop. That means no purple and black gradient home screen. I want a minimalistic and futuristic UI.

## iOS PWA requirements

The app is developed and reviewed on a laptop but lives on an iPhone 16 Pro Max. Everything below exists because iOS standalone mode differs from Safari in ways that are invisible until the app is on the home screen.

### Layout

- Target 440 x 956 CSS pixels. Build fluid within that, do not hardcode pixel positions.
- On viewports wider than 440px, constrain the app to `max-width: 440px`, center it, and put a neutral field behind it. Laptop review then shows the real phone layout instead of a stretched one, and no separate desktop design is ever needed.
- Use `100dvh`, never `100vh`. Safari's `vh` includes the collapsing toolbar, which leaves content cut off or floating depending on scroll position.
- Respect the safe areas. The Dynamic Island occupies the top and the home indicator the bottom, and standalone mode does not pad for either. Set `viewport-fit=cover` in the viewport meta tag and apply `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to fixed headers, footers, and the add button. A bottom-anchored button without this sits under the home indicator and is genuinely hard to press.

### Input and touch behavior

- **Every input needs `font-size: 16px` or larger.** Below that, iOS zooms the page on focus and does not zoom back out. The amount keypad is the field this will bite first.
- Set `inputmode="decimal"` on the amount field so the numeric keypad appears without the app needing a custom one.
- `-webkit-tap-highlight-color: transparent` on interactive elements, paired with real active states, since the default grey flash reads as a rendering bug.
- `overscroll-behavior-y: contain` on scroll containers to stop the whole page rubber-banding when a list is pulled.
- `user-select: none` on buttons and chips. Long-pressing a control should not raise a text selection callout.

### Install metadata

- `apple-touch-icon` as a `<link>` tag at 180x180. iOS does not reliably read icons from the manifest, and without this the home screen gets a blurry screenshot of the page.
- `"display": "standalone"` in the manifest, plus `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` meta tags.
- Set `theme-color` to match the app background so the status bar area does not read as a seam.

### Testing workflow

- Chrome DevTools has no iPhone 16 Pro Max preset. Add a custom device at 440 x 956 with a device pixel ratio of 3.
- Service workers require HTTPS, and a LAN address like `192.168.x.x` does not qualify even though `localhost` does. Testing install behavior over the local network therefore needs a tunnel such as `cloudflared` or `ngrok`, or a deploy to a hosting preview URL. Do not spend time debugging a service worker that is failing only because the origin is insecure.
- **Sign-in state does not transfer between Safari and the installed app.** They are separate origins, so the installed app starts signed out. The data is all still there — sign in again and it syncs down.
- After the app is installed, a new deploy is picked up by the service worker but not shown until the app is fully closed and reopened. When a change appears to have no effect on the phone, check this before assuming the deploy failed.

## Conventions

- TypeScript strict mode, no `any`
- All money handling goes through a single `money.ts` module: parsing input, arithmetic, splitting, formatting. Money math outside that module is a bug.
- All date handling goes through a single `dates.ts` module: period boundaries, week start, month keys. **The week runs Monday through Sunday.** Do not use `date-fns` or `Day.js` defaults without setting `weekStartsOn: 1`, since both treat Sunday as day zero and would silently shift every weekly total by a day.
- All balances and totals go through a single `derive.ts` module. Every figure in the UI reads from there, so the `amountCents` vs. `ownShareCents` rule lives in exactly one place and cannot be applied inconsistently across screens.
- Keep components presentational, keep Firestore queries and `onSnapshot` subscriptions in hooks
- No state management library. React state and Firestore snapshots are enough at this scale.
- No unnecessary/extra lines of code. Every line of code should have value.

## Working agreements

- Ask before adding a dependency.
- Ask before changing the `Transaction` shape once real data exists, and write a migration when the answer is yes.
- Prefer editing files over creating new ones.
- When a requirement is ambiguous, ask rather than assume. The person using this app is also the person specifying it, so the answer is one question away.
