import type { Category } from '@/types';
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';

/**
 * Single tap, no dropdown. Order is by how often a chip is actually tapped, not
 * alphabetical — see CATEGORY_ORDER. `other` is last and quieter, because a
 * prominent catch-all becomes the path of least resistance and hollows out the
 * analytics.
 */
export default function CategoryChips({
  value,
  onChange,
}: {
  value: Category | null;
  onChange: (category: Category) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-5">
      {CATEGORY_ORDER.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-pressed={selected}
            // Selection is a colored outline, not a colored fill: at these
            // lightnesses a filled chip cannot hold legible text across all
            // eight hues.
            style={selected ? { borderColor: CATEGORY_COLOR[c] } : undefined}
            className={`rounded-full border px-3.5 py-2 text-sm active:scale-95 ${
              selected
                ? 'bg-raised font-medium text-ink'
                : c === 'other'
                  ? 'border-line/60 text-dim'
                  : 'border-line text-ink'
            }`}
          >
            <span
              className="mr-2 inline-block size-1.5 rounded-full align-middle"
              style={{ backgroundColor: CATEGORY_COLOR[c] }}
            />
            {CATEGORY_LABEL[c]}
          </button>
        );
      })}
    </div>
  );
}
