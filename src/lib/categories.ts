import type { Category } from '@/types';

/**
 * Ordered by how often a category is actually tapped, not alphabetically.
 * Daily/weekly first, monthly at the end, `other` last and visually quieter —
 * a prominent catch-all becomes the path of least resistance and hollows out
 * the analytics.
 */
export const CATEGORY_ORDER: readonly Category[] = [
  'restaurant',
  'groceries',
  'cab',
  'shopping',
  'rent',
  'utilities',
  'subscriptions',
  'other',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  restaurant: 'Restaurant',
  groceries: 'Groceries',
  cab: 'Cab',
  shopping: 'Shopping',
  rent: 'Rent',
  utilities: 'Utilities',
  subscriptions: 'Subscriptions',
  other: 'Other',
};

/**
 * The only saturated color in the app, and the same mapping everywhere: chips,
 * list dots, chart segments. A category that is teal in the donut and amber in
 * the list is a category the user cannot track.
 *
 * Eight hues spaced around the wheel at roughly matched luminance, so no segment
 * dominates a donut by brightness alone. `other` is the one unsaturated entry —
 * a catch-all that looks inviting gets used as the path of least resistance.
 *
 * Mirrored as --color-cat-* in index.css. Change one, change both.
 */
export const CATEGORY_COLOR: Record<Category, string> = {
  restaurant: '#ff7a5b',
  groceries: '#58dd9b',
  cab: '#4fb0ff',
  shopping: '#ff7ea8',
  rent: '#e8c245',
  utilities: '#46d9d0',
  subscriptions: '#8e9bff',
  other: '#6e7b80',
};
