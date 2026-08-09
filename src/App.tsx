import { useState } from 'react';
import AppShell from '@/components/AppShell';
import TabBar, { type Tab } from '@/components/TabBar';
import Home from '@/screens/Home';
import Analytics from '@/screens/Analytics';
import DataScreen from '@/screens/DataScreen';

/**
 * No router. Three tabs and a modal entry sheet is the whole navigation surface;
 * a router would be more code than the app needs.
 */
export default function App() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <AppShell>
      {tab === 'home' && <Home />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'data' && <DataScreen />}
      <TabBar active={tab} onChange={setTab} />
    </AppShell>
  );
}
