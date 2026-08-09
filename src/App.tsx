import { lazy, Suspense, useState } from 'react';
import AppShell from '@/components/AppShell';
import TabBar, { type Tab } from '@/components/TabBar';
import Home from '@/screens/Home';
import DataScreen from '@/screens/DataScreen';

// Recharts is most of the bundle. The daily-entry flow is the one that has to be
// fast, so it does not wait on a chart library it never uses.
const Analytics = lazy(() => import('@/screens/Analytics'));

/**
 * No router. Three tabs and a modal entry sheet is the whole navigation surface;
 * a router would be more code than the app needs.
 */
export default function App() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <AppShell>
      {tab === 'home' && <Home onGoToData={() => setTab('data')} />}
      {tab === 'analytics' && (
        <Suspense fallback={<div className="flex-1" />}>
          <Analytics />
        </Suspense>
      )}
      {tab === 'data' && <DataScreen />}
      <TabBar active={tab} onChange={setTab} />
    </AppShell>
  );
}
