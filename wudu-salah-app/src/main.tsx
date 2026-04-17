import { StrictMode, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProgressProvider } from './contexts/ProgressContext';
import LoadingScreen from './components/LoadingScreen';
import WelcomePage from './pages/WelcomePage';
import App from './App';
import { initPushNotifications } from './utils/pushNotifications';
import { initLocalNotifications } from './utils/notificationService';
import './index.css';

declare global {
  interface Window {
    __splashDone?: () => void;
  }
}

function Root() {
  const [appState, setAppState] = useState<'loading' | 'welcome' | 'app'>('loading');

  useEffect(() => {
    if (window.__splashDone) {
      window.__splashDone();
    }
    initPushNotifications();
    initLocalNotifications();
  }, []);

  const handleLoadingComplete = useCallback(() => {
    const hasSeenWelcome = localStorage.getItem('wudu_welcome_seen');
    if (hasSeenWelcome) {
      setAppState('app');
    } else {
      setAppState('welcome');
    }
  }, []);

  const handleWelcomeContinue = useCallback(() => {
    setAppState('app');
  }, []);

  return (
    <StrictMode>
      <HashRouter>
        <ThemeProvider>
          <ProgressProvider>
            {appState === 'loading' && (
              <LoadingScreen onComplete={handleLoadingComplete} />
            )}
            {appState === 'welcome' && (
              <WelcomePage onContinue={handleWelcomeContinue} />
            )}
            {appState === 'app' && (
              <App />
            )}
          </ProgressProvider>
        </ThemeProvider>
      </HashRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
