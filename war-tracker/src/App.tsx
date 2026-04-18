import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LiveDataProvider } from './context/LiveDataContext';
import { PhoneModeProvider } from './context/PhoneModeContext';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/shared/LoadingScreen';
import SEO from './components/shared/SEO';

// Lazy-load all pages — each becomes a separate chunk
// This reduces initial bundle from ~1MB to ~400KB (core) + on-demand chunks
const Home = lazy(() => import('./pages/Home'));
const LiveTracking = lazy(() => import('./pages/LiveTracking'));
const Analysis = lazy(() => import('./pages/Analysis'));
const Sources = lazy(() => import('./pages/Sources'));
const Cities = lazy(() => import('./pages/Cities'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Admin = lazy(() => import('./pages/Admin'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const Analytics = lazy(() => import('./pages/Analytics'));

function DynamicSEO() {
  const { pathname } = useLocation();
  const basePath = pathname.startsWith('/cities/') ? '/cities' : pathname;
  return <SEO path={basePath} />;
}

export default function App() {
  return (
    <PhoneModeProvider>
    <LiveDataProvider>
      <DynamicSEO />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<LiveTracking />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/cities/:cityId" element={<Cities />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </Suspense>
    </LiveDataProvider>
    </PhoneModeProvider>
  );
}
