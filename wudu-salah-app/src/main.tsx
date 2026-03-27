import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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
      <BrowserRouter>
        <ThemeProvider>
          <ProgressProvider>
            <App />
          </ProgressProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
