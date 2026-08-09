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
  createdAt: number;
}

export interface Settings {
  id: 'settings';
  creditLimitCents?: number; // optional, enables the available-credit readout
  lastExportAt?: number;
}
