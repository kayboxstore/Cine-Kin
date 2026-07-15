import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { TRPCProvider } from '@/providers/trpc'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(() => {
        // Service worker registration failed silently
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <TRPCProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TRPCProvider>
      </MotionConfig>
    </HelmetProvider>
  </StrictMode>,
)
