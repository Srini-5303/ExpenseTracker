export type TxType = 'expense' | 'income' | 'reimbursement' | 'card_payment';

export type PayMethod = 'credit' | 'debit' | 'cash';

export type Category =
  | 'groceries'
  | 'restaurant'
  | 'cab'
  | 'utilities'
  | 'rent'
  | 'subscriptions'
  | 'shopping' // personal shopping: clothes, electronics, household goods
  | 'guilty_pleasure'
  | 'travel'
  | 'other';

export interface Transaction {
  id: string;
  date: string; // 'YYYY-MM-DD', local date, never a UTC timestamp
  type: TxType;
  amountCents: number; // full charge or full amount received, always positive
  ownShareCents: number; // equals amountCents when nothing was split
  category?: Category; // required for expenses, absent for all other types
  method?: PayMethod; // required for expenses and card payments
  note?: string;
  /**
   * A trip name, on any category. Deliberately NOT a second category: a meal on
   * holiday is still `restaurant`, so category totals keep summing to exactly
   * the period's spending. Trips are an orthogonal dimension, which is what lets
   * "what did Lisbon cost" and "what do I spend eating out" both be answerable
   * from the same record.
   */
  trip?: string;
  createdAt: number;
}

/**
 * A recurring subscription is a REMINDER, not an automated transaction. Nothing
 * is ever written to the ledger without the monthly prompt being answered yes,
 * so a cancelled or re-priced service can never silently inflate the totals.
 *
 * Free trials deliberately produce no rule: they are logged once at $0 and then
 * forgotten until you decide to pay for the thing.
 */
export interface Subscription {
  id: string;
  name: string;
  amountCents: number;
  dayOfMonth: number; // 1–31, clamped to the month's length when it comes due
  method: PayMethod;
  lastLoggedMonth: string; // 'YYYY-MM'; set at creation so it never prompts twice
}

/** Stored as fields on the account's own document. */
export interface Settings {
  creditLimitCents?: number; // optional, enables the available-credit readout
  lastExportAt?: number;
}
