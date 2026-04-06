import { Routes, Route } from 'react-router-dom';
import { LiveDataProvider } from './context/LiveDataContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import LiveTracking from './pages/LiveTracking';
import Analysis from './pages/Analysis';
import Sources from './pages/Sources';
import Cities from './pages/Cities';
import Alerts from './pages/Alerts';
import Admin from './pages/Admin';

export default function App() {
  return (
    <LiveDataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<LiveTracking />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/cities" element={<Cities />} />
          <Route path="/cities/:cityId" element={<Cities />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </LiveDataProvider>
  );
}
