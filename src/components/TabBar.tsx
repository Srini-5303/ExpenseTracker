export type Tab = 'home' | 'analytics' | 'settings';

/** Bottom-anchored, safe-area padded — without that it sits under the home indicator. */
export default function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: readonly { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <nav className="safe-bottom flex border-t border-line bg-bg">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-3 text-sm ${active === t.id ? 'text-ink' : 'text-dim'}`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
