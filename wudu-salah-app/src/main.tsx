import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProgressProvider } from './contexts/ProgressContext';
import App from './App';
import './index.css';

declare global {
  interface Window {
    __splashDone?: () => void;
  }
}

function Root() {
  useEffect(() => {
    if (window.__splashDone) {
      window.__splashDone();
    }
  }, []);

  return (
    <StrictMode>
      <HashRouter>
        <ThemeProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </ThemeProvider>
      </HashRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
