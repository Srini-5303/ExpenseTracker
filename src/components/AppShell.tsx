import type { ReactNode } from 'react';

/**
 * The app is 440 x 956 and nothing else. On wider viewports it stays 440px wide,
 * centered on a neutral field, so laptop review shows the real phone layout and
 * no separate desktop design is ever needed.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full justify-center bg-field">
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-bg">
        {children}
      </div>
    </div>
  );
}
