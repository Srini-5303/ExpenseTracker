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
  'guilty_pleasure',
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
  guilty_pleasure: 'Guilty pleasure',
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
 * Nine hues. Each is snapped into the OKLCH band L 0.48–0.67 against the #0c1113
 * surface, and lightness varies deliberately as well as hue: red and green sit
 * at opposite ends of the band because protanopia and deuteranopia collapse that
 * pair by hue alone. Validated against adjacent-pair CVD separation, the
 * normal-vision floor, and 3:1 contrast.
 *
 * `other` is the one deliberate exception — it is gray, below the chroma floor,
 * because a catch-all that looks as inviting as a real category gets used as the
 * path of least resistance and hollows out the analytics. Every chart labels its
 * categories by name, so color is never the only thing carrying identity.
 *
 * This is the only place these values exist. Chips, rows, and chart segments all
 * read from here, so the mapping cannot drift between a stylesheet and a chart.
 */
export const CATEGORY_COLOR: Record<Category, string> = {
  restaurant: '#c84a1e',
  groceries: '#3dad57',
  cab: '#2592fa',
  shopping: '#ca4b83',
  guilty_pleasure: '#8d5400',
  rent: '#ae9200',
  utilities: '#009393',
  subscriptions: '#7b50b9',
  other: '#6e7b80',
};
