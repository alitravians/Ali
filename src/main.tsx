import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import './index.css'

// Set initial direction based on stored language
const storedLang = localStorage.getItem('language') || 'en'
document.documentElement.setAttribute('dir', storedLang === 'ar' ? 'rtl' : 'ltr')
import './styles/rtl.css'
import './i18n'
import i18n from './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
)
