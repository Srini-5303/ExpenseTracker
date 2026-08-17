import { lazy, Suspense, useState } from 'react';
import AppShell from '@/components/AppShell';
import TabBar, { type Tab } from '@/components/TabBar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Home from '@/screens/Home';
import SettingsScreen from '@/screens/SettingsScreen';
import SignIn from '@/screens/SignIn';

// Recharts is most of the bundle. The daily-entry flow is the one that has to be
// fast, so it does not wait on a chart library it never uses.
const Analytics = lazy(() => import('@/screens/Analytics'));

export default function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routed />
      </AppShell>
    </AuthProvider>
  );
}

/**
 * No router. Three tabs and a modal entry sheet is the whole navigation surface;
 * a router would be more code than the app needs.
 */
function Routed() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('home');

  // Blank rather than a login screen while the session is restored, so a
  // returning user never sees a sign-in form flash past.
  if (loading) return <div className="flex-1" />;
  if (!user) return <SignIn />;

  return (
    <>
      {tab === 'home' && <Home />}
      {tab === 'analytics' && (
        <Suspense fallback={<div className="flex-1" />}>
          <Analytics />
        </Suspense>
      )}
      {tab === 'settings' && <SettingsScreen />}
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
