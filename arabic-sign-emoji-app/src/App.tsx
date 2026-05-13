import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import SplashScreen from "./components/SplashScreen";
import PrivacyAgreement from "./components/PrivacyAgreement";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import AchievementsPage from "./pages/AchievementsPage";
import InteractivePage from "./pages/InteractivePage";
import UpdatesPage from "./pages/UpdatesPage";
import NotificationsPage from "./pages/NotificationsPage";
import GuidePage from "./pages/GuidePage";

function AppRoot() {
  const { agreed, acceptAgreement } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (splashDone) return;
    const t = window.setTimeout(() => setSplashDone(true), 3500);
    return () => window.clearTimeout(t);
  }, [splashDone]);

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  if (!agreed) {
    return <PrivacyAgreement onAgree={acceptAgreement} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/interactive" element={<InteractivePage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}
