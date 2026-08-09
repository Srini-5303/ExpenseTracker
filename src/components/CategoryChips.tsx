import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';

/**
 * Single tap, no dropdown. Order is by tap frequency, not alphabetical, and
 * `other` is last and visually quieter — a prominent catch-all gets used as the
 * path of least resistance and hollows out the analytics.
 */
export default function CategoryChips() {
  // TODO: controlled selection.
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((c) => (
        <button
          key={c}
          type="button"
          className={`rounded-full border border-line px-4 py-2 text-sm active:scale-95 ${
            c === 'other' ? 'opacity-60' : ''
          }`}
          style={{ borderColor: CATEGORY_COLOR[c] }}
        >
          {CATEGORY_LABEL[c]}
        </button>
      ))}
    </div>
  );
}
