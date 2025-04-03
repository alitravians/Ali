import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/LocalAuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
