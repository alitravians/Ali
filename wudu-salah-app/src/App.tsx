import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WuduIntroPage from './pages/WuduIntroPage';
import WuduConditionsPage from './pages/WuduConditionsPage';
import WuduStepsPage from './pages/WuduStepsPage';
import WuduMistakesPage from './pages/WuduMistakesPage';
import WuduInvalidatorsPage from './pages/WuduInvalidatorsPage';
import SalahIntroPage from './pages/SalahIntroPage';
import SalahConditionsPage from './pages/SalahConditionsPage';
import SalahPillarsPage from './pages/SalahPillarsPage';
import SalahObligationsPage from './pages/SalahObligationsPage';
import SalahSunnahPage from './pages/SalahSunnahPage';
import SalahStepsPage from './pages/SalahStepsPage';
import SalahMistakesPage from './pages/SalahMistakesPage';
import SalahInvalidatorsPage from './pages/SalahInvalidatorsPage';
import ChildrenPage from './pages/ChildrenPage';
import AdultsPage from './pages/AdultsPage';
import AdhkarPage from './pages/AdhkarPage';
import QuizPage from './pages/QuizPage';
import FavoritesPage from './pages/FavoritesPage';
import AchievementsPage from './pages/AchievementsPage';
import FAQPage from './pages/FAQPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="wudu" element={<WuduIntroPage />} />
        <Route path="wudu/conditions" element={<WuduConditionsPage />} />
        <Route path="wudu/steps" element={<WuduStepsPage />} />
        <Route path="wudu/mistakes" element={<WuduMistakesPage />} />
        <Route path="wudu/invalidators" element={<WuduInvalidatorsPage />} />
        <Route path="salah" element={<SalahIntroPage />} />
        <Route path="salah/conditions" element={<SalahConditionsPage />} />
        <Route path="salah/pillars" element={<SalahPillarsPage />} />
        <Route path="salah/obligations" element={<SalahObligationsPage />} />
        <Route path="salah/sunnah" element={<SalahSunnahPage />} />
        <Route path="salah/steps" element={<SalahStepsPage />} />
        <Route path="salah/mistakes" element={<SalahMistakesPage />} />
        <Route path="salah/invalidators" element={<SalahInvalidatorsPage />} />
        <Route path="children" element={<ChildrenPage />} />
        <Route path="adults" element={<AdultsPage />} />
        <Route path="adhkar" element={<AdhkarPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
